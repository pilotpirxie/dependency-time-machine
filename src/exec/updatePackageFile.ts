import { Dependency } from "../types/Dependency";
import fs from "fs";

export function updatePackageFile({
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
