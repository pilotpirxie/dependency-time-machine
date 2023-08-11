import { Dependency } from "../types/dependency";
import { RegistryData } from "../types/registry";
import axios from "axios";

export default async function httpDependencyResolver(
  name: string,
): Promise<Dependency[]> {
  try {
    const response = await axios.get<RegistryData>(
      `https://registry.npmjs.org/${name}`,
    );
    const { time } = response.data;

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
