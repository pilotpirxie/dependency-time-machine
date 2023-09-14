import { updatePackageFile } from "./updatePackageFile";
import fs from "fs";

describe("updatePackageFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should update package file", () => {
    const packageJsonMock = JSON.stringify({
      dependencies: {
        react: "17.0.1",
      },
    });

    const expectedPackageJson = JSON.stringify(
      {
        dependencies: {
          react: "17.0.2",
        },
      },
      null,
      2,
    );

    const writeFileSyncSpy = jest
      .spyOn(fs, "writeFileSync")
      .mockImplementation();
    const readFileSyncSpy = jest
      .spyOn(fs, "readFileSync")
      .mockImplementation(() => packageJsonMock);

    updatePackageFile({
      dependencyToUpdate: {
        name: "react",
        version: "17.0.2",
        published: new Date().toISOString(),
      },
      packageFilePath: "/",
    });

    expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
    expect(writeFileSyncSpy).toHaveBeenCalledWith("/", expectedPackageJson);
  });
});
