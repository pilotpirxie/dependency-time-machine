import { LocalDependencies } from "../types/LocalDependencies";
import fs from "fs";

export function getDependenciesFromPackageJson({
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
