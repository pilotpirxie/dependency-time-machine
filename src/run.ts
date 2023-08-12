import path from "path";
import { getExcludedDependencies } from "./exec/getExcludedDependencies";
import { getDependenciesFromPackageJson } from "./exec/getDependenciesFromPackageJson";
import { getRemoteDependencies } from "./exec/getRemoteDependencies";
import { Dependency } from "./types/Dependency";
import { compareVersions } from "./util/semver";
import { close } from "./exec/close";
import { updatePackageFile } from "./exec/updatePackageFile";
import { installDependency } from "./exec/installDependency";
import { runTest } from "./exec/runTest";
import { printDependenciesInfo } from "./exec/printDependenciesInfo";

export const run = async ({
  packageFile,
  installScript,
  testScript,
  cache,
  cacheFile,
  exclude,
  excludeFile,
  auto,
  update,
  install,
  timeline,
  registryUrl,
  printInfo,
}: {
  packageFile: string;
  installScript: string;
  testScript: string;
  cache: boolean | undefined;
  cacheFile: string;
  exclude: string;
  excludeFile: string;
  auto: boolean | undefined;
  update: boolean | undefined;
  install: boolean | undefined;
  timeline: boolean | undefined;
  registryUrl: string;
  printInfo: boolean | undefined;
}) => {
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
      registryUrl,
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

    if (printInfo) {
      printDependenciesInfo({
        localDependencies,
        sortedRemoteDependencies,
      });
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
};
