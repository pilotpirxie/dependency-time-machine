import { getExcludedDependencies } from "./getExcludedDependencies";
import fs from "fs";

describe("getExcludedDependencies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest.spyOn(fs, "readFileSync").mockReturnValue("react\nwebpack");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should return empty array if no exclude", () => {
    const excludedDependencies = getExcludedDependencies({
      exclude: "",
      excludeFilePath: "",
    });

    expect(excludedDependencies).toHaveLength(0);
  });

  test("should return empty array if exclude file is invalid", () => {
    const excludedDependencies = getExcludedDependencies({
      exclude: "",
      excludeFilePath: "invalid",
    });

    expect(excludedDependencies).toBeDefined();
  });

  test("should return dependencies from exclude", () => {
    const excludedDependencies = getExcludedDependencies({
      exclude: "react,webpack",
      excludeFilePath: "",
    });

    expect(excludedDependencies).toBeDefined();
    expect(excludedDependencies).toHaveLength(2);
    expect(excludedDependencies).toContain("react");
    expect(excludedDependencies).toContain("webpack");
  });

  test("should return dependencies from exclude file", () => {
    const excludedDependencies = getExcludedDependencies({
      exclude: "",
      excludeFilePath: "exclude.txt",
    });

    expect(excludedDependencies).toBeDefined();
    expect(excludedDependencies).toHaveLength(2);
    expect(excludedDependencies).toContain("react");
    expect(excludedDependencies).toContain("webpack");
  });

  test("should return dependencies from exclude and exclude file", () => {
    const excludedDependencies = getExcludedDependencies({
      exclude: "react-dom",
      excludeFilePath: "exclude.txt",
    });

    expect(excludedDependencies).toBeDefined();
    expect(excludedDependencies).toHaveLength(3);
    expect(excludedDependencies).toContain("react");
    expect(excludedDependencies).toContain("webpack");
    expect(excludedDependencies).toContain("react-dom");
  });
});
