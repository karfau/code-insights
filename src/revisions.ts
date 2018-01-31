import {config as dotenv} from 'dotenv';
import {Logger, RepoStatus} from './types';
import {checkRemoteUpdates, createLocalRepo, isRepoRoot, listRevisions} from './vcs/git';
import {ENV_DATA_DIR, ENV_DATA_DIR_DEFAULT} from './constants';
import {
  readRepoStatus, resolveIfRelative, resolveRepoWorkingDir,
  storeRepoStatus
} from './fsStorage';
import * as fs from 'fs-extra';

const log: Logger = console.error;

if (process.argv.length < 3) {
  log('first argument needs to be a git remote');
  process.exit(1);
}
const [ , , ...cliArgs] = process.argv;
// in case it is a relative path we want to make it absolute,
// so we can have a reliable identifier later on
const remoteSafe = resolveIfRelative(cliArgs[0]);

const branch = cliArgs[1] || 'HEAD';

dotenv();
const target = resolveRepoWorkingDir(remoteSafe, process.env[ENV_DATA_DIR] || ENV_DATA_DIR_DEFAULT);
const statusFile = `${target}.status.json`;

log(ENV_DATA_DIR, target);
log('remote:', remoteSafe, 'branch:', branch);

(async () => {
  await fs.mkdirp(target);

  const existingRepo = await isRepoRoot(target);
  let status: RepoStatus = {branch};
  if (!existingRepo) {
    await createLocalRepo(target, remoteSafe, branch);
    storeRepoStatus(statusFile, status);
  }
  await checkRemoteUpdates(target, branch);

  status = await readRepoStatus(statusFile, status);
  let lastReported = status.reported;

  const result = await listRevisions(target, branch, lastReported);

  if (result.length === 0) {
    log('no news');
    return;
  }

  console.log('rev,datetime');
  result.forEach(rev => {
    console.log(rev.id, rev.datetime);
    status.reported = rev.id;
    storeRepoStatus(statusFile, status);
  });
})().catch(error => {
  log('unexpected error', error);
  process.exit(1);
});
