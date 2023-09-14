import { Dependency } from "../types/Dependency";
import { RegistryData } from "../types/RegistryData";
import { get } from "https";

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    get(url, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData as T);
        } catch (error) {
          reject(error as Error);
        }
      });
    }).on("error", (error) => {
      reject(error);
    });
  });
}

export default async function httpDependencyResolver(
  name: string,
  registryUrl: string,
): Promise<Dependency[]> {
  const url = `${registryUrl}/${name}`;
  try {
    const response = await fetchJson<RegistryData>(url);
    const { time } = response;

    const dependencyVersionsWithPublishedDate: Dependency[] = [];
    for (const [version, published] of Object.entries(time)) {
      dependencyVersionsWithPublishedDate.push({
        name,
        version,
        published: new Date(published).toISOString(),
      });
    }

    return dependencyVersionsWithPublishedDate;
  } catch (error) {
    console.error(`Error fetching data ${url}`);
    throw error;
  }
}
