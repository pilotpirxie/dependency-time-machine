import { getDependenciesFromPackageJson } from "./getDependenciesFromPackageJson";
import fs from "fs";

describe("getDependenciesFromPackageJson", () => {
  test("should return dependencies from package.json", () => {
    jest.spyOn(fs, "readFileSync").mockReturnValue(
      JSON.stringify({
        dependencies: {
          react: "16.13.1",
        },
        devDependencies: {
          "@types/react": "16.9.0",
        },
        peerDependencies: {
          webpack: "4.0.0",
        },
        optionalDependencies: {
          dayjs: "1.0.0",
        },
      })
    );

    const dependencies = getDependenciesFromPackageJson({
      packageFilePath: "package.json",
    });

    expect(dependencies).toBeDefined();
    expect(dependencies).toHaveProperty("react");
    expect(dependencies).toHaveProperty("@types/react");
    expect(dependencies).toHaveProperty("webpack");
    expect(dependencies).toHaveProperty("dayjs");
    expect(dependencies).toHaveProperty("react", "16.13.1");
    expect(dependencies).toHaveProperty("@types/react", "16.9.0");
    expect(dependencies).toHaveProperty("webpack", "4.0.0");
    expect(dependencies).toHaveProperty("dayjs", "1.0.0");
    expect(dependencies).not.toHaveProperty("react-dom");
    expect(dependencies).not.toHaveProperty("@types/react-dom");
  });
});
