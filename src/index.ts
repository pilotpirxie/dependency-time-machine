#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { Dependency } from "./types/dependency";
import httpDependencyResolver from "./util/httpDependencyResolver";
import { compareVersions, isValidVersion } from "./util/semver";
import { program } from "@commander-js/extra-typings";
import child_process from "child_process";

program
  .name("dependency-time-machine")
  .description(
    "Tool to automatically update dependencies one-by-one in the time order",
  )
  .option(
    "-p, --packageFile <file>",
    "Path to package.json file",
    "package.json",
  )
  .option("-j, --json", "Output as JSON")
  .option("-u, --update", "Update package.json file with new versions")
  .option(
    "-is, --install-script <command>",
    "Install with script",
    "npm install",
  )
  .option("-ts, --test-script <command>", "Test command", "npm test")
  .option("-i, --install", "Install with script")
  .option("-t, --timeline", "Print timeline")
  .option("-a, --auto", "Run in auto mode")
  .option("-c, --cache", "Cache resolved dependencies")
  .option(
    "-cf, --cache-file <file>",
    "Cache file",
    "./.dependency-time-machine/cache.json",
  )
  .action(
    async ({
      json,
      packageFile,
      update,
      installScript,
      testScript,
      timeline,
      install,
      cache,
      cacheFile,
      auto,
    }) => {
      const currentDir = process.cwd();
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(currentDir, packageFile), "utf-8"),
      );

      const dependencies = packageJson.dependencies;
      const devDependencies = packageJson.devDependencies;
      const peerDependencies = packageJson.peerDependencies;
      const optionalDependencies = packageJson.optionalDependencies;
      const allDependencies: { [name: string]: string } = {
        ...dependencies,
        ...devDependencies,
        ...peerDependencies,
        ...optionalDependencies,
      };

      let sortedDependencies: Dependency[] = [];

      const cacheExists = fs.existsSync(path.join(currentDir, cacheFile));
      if (cacheExists) {
        sortedDependencies = JSON.parse(
          fs.readFileSync(path.join(currentDir, cacheFile), "utf-8"),
        );
      } else {
        let allDependencyVersionsWithPublishedDate: Dependency[] = [];
        const totalDependencies = Object.keys(allDependencies).length;
        for (let i = 0; i < totalDependencies; i++) {
          const [name] = Object.entries(allDependencies)[i];

          console.log(i, "/", totalDependencies, " - ", name);

          const newDependency = await httpDependencyResolver(name);

          allDependencyVersionsWithPublishedDate.push(...newDependency);
        }

        allDependencyVersionsWithPublishedDate =
          allDependencyVersionsWithPublishedDate.filter((dependency) =>
            isValidVersion(dependency.version),
          );

        sortedDependencies = allDependencyVersionsWithPublishedDate
          .sort((a, b) => {
            return b.published.getTime() - a.published.getTime();
          })
          .reverse();

        if (cache) {
          fs.mkdirSync(path.join(currentDir, path.dirname(cacheFile)), {
            recursive: true,
          });

          fs.writeFileSync(
            path.join(currentDir, cacheFile),
            JSON.stringify(sortedDependencies, null, 2),
          );
        }
      }

      let dependencyToUpdate = null;
      const depTimeline: Dependency[] = [];
      for (let i = 0; i < sortedDependencies.length; i++) {
        const dependency = sortedDependencies[i];
        if (
          compareVersions(
            dependency.version,
            allDependencies[dependency.name],
          ) > 0
        ) {
          if (dependencyToUpdate === null) {
            dependencyToUpdate = dependency;
            depTimeline.push(...sortedDependencies.slice(i));
          }

          if (dependencyToUpdate.name === dependency.name) {
            if (
              compareVersions(dependency.version, dependencyToUpdate.version) >
              0
            ) {
              dependencyToUpdate = dependency;
            }
          } else {
            break;
          }
        }
      }

      if (timeline) {
        console.log(JSON.stringify(depTimeline, null, 2));
        return;
      }

      if (dependencyToUpdate === null) {
        if (json) {
          console.log(JSON.stringify({}));
          return;
        }

        console.log("No new versions found");
        return;
      }

      if (json) {
        console.log(JSON.stringify(dependencyToUpdate, null, 2));
      } else {
        console.log(
          "New version found:",
          `${dependencyToUpdate.name}@${dependencyToUpdate.version}`,
          `(${dependencyToUpdate.published})`,
        );
      }

      if (update) {
        if (!json) {
          console.log(
            "Updating",
            `${dependencyToUpdate.name}@${dependencyToUpdate.version}`,
            "in",
            packageFile,
          );
        }

        if (dependencies[dependencyToUpdate.name]) {
          dependencies[dependencyToUpdate.name] = dependencyToUpdate.version;
        } else if (devDependencies[dependencyToUpdate.name]) {
          devDependencies[dependencyToUpdate.name] = dependencyToUpdate.version;
        } else if (peerDependencies[dependencyToUpdate.name]) {
          peerDependencies[dependencyToUpdate.name] =
            dependencyToUpdate.version;
        }

        fs.writeFileSync(
          path.join(currentDir, packageFile),
          JSON.stringify(packageJson, null, 2),
        );
      }

      if (install) {
        child_process.execSync(`cd ${currentDir} && ${installScript} && cd -`);

        if (!json) {
          console.log(
            "Installed",
            `${dependencyToUpdate.name}@${dependencyToUpdate.version}`,
          );
        }
      }
    },
  )
  .parse();
