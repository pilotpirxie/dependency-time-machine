#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import {Dependency} from "./types/dependency";
import httpDependencyResolver from "./util/httpDependencyResolver";
import {compareVersions, isValidVersion, parseVersion} from "./util/semver";
import { program } from "@commander-js/extra-typings";

program
  .name('dependency-time-machine')
  .description('Tool to automatically update dependencies one-by-one in the time order')
  .option('-p, --packageFile <file>', 'Path to package.json file', "package.json")
  .option('-j, --json', 'Output as JSON')
  .parse()
  .action(async ({json, packageFile}) => {
    const currentDir = process.cwd();
    const packageJson = JSON.parse(fs.readFileSync(path.join(currentDir, packageFile), 'utf-8'));

    const dependencies = packageJson.dependencies;
    const devDependencies = packageJson.devDependencies;
    const peerDependencies = packageJson.peerDependencies;
    const allDependencies: {[name: string]: string} = {
      ...dependencies,
      ...devDependencies,
      ...peerDependencies,
    }

    const allDependencyVersionsWithPublishedDate: Dependency[] = []

    const totalDependencies = Object.keys(allDependencies).length;
    for (let i = 0; i < totalDependencies; i++){
      const [name] = Object.entries(allDependencies)[i];

      console.log(i, '/', totalDependencies, ' - ', name)

      const newDependency = await httpDependencyResolver(name);

      allDependencyVersionsWithPublishedDate.push(...newDependency);
    }

    const sortedDependencies = allDependencyVersionsWithPublishedDate.sort((a, b) => {
      return b.published.getTime() - a.published.getTime();
    }).reverse();

    let outdatedDependencies: Dependency[] = [];
    for (const dependency of sortedDependencies) {
      const isDependencyValid = isValidVersion(dependency.version);
      if (!isDependencyValid) {
        continue;
      }

      if (compareVersions(dependency.version, allDependencies[dependency.name]) > 0) {

        if (!outdatedDependencies.some((d) => d.name === dependency.name)) {
          outdatedDependencies.push(dependency);
        }
      }
    }

    if (outdatedDependencies.length > 0) {
      if (json) {
        console.log(JSON.stringify(outdatedDependencies, null, 2));
        return;
      }

      console.log('Outdated dependencies:');
      for (const dependency of outdatedDependencies) {
        console.log(dependency.published.toISOString(), dependency.name, dependency.version);
      }
    } else {
      console.log('All dependencies are up to date!');
    }
  });