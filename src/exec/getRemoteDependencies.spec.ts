import { getRemoteDependencies } from "./getRemoteDependencies";
import fs from "fs";

describe("getRemoteDependencies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should check cache", async () => {
    const existsSync = jest.spyOn(fs, "existsSync").mockReturnValue(true);
    const readFileSync = jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue(JSON.stringify([]));

    const dependencies = await getRemoteDependencies({
      localDependencies: {},
      cache: true,
      cacheFilePath: "cache.json",
      excludedDependencies: [],
      registryUrl: "",
      allowNonSemver: false,
    });

    expect(existsSync).toHaveBeenCalledWith("cache.json");
    expect(dependencies).toBeDefined();
    expect(dependencies).toEqual([]);
    expect(readFileSync).toHaveBeenCalledWith("cache.json", "utf-8");
  });

  test("should not check cache", async () => {
    const existsSync = jest.spyOn(fs, "existsSync").mockReturnValue(false);
    const readFileSync = jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue(JSON.stringify({}));

    const dependencies = await getRemoteDependencies({
      localDependencies: {},
      cache: false,
      cacheFilePath: "cache.json",
      excludedDependencies: [],
      registryUrl: "",
      allowNonSemver: false,
    });

    expect(existsSync).toHaveBeenCalledWith("cache.json");
    expect(dependencies).toBeDefined();
    expect(dependencies).toEqual([]);
    expect(readFileSync).not.toHaveBeenCalled();
  });

  test("should return empty array if no dependencies", async () => {
    const dependencies = await getRemoteDependencies({
      localDependencies: {},
      cache: false,
      cacheFilePath: "cache.json",
      excludedDependencies: [],
      registryUrl: "",
      allowNonSemver: false,
    });

    expect(dependencies).toBeDefined();
    expect(dependencies).toEqual([]);
  });

  test("should return dependencies", async () => {
    const dependencies = await getRemoteDependencies({
      localDependencies: {
        react: "17.0.2",
        webpack: "5.38.1",
      },
      cache: false,
      cacheFilePath: "cache.json",
      excludedDependencies: [],
      registryUrl: "https://registry.npmjs.org",
      allowNonSemver: false,
    });

    expect(dependencies).toBeDefined();
    expect(dependencies.length).toBeGreaterThan(0);
    expect(dependencies.some((dependency) => dependency.name === "react")).toBe(
      true,
    );
    expect(
      dependencies.some((dependency) => dependency.name === "webpack"),
    ).toBe(true);
  });
});
