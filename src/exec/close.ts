import fs from "fs";
import path from "path";

export function close({
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
