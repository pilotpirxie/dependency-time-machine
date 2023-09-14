// const strictVersionRegex = /^\D*(\d+)\.(\d+)\.(\d+)\D*$/;
const strictVersionRegex = /^\D*(\d+)\.(\d+)\.(\d+)$/;

export const isValidVersion = (...version: string[]): boolean => {
  return version.every((v) => strictVersionRegex.test(v));
};

export const parseVersion = (
  version: string,
): [number, number, number, string?] => {
  const match = version.match(strictVersionRegex);

  if (!match) {
    throw new Error(`Invalid version: ${version}`);
  }

  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
};

export const compareVersions = (a: string, b: string): number => {
  const [majorA, minorA, patchA] = parseVersion(a);
  const [majorB, minorB, patchB] = parseVersion(b);

  if (majorA !== majorB) return majorA - majorB;
  if (minorA !== minorB) return minorA - minorB;
  if (patchA !== patchB) return patchA - patchB;

  return 0;
};

export const compareDates = (a: string, b: string): number => {
  const dateA = new Date(a);
  const dateB = new Date(b);

  const result = dateA.getTime() - dateB.getTime();

  if (result === 0) return 0;
  if (result > 0) return 1;
  if (result < 0) return -1;

  return 0;
};

export const isHigherMajorVersion = (a: string, b: string): boolean => {
  const [majorA] = parseVersion(a);
  const [majorB] = parseVersion(b);

  return majorA > majorB;
};

export const isHigherMinorVersion = (a: string, b: string): boolean => {
  const [majorA, minorA] = parseVersion(a);
  const [majorB, minorB] = parseVersion(b);

  return isHigherMajorVersion(a, b) || minorA > minorB;
};
