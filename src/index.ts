#!/usr/bin/env node
import fs from "fs";
import path from "path";
import child_process from "child_process";
import { program } from "commander";

import { Dependency } from "./types/Dependency";
import { LocalDependencies } from "./types/LocalDependencies";
import httpDependencyResolver from "./util/httpDependencyResolver";
import { compareVersions, isValidVersion } from "./util/semver";

function getExcludedDependencies({
  exclude,
  excludeFilePath,
}: {
  exclude: string;
  excludeFilePath: string;
}): string[] {
  const excludedDependencies: string[] = [];

  if (
    excludeFilePath &&
    excludeFilePath.length > 0 &&
    fs.existsSync(excludeFilePath)
  ) {
    const excludeFileContent = fs.readFileSync(excludeFilePath, "utf-8");
    const excludeFileDependencies = excludeFileContent.split("\n");
    excludedDependencies.push(...excludeFileDependencies);
  }

  if (exclude && exclude.length > 0) {
    const excludeDependencies = exclude.split(",");
    excludedDependencies.push(...excludeDependencies);
  }

  return excludedDependencies;
}

function getDependenciesFromPackageJson({
  packageFilePath,
}: {
  packageFilePath: string;
}): LocalDependencies {
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
  excludedDependencies,
}: {
  localDependencies: LocalDependencies;
  cache: boolean;
  cacheFilePath: string;
  excludedDependencies: string[];
}): Promise<Dependency[]> {
  const cacheExists = fs.existsSync(cacheFilePath);
  if (cacheExists) {
    return JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));
  }

  console.log("Fetching remote dependencies...");
  let remoteDependencies: Dependency[] = [];
  const dependenciesCount = Object.keys(localDependencies).length;
  for (let i = 0; i < dependenciesCount; i++) {
    const [name] = Object.entries(localDependencies)[i];
    console.log(
      `${i}/${dependenciesCount} ${name} ${
        excludedDependencies.includes(name) ? "(excluded)" : ""
      }`
    );
    if (excludedDependencies.includes(name)) {
      continue;
    }
    const newDependency = await httpDependencyResolver(name);
    remoteDependencies.push(...newDependency);
  }

  remoteDependencies = remoteDependencies.filter((dependency) =>
    isValidVersion(dependency.version)
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
      JSON.stringify(sortedRemoteDependencies, null, 2)
    );
  }

  return sortedRemoteDependencies;
}

function updatePackageFile({
  packageFilePath,
  dependencyToUpdate,
}: {
  dependencyToUpdate: Dependency;
  packageFilePath: string;
}) {
  console.log(
    `Updating ${dependencyToUpdate.name}@${dependencyToUpdate.version} in ${packageFilePath}...`
  );
  const packageJson = JSON.parse(fs.readFileSync(packageFilePath, "utf-8"));
  const { dependencies, devDependencies, peerDependencies } = packageJson;

  if (dependencies && dependencies.hasOwnProperty(dependencyToUpdate.name)) {
    dependencies[dependencyToUpdate.name] = dependencyToUpdate.version;
  } else if (
    devDependencies &&
    devDependencies.hasOwnProperty(dependencyToUpdate.name)
  ) {
    devDependencies[dependencyToUpdate.name] = dependencyToUpdate.version;
  } else if (
    peerDependencies &&
    peerDependencies.hasOwnProperty(dependencyToUpdate.name)
  ) {
    peerDependencies[dependencyToUpdate.name] = dependencyToUpdate.version;
  }

  fs.writeFileSync(packageFilePath, JSON.stringify(packageJson, null, 2));
}

function installDependency({
  installScript,
  currentDir,
}: {
  installScript: string;
  currentDir: string;
}) {
  console.log("Installing new version");
  child_process.execSync(`cd ${currentDir} && ${installScript} && cd -`);
  console.log("Installed");
}

function runTest({
  testScript,
  currentDir,
}: {
  testScript: string;
  currentDir: string;
}) {
  console.log("Testing new version");
  child_process.execSync(`cd ${currentDir} && ${testScript} && cd -`);
  console.log("Test passed");
}

function close({
  auto,
  cache,
  cacheFile,
  currentDir,
}: {
  auto: boolean;
  cache: boolean;
  cacheFile: string;
  currentDir: string;
}) {
  if (auto && !cache) {
    console.log("Cleaning up");
    fs.unlinkSync(path.join(currentDir, cacheFile));
  }

  console.log("Done");
  process.exit(0);
}

program
  .name("dependency-time-machine")
  .description(
    "Tool to automatically update dependencies one-by-one in the time order"
  )
  .option(
    "-p, --packageFile <file>",
    "Path to package.json file",
    "package.json"
  )
  .option("-u, --update", "Update package.json file with new versions")
  .option(
    "-is, --install-script <command>",
    "Install with script",
    "npm install"
  )
  .option("-ts, --test-script <command>", "Test command", "npm test")
  .option("-i, --install", "Install with script")
  .option("-t, --timeline", "Print timeline")
  .option("-a, --auto", "Run in auto mode")
  .option("-c, --cache", "Cache resolved dependencies")
  .option(
    "-cf, --cache-file <file>",
    "Cache file",
    "./.dependency-time-machine/cache.json"
  )
  .option(
    "-e, --exclude <dependency>",
    "Exclude dependency from update, separated by comma"
  )
  .option("-x, --exclude-file <file>", "Exclude dependencies from file", "")
  .action(async (program) => {
    const packageFile = program.packageFile as string;
    const installScript = program.installScript as string;
    const testScript = program.testScript as string;
    const cache = program.cache as boolean | undefined;
    const cacheFile = program.cacheFile as string;
    const exclude = program.exclude as string | undefined;
    const excludeFile = program.excludeFile as string;
    const auto = program.auto as boolean | undefined;
    const update = program.update as boolean | undefined;
    const install = program.install as boolean | undefined;
    const timeline = program.timeline as boolean | undefined;

    const currentDir = process.cwd();
    const packageFilePath = path.join(currentDir, packageFile);

    do {
      const excludedDependencies = getExcludedDependencies({
        exclude: exclude || "",
        excludeFilePath: excludeFile ? path.join(currentDir, excludeFile) : "",
      });
      const localDependencies = getDependenciesFromPackageJson({
        packageFilePath,
      });
      let sortedRemoteDependencies = await getRemoteDependencies({
        localDependencies,
        cache: !!cache || !!auto,
        cacheFilePath: path.join(currentDir, cacheFile),
        excludedDependencies,
      });

      let previousDependency: Dependency | null = null;
      let dependencyToUpdate = null;
      const timelineToPrint: Dependency[] = [];
      for (let i = 0; i < sortedRemoteDependencies.length; i++) {
        const dependency = sortedRemoteDependencies[i];
        if (
          compareVersions(
            dependency.version,
            localDependencies[dependency.name]
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
            compareVersions(dependency.version, dependencyToUpdate.version) > 0
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
        console.log("No new versions found");
        close({
          auto: !!auto,
          cache: !!cache,
          cacheFile,
          currentDir,
        });
        return;
      }

      console.log(
        "New version found:",
        `${dependencyToUpdate.name}@${dependencyToUpdate.version}`,
        `(${dependencyToUpdate.published})`
      );

      if (update || auto || install) {
        updatePackageFile({
          dependencyToUpdate,
          packageFilePath,
        });
      }

      if (install || auto) {
        installDependency({
          installScript,
          currentDir,
        });
      }

      if (auto) {
        try {
          runTest({
            testScript,
            currentDir,
          });
        } catch (e) {
          if (previousDependency) {
            console.log("Test failed. Reverting to the previous version...");
            updatePackageFile({
              dependencyToUpdate: previousDependency,
              packageFilePath,
            });

            installDependency({
              installScript,
              currentDir,
            });

            process.exit(1);
          }
        }
      }
    } while (auto);
  })
  .parse();
