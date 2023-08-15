import child_process from "child_process";
import { installDependency } from "./installDependency";

describe("installDependency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(child_process, "execSync")
      .mockImplementation((command: string) => {
        return Buffer.from("");
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should install dependency", () => {
    installDependency({
      installScript: "npm install",
      currentDir: "/",
    });

    expect(child_process.execSync).toHaveBeenCalledTimes(1);
    expect(child_process.execSync).toHaveBeenCalledWith(
      "cd / && npm install && cd -",
    );
  });
});
