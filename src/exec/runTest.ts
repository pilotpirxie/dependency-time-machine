import child_process from "child_process";

export function runTest({
  testScript,
  currentDir,
}: {
  testScript: string;
  currentDir: string;
}) {
  console.log("Testing new version...");
  child_process.execSync(`cd ${currentDir} && ${testScript} && cd -`);
  console.log("Test passed");
}
