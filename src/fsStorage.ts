import {createHash} from 'crypto';
import * as fs from 'fs-extra';
import {isAbsolute, resolve} from 'path';
import {RepoStatus} from './types';

export const resolveRepoWorkingDir = (
  repositoryID: string, dataPath: string, currentDir: string = process.cwd()
): string => {
  //create a reliable identifier that can be used as a file/directory name
  const repoHash = createHash('md5').update(repositoryID).digest('hex');

  return isAbsolute(dataPath) ? dataPath : resolve(currentDir, dataPath, repoHash);
};

export const resolveIfRelative = (
  pathOrUrl: string, currentDir: string = process.cwd()
): string => {
  const isRelativePath = fs.existsSync(pathOrUrl) && !isAbsolute(pathOrUrl);
  return isRelativePath ? resolve(currentDir, pathOrUrl) : pathOrUrl;
};

export const storeRepoStatus = (file: string, status: RepoStatus) =>
  fs.writeJSONSync(file, status, {spaces: 2});

export const readRepoStatus = (file: string, defaultStatus: RepoStatus): RepoStatus =>
  fs.pathExistsSync(file) ? fs.readJSONSync(file) : defaultStatus;

export * from 'fs-extra';
