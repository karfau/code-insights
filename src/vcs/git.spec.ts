import {expect} from "chai";
import * as path from 'path';
import * as fs from 'fs-extra';
import {createLocalRepo, isRepoRoot, listRevisions} from './git';

describe('isRepoRoot', () => {
  it('should return true for a repository root', async () => {
    expect(await isRepoRoot(process.cwd())).to.be.true;
  });
  it('should return false for a subfolder of a repository root', async () => {
    expect(await isRepoRoot(path.join(process.cwd(), 'src'))).to.be.false;
  });
});

describe('createLocalRepo', () => {

  const INITIAL_COMMIT = '9bbde535d46dff9e18e3dab0bc011eb433ced7ef';
  const SECOND_COMMIT = '045c9c0d3a722abcbe8423533344aef56a7fea5c';
  const CODE_INSIGHTS_GIT_FIXTURE = 'https://github.com/karfau/code-insights-git-fixture.git';
  const fixtureDir = path.join(process.cwd(), '.test', 'git-fixture');

  before('clean start for fixture', () => {
    fs.removeSync(fixtureDir);
  });

  it('should be able to clone an https repo', async () => {
    await createLocalRepo(fixtureDir, CODE_INSIGHTS_GIT_FIXTURE);
    expect(fs.existsSync(path.join(fixtureDir, '.git'))).to.be.true;

    describe('listRevisions', () => {
      before('make sure the test repo is checked out in .test folder', () => {
      });
      it('should list all commits with two parameters', async () => {
        let actual = await listRevisions(fixtureDir, 'master');
        expect(actual).to.not.be.empty;

        expect(actual.map(rev => rev.id).slice(0, 2)).to.eql([
          INITIAL_COMMIT,
          SECOND_COMMIT
          ])
      });

      it('should list one commit with lastReported being first commit', async () => {
        const all = (await listRevisions(fixtureDir, 'master'));
        expect(
          await listRevisions(fixtureDir, 'master', INITIAL_COMMIT)
        ).to.have.lengthOf(all.length-1);
      });
    });
  });
});

