import {expect} from "chai";
import * as path from 'path';
import {isRepoRoot} from './git';

describe('isRepoRoot', () => {
  it('should return true for a repository root', async () => {
    expect(await isRepoRoot(process.cwd())).to.be.true;
  });
  it('should return false for a subfolder of a repository root', async () => {
    expect(await isRepoRoot(path.join(process.cwd(), 'src'))).to.be.false;
  });
});
