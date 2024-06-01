import { LocalDependencies } from "../types/LocalDependencies";
import { Dependency } from "../types/Dependency";
import { compareVersions, isValidVersion } from "../util/semver";

export function printDependenciesInfo({
  localDependencies,
  sortedRemoteDependencies,
}: {
  localDependencies: LocalDependencies;
  sortedRemoteDependencies: Dependency[];
}) {
  const remoteInfoAboutLocalDependencies = sortedRemoteDependencies
    .filter((dependency) => {
      
      return (
        localDependencies[dependency.name] && 
        isValidVersion(localDependencies[dependency.name]) && 
        isValidVersion(dependency.version) &&
        compareVersions(
          localDependencies[dependency.name],
          dependency.version,
        ) === 0
      );
    })
    .sort((a, b) => {
      return new Date(b.published).getTime() - new Date(a.published).getTime();
    });

  const averageReleaseTime =
    remoteInfoAboutLocalDependencies.reduce((acc, dependency) => {
      const date = new Date(dependency.published);
      return acc + date.getTime();
    }, 0) / remoteInfoAboutLocalDependencies.length;

  const newestDependency = remoteInfoAboutLocalDependencies[0];

  const oldestDependency =
    remoteInfoAboutLocalDependencies[
      remoteInfoAboutLocalDependencies.length - 1
    ];

  const dependencyCount = Object.keys(localDependencies).length;

  return JSON.stringify(
    {
      "Average release time": new Date(averageReleaseTime).toISOString(),
      "Oldest dependency": oldestDependency,
      "Newest dependency": newestDependency,
      "Dependency count": dependencyCount,
    },
    null,
    2,
  );
}
