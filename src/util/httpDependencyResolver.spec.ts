import httpDependencyResolver from "./httpDependencyResolver";

describe("httpDependencyResolver", () => {
  test("should return dependencies", async () => {
    const deps = await httpDependencyResolver(
      "react",
      "https://registry.npmjs.org"
    );

    expect(deps.length).toBeGreaterThan(0);
    expect(deps[0].name).toBe("react");
    expect(deps[0].version).toBeDefined();
    expect(deps[0].published).toBeDefined();
  });

  test("should throw error on invalid registry", async () => {
    await expect(
      httpDependencyResolver("react", "https://registry.npmjs.org/invalid")
    ).rejects.toThrow();
  });

  test("should throw error on invalid dependency name", async () => {
    const depName = "@types/" + Math.random().toString();

    await expect(
      httpDependencyResolver(depName, "https://registry.npmjs.org")
    ).rejects.toThrow();
  });
});
