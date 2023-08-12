import fs from "fs";

export function getExcludedDependencies({
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
