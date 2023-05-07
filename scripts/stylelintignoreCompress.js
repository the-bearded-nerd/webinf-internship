const stylelint = require('stylelint');
const fs = require('fs/promises');
const {
  PATH_TO_STYLELINTCONFIG_FILE,
  PATH_TO_STYLELINTIGNORE_FILE,
} = require('./constants');
const { asyncFilter, notDisabledGlobally } = require('./utils');

const hasMatch = (originalPath, paths) => {
  const pathRegexp = new RegExp(
    originalPath.replaceAll('.', '\\.').replaceAll('*', '.*')
  );
  return paths.some((path) => path.match(pathRegexp));
};

const doWork = async () => {
  const originalStylelintPaths = (
    await fs.readFile(PATH_TO_STYLELINTIGNORE_FILE, 'utf-8')
  ).split(/\r?\n/);

  await fs.truncate(PATH_TO_STYLELINTIGNORE_FILE);

  const stylelintResults = await stylelint.lint({
    files: './src/**/*.css',
    configFile: PATH_TO_STYLELINTCONFIG_FILE,
  });
  const filesWithProblems = stylelintResults.results.map((item) =>
    item.source.replaceAll('\\', '/')
  );

  const notGloballyDisabledFilesWithProblems = await asyncFilter(
    filesWithProblems,
    notDisabledGlobally
  );

  const filteredOriginalStylelintPaths =
    originalStylelintPaths.filter((path) =>
      hasMatch(path, notGloballyDisabledFilesWithProblems)
    );

  await fs.writeFile(
    PATH_TO_STYLELINTIGNORE_FILE,
    filteredOriginalStylelintPaths.join('\n'),
    function (err) {
      if (err) {
        console.error(err);
      }
    }
  );
};

doWork();
