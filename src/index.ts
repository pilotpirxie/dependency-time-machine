#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { Dependency } from "./types/dependency";
import httpDependencyResolver from "./util/httpDependencyResolver";
import { compareVersions, isValidVersion } from "./util/semver";
import { program } from "@commander-js/extra-typings";
import child_process from "child_process";

type LocalDependencies = {
  [key: string]: string;
};

function getDependenciesFromPackageJson({
  packageFilePath,
}: {
  packageFilePath: string;
}): LocalDependencies {
  const currentDir = process.cwd();
  const packageJson = JSON.parse(fs.readFileSync(packageFilePath, "utf-8"));

  const dependencies = packageJson.dependencies;
  const devDependencies = packageJson.devDependencies;
  const peerDependencies = packageJson.peerDependencies;
  const optionalDependencies = packageJson.optionalDependencies;

  return {
    ...dependencies,
    ...devDependencies,
    ...peerDependencies,
    ...optionalDependencies,
  };
}

async function getRemoteDependencies({
  localDependencies,
  cache,
  cacheFilePath,
}: {
  localDependencies: LocalDependencies;
  cache: boolean;
  cacheFilePath: string;
}): Promise<Dependency[]> {
  const cacheExists = fs.existsSync(cacheFilePath);
  if (cacheExists) {
    return JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));
  }

  let remoteDependencies: Dependency[] = [];
  const dependenciesCount = Object.keys(localDependencies).length;
  for (let i = 0; i < dependenciesCount; i++) {
    const [name] = Object.entries(localDependencies)[i];
    console.log(i, "/", dependenciesCount, " - ", name);
    const newDependency = await httpDependencyResolver(name);
    remoteDependencies.push(...newDependency);
  }

  remoteDependencies = remoteDependencies.filter((dependency) =>
    isValidVersion(dependency.version),
  );

  const sortedRemoteDependencies = remoteDependencies
    .sort((a, b) => {
      return b.published.getTime() - a.published.getTime();
    })
    .reverse();

  if (cache) {
    fs.mkdirSync(path.dirname(cacheFilePath), {
      recursive: true,
    });

    fs.writeFileSync(
      cacheFilePath,
      JSON.stringify(sortedRemoteDependencies, null, 2),
    );
  }

  return sortedRemoteDependencies;
}

function updatePackageFile({
  packageFilePath,
  dependencyToUpdate,
  printJson,
}: {
  dependencyToUpdate: Dependency;
  printJson: boolean;
  packageFilePath: string;
}) {
  if (!printJson) {
    console.log(
      "Updating",
      `${dependencyToUpdate.name}@${dependencyToUpdate.version}`,
      "in",
      packageFilePath,
    );
  }
  const packageJson = JSON.parse(fs.readFileSync(packageFilePath, "utf-8"));
  const { dependencies, devDependencies, peerDependencies } = packageJson;

  if (dependencies[dependencyToUpdate.name]) {
    dependencies[dependencyToUpdate.name] = dependencyToUpdate.version;
  } else if (devDependencies[dependencyToUpdate.name]) {
    devDependencies[dependencyToUpdate.name] = dependencyToUpdate.version;
  } else if (peerDependencies[dependencyToUpdate.name]) {
    peerDependencies[dependencyToUpdate.name] = dependencyToUpdate.version;
  }

  fs.writeFileSync(packageFilePath, JSON.stringify(packageJson, null, 2));
}

function installDependency({
  installScript,
  printJson,
  currentDir,
}: {
  installScript: string;
  currentDir: string;
  printJson: boolean;
}) {
  console.log("Installing new version");
  child_process.execSync(`cd ${currentDir} && ${installScript} && cd -`);

  if (!printJson) {
    console.log("Installed");
  }
}

program
  .name("dependency-time-machine")
  .description(
    "Tool to automatically update dependencies one-by-one in the time order",
  )
  .option(
    "-p, --packageFile <file>",
    "Path to package.json file",
    "package.json",
  )
  .option("-j, --json", "Output as JSON")
  .option("-u, --update", "Update package.json file with new versions")
  .option(
    "-is, --install-script <command>",
    "Install with script",
    "npm install",
  )
  .option("-ts, --test-script <command>", "Test command", "npm test")
  .option("-i, --install", "Install with script")
  .option("-t, --timeline", "Print timeline")
  .option("-a, --auto", "Run in auto mode")
  .option("-c, --cache", "Cache resolved dependencies")
  .option(
    "-cf, --cache-file <file>",
    "Cache file",
    "./.dependency-time-machine/cache.json",
  )
  .action(
    async ({
      json,
      packageFile,
      update,
      installScript,
      testScript,
      timeline,
      install,
      cache,
      cacheFile,
      auto,
    }) => {
      const currentDir = process.cwd();
      const packageFilePath = path.join(currentDir, packageFile);

      do {
        const localDependencies = getDependenciesFromPackageJson({
          packageFilePath,
        });
        let sortedRemoteDependencies = await getRemoteDependencies({
          localDependencies,
          cache: !!cache || !!auto,
          cacheFilePath: path.join(currentDir, cacheFile),
        });

        let previousDependency: Dependency | null = null;
        let dependencyToUpdate = null;
        const timelineToPrint: Dependency[] = [];
        for (let i = 0; i < sortedRemoteDependencies.length; i++) {
          const dependency = sortedRemoteDependencies[i];
          if (
            compareVersions(
              dependency.version,
              localDependencies[dependency.name],
            ) > 0
          ) {
            if (dependencyToUpdate === null) {
              previousDependency = {
                name: dependency.name,
                version: localDependencies[dependency.name],
                published: new Date(),
              };
              dependencyToUpdate = dependency;
              timelineToPrint.push(...sortedRemoteDependencies.slice(i));
            }

            if (dependencyToUpdate.name !== dependency.name) {
              break;
            }

            if (
              compareVersions(dependency.version, dependencyToUpdate.version) >
              0
            ) {
              dependencyToUpdate = dependency;
            }
          }
        }

        if (timeline) {
          console.log(JSON.stringify(timelineToPrint, null, 2));
          return;
        }

        if (dependencyToUpdate === null) {
          if (json) {
            console.log(JSON.stringify({}));
            return;
          }

          console.log("No new versions found");
          process.exit(0);
          return;
        }

        if (json) {
          console.log(JSON.stringify(dependencyToUpdate, null, 2));
        } else {
          console.log(
            "New version found:",
            `${dependencyToUpdate.name}@${dependencyToUpdate.version}`,
            `(${dependencyToUpdate.published})`,
          );
        }

        if (update || auto || install) {
          updatePackageFile({
            printJson: !!json,
            dependencyToUpdate,
            packageFilePath,
          });
        }

        if (install || auto) {
          installDependency({
            printJson: !!json,
            installScript,
            currentDir,
          });
        }

        if (auto) {
          try {
            console.log("Testing new version");
            child_process.execSync(`cd ${currentDir} && ${testScript} && cd -`);
          } catch (e) {
            console.log("Test failed");
            if (previousDependency) {
              console.log("Reverting to previous version");
              updatePackageFile({
                dependencyToUpdate: previousDependency,
                printJson: !!json,
                packageFilePath,
              });

              installDependency({
                printJson: !!json,
                installScript,
                currentDir,
              });
            }
          }
        }
      } while (auto);
    },
  )
  .parse();
