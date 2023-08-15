import { close } from "./close";
import fs from "fs";

const unlinkSync = jest.spyOn(fs, "unlinkSync").mockImplementation(() => {});

const exit = jest
  .spyOn(process, "exit")
  .mockImplementation((code?: number) => undefined as never);

describe("close", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should remove cache file after auto mode", () => {
    close({
      auto: true,
      cache: false,
      cacheFile: "cache.json",
      currentDir: "/",
    });

    expect(unlinkSync).toHaveBeenCalledWith("/cache.json");
    expect(exit).toHaveBeenCalledWith(0);
  });

  test("should not remove cache file after manual mode without cache", () => {
    close({
      auto: false,
      cache: false,
      cacheFile: "cache.json",
      currentDir: "/",
    });

    expect(unlinkSync).not.toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(0);
  });
});
