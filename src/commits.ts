import git = require('simple-git/promise');

git(process.cwd()).status().then(console.log);
