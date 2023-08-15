export type RegistryData = {
  id: string;
  rev: string;
  name: string;
  description: string;
  distTags: DistTags;
  versions: { [key: string]: Version };
  readme: string;
  maintainers: MaintainerClass[];
  time: { [key: string]: string };
  author: MaintainerClass;
  repository: Repository;
  users: { [key: string]: boolean };
  readmeFilename: string;
  homepage: string;
  keywords: string[];
  contributors: MaintainerClass[];
  bugs: Bugs;
  license: string;
};

export type MaintainerClass = {
  name: string;
  email: string;
};

export type Bugs = {
  url: string;
};

export type DistTags = {
  latest: string;
};

export type Repository = {
  type: string;
  url: string;
};

export type Version = {
  name: string;
  version: string;
  description: string;
  homepage: string;
  main: string;
  keywords: string[];
  licenses: Repository[];
  author: {
    email: string;
    url: string;
  };
  bugs: Bugs;
  repository: Repository;
  engines: string[];
  directories: Directories;
  npmUser: MaintainerClass;
  id: string;
  dependencies: string[];
  devDependencies: string;
  optionalDependencies: string;
  engineSupported: boolean;
  npmVersion: string;
  nodeVersion: string;
  defaultsLoaded: boolean;
  dist: Dist;
  maintainers: MaintainerClass[];
};

export type Directories = {
  doc: string;
  test: string;
};

export type Dist = {
  shasum: string;
  tarball: string;
  integrity: string;
  signatures: Signature[];
};

export type Signature = {
  keyid: string;
  sig: string;
};
