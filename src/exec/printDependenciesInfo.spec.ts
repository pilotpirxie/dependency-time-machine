import { printDependenciesInfo } from "./printDependenciesInfo";

describe("printDependenciesInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should print dependencies info", () => {
    const info = printDependenciesInfo({
      localDependencies: {
        react: "17.0.2",
        "react-dom": "17.0.2",
      },
      sortedRemoteDependencies: [
        {
          name: "react",
          version: "17.0.2",
          published: new Date("2021-03-18T16:10:00.000Z").toISOString(),
        },
        {
          name: "react-dom",
          version: "17.0.2",
          published: new Date("2021-03-18T16:00:00.000Z").toISOString(),
        },
      ],
    });

    expect(info).toBeDefined();
    expect(info).toEqual(
      `{
  "Average release time": "2021-03-18T16:05:00.000Z",
  "Oldest dependency": {
    "name": "react-dom",
    "version": "17.0.2",
    "published": "2021-03-18T16:00:00.000Z"
  },
  "Newest dependency": {
    "name": "react",
    "version": "17.0.2",
    "published": "2021-03-18T16:10:00.000Z"
  },
  "Dependency count": 2
}`,
    );
  });
});
