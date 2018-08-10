import {sortBy} from 'lodash';
import * as git from 'simple-git/promise';
import {Revision} from './types';

export const MASTER = 'master';

export const isRepoRoot = async (path: string): Promise<boolean> => {
  const repo = git(path);
  // in case the target path is inside another git repo, checkIsRepo returns true,
  // but we want to know if target is actually the root of a git repo
  return await repo.checkIsRepo() && (await repo.revparse(['--show-toplevel'])).trim() === path;
};

export const createLocalRepo = async (repoRoot: string, remote: string, branch: string = MASTER) =>
  git().clone(remote, repoRoot, ['--no-hardlinks', '--single-branch', '--branch', branch]);

const ORIGIN = 'origin';

export const listRevisions = async (
  repoRoot: string, branch: string, startingAfter?: string
): Promise<Revision[]> => {
  const repo = git(repoRoot);
  const raw = sortBy((await repo.log()).all, 'date');
  const from = raw.findIndex(logLine => logLine.hash === startingAfter) + 1;

  return raw.slice(from).map((logLine): Revision => ({
    id: logLine.hash, datetime: logLine.date, message: logLine.message
  }));
};

export const fetchRemoteUpdates = async (repoRoot: string, branch: string): Promise<boolean> => {
  const repo = git(repoRoot);
  await repo.fetch(ORIGIN, branch);
  return (await repo.status()).behind > 0;
};
