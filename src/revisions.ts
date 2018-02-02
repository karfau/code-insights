import {config as dotenv} from 'dotenv';
import {Logger, RepoStatus} from './types';
import {fetchRemoteUpdates, createLocalRepo, isRepoRoot, listRevisions, MASTER} from './vcs/git';
import {ENV_DATA_DIR, ENV_DATA_DIR_DEFAULT} from './constants';
import * as fs from './fsStorage';

const log: Logger = console.error;
const writeData: (...args: string[]) => void = console.log;

if (process.argv.length < 3) {
  log('first argument needs to be a git remote');
  process.exit(1);
}
const [ , , ...cliArgs] = process.argv;
// in case it is a relative path we want to make it absolute,
// so we can have a reliable identifier later on
const remoteSafe = fs.resolveIfRelative(cliArgs[0]);

const branch = cliArgs[1] || MASTER;

dotenv();
const target = fs.resolveRepoWorkingDir(remoteSafe, process.env[ENV_DATA_DIR] || ENV_DATA_DIR_DEFAULT);
const statusFile = `${target}.status.json`;

log(ENV_DATA_DIR, target);
log('remote:', remoteSafe, 'branch:', branch);

(async () => {
  await fs.mkdirp(target);

  const existingRepo = await isRepoRoot(target);
  let status: RepoStatus = {branch};
  if (!existingRepo) {
    await createLocalRepo(target, remoteSafe, branch);
    fs.storeRepoStatus(statusFile, status);
  }
  await fetchRemoteUpdates(target, branch);

  status = await fs.readRepoStatus(statusFile, status);
  let lastReported = status.reported;

  const result = await listRevisions(target, branch, lastReported);

  if (result.length === 0) {
    log('no news');
    return;
  }

  writeData('rev,datetime');
  result.forEach(rev => {
    writeData(rev.id, rev.datetime);
    status.reported = rev.id;
    fs.storeRepoStatus(statusFile, status);
  });
})().catch(error => {
  log('unexpected error', error);
  process.exit(1);
});
