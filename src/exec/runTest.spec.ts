import child_process from "child_process";
import { runTest } from "./runTest";

describe("runTest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should run test with npm", () => {
    const execSyncSpy = jest
      .spyOn(child_process, "execSync")
      .mockImplementation();

    runTest({
      testScript: "npm test",
      currentDir: "/",
    });

    expect(execSyncSpy).toHaveBeenCalledTimes(1);
    expect(execSyncSpy).toHaveBeenCalledWith("cd / && npm test && cd -");
  });

  test("should run test with yarn", () => {
    const execSyncSpy = jest
      .spyOn(child_process, "execSync")
      .mockImplementation();

    runTest({
      testScript: "yarn test",
      currentDir: "/",
    });

    expect(execSyncSpy).toHaveBeenCalledTimes(1);
    expect(execSyncSpy).toHaveBeenCalledWith("cd / && yarn test && cd -");
  });

  test("should run test with pnpm", () => {
    const execSyncSpy = jest
      .spyOn(child_process, "execSync")
      .mockImplementation();

    runTest({
      testScript: "pnpm test",
      currentDir: "/",
    });

    expect(execSyncSpy).toHaveBeenCalledTimes(1);
    expect(execSyncSpy).toHaveBeenCalledWith("cd / && pnpm test && cd -");
  });

  test("should run test with custom script", () => {
    const execSyncSpy = jest
      .spyOn(child_process, "execSync")
      .mockImplementation();

    runTest({
      testScript: "test",
      currentDir: "/",
    });

    expect(execSyncSpy).toHaveBeenCalledTimes(1);
    expect(execSyncSpy).toHaveBeenCalledWith("cd / && test && cd -");
  });

  test("should run test with custom script with arguments", () => {
    const execSyncSpy = jest
      .spyOn(child_process, "execSync")
      .mockImplementation();

    runTest({
      testScript: "test --arg1 --arg2",
      currentDir: "/",
    });

    expect(execSyncSpy).toHaveBeenCalledTimes(1);
    expect(execSyncSpy).toHaveBeenCalledWith(
      "cd / && test --arg1 --arg2 && cd -",
    );
  });
});
