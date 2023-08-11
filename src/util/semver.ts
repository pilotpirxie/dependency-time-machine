const versionRegex = /^\D*(\d+)\.(\d+)\.(\d+)\D*$/;
const strictVersionRegex = /^\D*(\d+)\.(\d+)\.(\d+)$/;

export const isValidVersion = (version: string): boolean => {
  return Boolean(version.match(strictVersionRegex));
};

export const parseVersion = (
  version: string,
): [number, number, number, string?] => {
  const match = version.match(strictVersionRegex);

  if (!match) {
    throw new Error(`Invalid version: ${version}`);
  }

  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), match[4]];
};

export const compareVersions = (a: string, b: string): number => {
  const [majorA, minorA, patchA] = parseVersion(a);
  const [majorB, minorB, patchB] = parseVersion(b);

  if (majorA !== majorB) return majorA - majorB;
  if (minorA !== minorB) return minorA - minorB;
  if (patchA !== patchB) return patchA - patchB;

  return 0;
};
