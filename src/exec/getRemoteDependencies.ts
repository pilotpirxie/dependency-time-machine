import { LocalDependencies } from "../types/LocalDependencies";
import { Dependency } from "../types/Dependency";
import fs from "fs";
import httpDependencyResolver from "../util/httpDependencyResolver";
import { isValidVersion } from "../util/semver";
import path from "path";

export async function getRemoteDependencies({
  localDependencies,
  cache,
  cacheFilePath,
  excludedDependencies,
  registryUrl,
  allowNonSemver,
}: {
  localDependencies: LocalDependencies;
  cache: boolean;
  cacheFilePath: string;
  excludedDependencies: string[];
  registryUrl: string;
  allowNonSemver: boolean;
}): Promise<Dependency[]> {
  try {
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
        `[${i + 1}/${dependenciesCount}] ${name} ${
          excludedDependencies.includes(name) ? "(excluded)" : ""
        }`,
      );
      if (excludedDependencies.includes(name)) {
        continue;
      }
      const newDependency = await httpDependencyResolver(name, registryUrl);
      remoteDependencies.push(...newDependency);
    }

    remoteDependencies = remoteDependencies.filter(
      (dependency) => isValidVersion(dependency.version) || allowNonSemver,
    );

    const sortedRemoteDependencies = remoteDependencies
      .sort((a, b) => {
        return (
          new Date(b.published).getTime() - new Date(a.published).getTime()
        );
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
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
