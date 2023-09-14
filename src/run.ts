import path from "path";
import {getExcludedDependencies} from "./exec/getExcludedDependencies";
import {getDependenciesFromPackageJson} from "./exec/getDependenciesFromPackageJson";
import {getRemoteDependencies} from "./exec/getRemoteDependencies";
import {Dependency} from "./types/Dependency";
import {
  compareDates,
  compareVersions,
  isHigherMajorVersion,
  isHigherMinorVersion,
  isValidVersion,
} from "./util/semver";
import {close} from "./exec/close";
import {updatePackageFile} from "./exec/updatePackageFile";
import {installDependency} from "./exec/installDependency";
import {runTest} from "./exec/runTest";
import {printDependenciesInfo} from "./exec/printDependenciesInfo";

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
  allowNonSemver,
  stopIfHigherMajorNumber,
  stopIfHigherMinorNumber,
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
  allowNonSemver: boolean | undefined;
  stopIfHigherMajorNumber: boolean | undefined;
  stopIfHigherMinorNumber: boolean | undefined;
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
      allowNonSemver: !!allowNonSemver,
    });

    let previousDependency: Dependency | null = null;
    let dependencyToUpdate = null;
    const timelineToPrint: Dependency[] = [];

    for (let i = 0; i < sortedRemoteDependencies.length; i++) {
      const dependency = sortedRemoteDependencies[i];

      const dependencyToCompare = sortedRemoteDependencies.find(
        (d) => d.name === dependency.name,
      );

      if (!dependencyToCompare) {
        continue;
      }

      const compareAgainstLocalDependency = !isValidVersion(
        dependency.version,
        localDependencies[dependency.name],
      )
        ? compareDates(dependency.published, dependencyToCompare.published) > 0
        : compareVersions(
            dependency.version,
            localDependencies[dependency.name],
          ) > 0;

      if (compareAgainstLocalDependency) {
        if (dependencyToUpdate === null) {
          previousDependency = {
            name: dependency.name,
            version: localDependencies[dependency.name],
            published: new Date().toISOString(),
          };
          dependencyToUpdate = dependency;
          timelineToPrint.push(...sortedRemoteDependencies.slice(i));
        }

        const versioningStop =
          (stopIfHigherMajorNumber &&
            isHigherMajorVersion(
              dependency.version,
              dependencyToUpdate.version,
            )) ||
          (stopIfHigherMinorNumber &&
            isHigherMinorVersion(
              dependency.version,
              dependencyToUpdate.version,
            ));

        if (dependencyToUpdate.name !== dependency.name || versioningStop) {
          break;
        }

        const compareAgainstDependencyToUpdate = !isValidVersion(
          dependency.version,
          dependencyToUpdate.version,
        )
          ? compareDates(dependency.published, dependencyToUpdate.published) > 0
          : compareVersions(dependency.version, dependencyToUpdate.version) > 0;

        if (compareAgainstDependencyToUpdate) {
          dependencyToUpdate = dependency;
        }
      }
    }

    if (timeline) {
      console.log(JSON.stringify(timelineToPrint, null, 2));
      return;
    }

    if (printInfo) {
      console.log(
        printDependenciesInfo({
          localDependencies,
          sortedRemoteDependencies,
        }),
      );
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
      `(${dependencyToUpdate.published})`,
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

          close({
            auto: auto,
            cache: !!cache,
            cacheFile,
            currentDir,
          });

          process.exit(1);
        }
      }
    }
  } while (auto);
};
