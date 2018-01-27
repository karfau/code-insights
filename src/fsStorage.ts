import {createHash} from "crypto";
import {existsSync} from "fs";
import {isAbsolute, resolve} from 'path';

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
  const isRelativePath = existsSync(pathOrUrl) && !isAbsolute(pathOrUrl);
  return isRelativePath ? resolve(currentDir, pathOrUrl) : pathOrUrl
};
