import { compareVersions, isValidVersion, parseVersion } from "./semver";

describe("semver", () => {
  test("isValidVersion", () => {
    expect(isValidVersion("1.2.3")).toBe(true);
    expect(isValidVersion("1.2.3-rc.1")).toBe(false);
    expect(isValidVersion("1.2.3-rc.1+build.1")).toBe(false);
    expect(isValidVersion("1.2.3+build.1")).toBe(false);
    expect(isValidVersion("1.2.3+build.1.2")).toBe(false);
    expect(isValidVersion("1.2.3+build.1.2.3")).toBe(false);
    expect(isValidVersion("1.2.3+build.")).toBe(false);
    expect(isValidVersion("1.2.3+build")).toBe(false);
    expect(isValidVersion("1.2.3+build.1.")).toBe(false);
  });

  test("parseVersion", () => {
    expect(parseVersion("1.2.3")).toEqual([1, 2, 3]);
    expect(parseVersion("v1.2.3")).toEqual([1, 2, 3]);
    expect(() => parseVersion("1.2.3-rc.1")).toThrow();
    expect(() => parseVersion("1.2.3-rc.1+build.1")).toThrow();
    expect(() => parseVersion("1.2.3+build.1")).toThrow();
  });

  test("compareVersions", () => {
    expect(compareVersions("1.2.3", "1.2.3")).toBe(0);
    expect(compareVersions("1.2.3", "1.2.4")).toBe(-1);
    expect(compareVersions("1.2.3", "1.3.3")).toBe(-1);
    expect(compareVersions("1.2.3", "2.2.3")).toBe(-1);
    expect(compareVersions("1.2.3", "1.2.2")).toBe(1);
    expect(compareVersions("1.2.3", "1.1.3")).toBe(1);
    expect(compareVersions("1.2.3", "0.2.3")).toBe(1);
  });
});
