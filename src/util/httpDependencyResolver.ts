import {Dependency} from "../types/dependency";
import {RegistryData} from "../types/registry";

export default async function httpDependencyResolver(name: string): Promise<Dependency[]> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${name}`);
    const data = await response.json() as RegistryData;
    const {time} = data;

    const dependencyVersionsWithPublishedDate: Dependency[] = [];
    for (const [version, published] of Object.entries(time)) {
      dependencyVersionsWithPublishedDate.push({
        name,
        version,
        published: new Date(published),
      });
    }

    return dependencyVersionsWithPublishedDate;
  } catch (error) {
    console.error(`Error fetching data from npm registry for ${name}`);
    throw error;
  }
}