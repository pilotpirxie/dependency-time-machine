import child_process from "child_process";

export function installDependency({
  installScript,
  currentDir,
}: {
  installScript: string;
  currentDir: string;
}) {
  console.log("Installing new version...");
  child_process.execSync(`cd ${currentDir} && ${installScript} && cd -`);
  console.log("Installed");
}
