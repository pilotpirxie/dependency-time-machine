import { LocalDependencies } from "../types/LocalDependencies";
import { Dependency } from "../types/Dependency";
import { compareVersions } from "../util/semver";

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
        compareVersions(
          localDependencies[dependency.name],
          dependency.version
        ) === 0
      );
    })
    .sort((a, b) => {
      return b.published.getTime() - a.published.getTime();
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

  console.log(
    JSON.stringify(
      {
        "Average release time": new Date(averageReleaseTime).toISOString(),
        "Oldest dependency": oldestDependency,
        "Newest dependency": newestDependency,
        "Dependency count": dependencyCount,
      },
      null,
      2
    )
  );
}
