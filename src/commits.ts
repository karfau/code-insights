import {config as dotenv} from 'dotenv';
import * as git from 'simple-git/promise';
import {ENV_DATA_DIR, ENV_DATA_DIR_DEFAULT} from './constants';
import {resolveIfRelative, resolveRepoWorkingDir} from './fsStorage';
import makeDir = require('make-dir');

if (process.argv.length < 3) {
  console.error('first argument needs to be a git remote');
  process.exit(1);
}
const [ , , ...cliArgs] = process.argv;
// in case it is a relative path we want to make it absolute,
// so we can have a reliable identifier later on
const remoteSafe = resolveIfRelative(cliArgs[0]);

const branch = cliArgs[1] || 'HEAD';

dotenv();
const target = resolveRepoWorkingDir(remoteSafe, process.env[ENV_DATA_DIR] || ENV_DATA_DIR_DEFAULT);

console.error(ENV_DATA_DIR, target);
console.error('remote:', remoteSafe, 'branch:', branch);

(async () => {
  await makeDir(target);
  const repo = git(target);
  //in case the target path is inside another git repo, checkIsRepo returns true,
  // but we want to know if target is actually the root of a git repo
  let existingRepo = await repo.checkIsRepo() && (await repo.revparse(['--show-toplevel'])).trim() === target;
  if (!existingRepo) {
    await git().clone(remoteSafe, target, ['--no-hardlinks', '--branch', branch]);
  }

  const logOptions: git.LogOptions = {};

  if (existingRepo) {
    let status = await repo.status();
    if (status.current !== branch) {
      console.error(`switching from ${status.current} to ${branch}`);
      await repo.checkoutLocalBranch(branch);
    }
    await repo.fetch('origin', branch);
    status = await repo.status();
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
  console.error('unexpected error', error);
  process.exit(1);
});
