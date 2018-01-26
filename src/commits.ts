import {createHash} from 'crypto';
import {config as dotenv} from 'dotenv';
import {existsSync} from 'fs';
import {isAbsolute, resolve} from 'path';
import * as git from 'simple-git/promise';
import {ENV_DATA_DIR} from './constants';
import makeDir = require('make-dir');

if (process.argv.length < 3) {
  console.error('first argument needs to be a git remote');
  process.exit(1);
}
const [ , , ...cliArgs] = process.argv;
const remote = cliArgs[0];
const currentDir = process.cwd();
const remoteSafe = existsSync(remote) && !isAbsolute(remote) ?
  resolve(currentDir, remote) : remote;
const repoHash = createHash('md5').update(remoteSafe).digest('hex');

const branch = cliArgs[1] || 'HEAD';

dotenv();
const dataDir = process.env[ENV_DATA_DIR] || '../.code-insights-data';
const target = isAbsolute(dataDir) ? dataDir : resolve(currentDir, dataDir, repoHash);

console.error(ENV_DATA_DIR, target);
console.error('remote:', remoteSafe, 'branch:', branch);

(async () => {
  if (!existsSync(target)) {
    await makeDir(target);
  }
  const repo = git(target);
  let existingRepo = await repo.checkIsRepo();
  if (!existingRepo) {
    await git().clone(remoteSafe, target, ['--no-hardlinks']);
  }

  let logOptions: git.LogOptions = {};

  if (existingRepo) {
    await repo.fetch('origin', branch);
    const status = await repo.status();
    if (status.current !== branch) {
      await repo.checkoutLocalBranch(branch);
    }
    logOptions.from = branch;
    logOptions.to = status.tracking;
    if (status.behind === 0) {
      console.error('no new commits');
      return;
    }
  }
  const {all: newCommits} = await repo.log(logOptions);
  [...newCommits].reverse().forEach(logline => console.log(logline.hash));
  await repo.pull('origin', branch);

})().catch(error => {
  console.error('unexpected error', JSON.stringify(error));
  process.exit(1);
});
