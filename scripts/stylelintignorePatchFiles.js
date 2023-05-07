const stylelint = require('stylelint');
const fs = require('fs/promises');
const {
  PATH_TO_STYLELINTCONFIG_FILE,
  PATH_TO_STYLELINTIGNORE_FILE,
} = require('./constants');
const { asyncFilter, notDisabledGlobally } = require('./utils');

const getDisableText = (rule) => {
  let disableText = `/* stylelint-disable-next-line ${rule}, */`;
  if (
    disableText.includes('comment-whitespace-inside') &&
    !disableText.includes('comment-empty-line-before')
  ) {
    disableText = disableText.replace(
      'comment-whitespace-inside',
      'comment-whitespace-inside, comment-empty-line-before'
    );
  }
  return disableText;
};

const squashWarnings = (warnings) => {
  if (warnings.length <= 1) return warnings;
  const result = [warnings[0]];
  let resultTail = 0;
  for (let i = 1; i < warnings.length; i++) {
    if (result[resultTail].line === warnings[i].line) {
      if (!result[resultTail].rule.includes(warnings[i].rule))
        result[resultTail].rule += ', ' + warnings[i].rule;
      continue;
    } else {
      result.push(warnings[i]);
      resultTail++;
    }
  }
  return result;
};

const applyDisablingToFile = async (pathToFile) => {
  const fileData = await fs.readFile(pathToFile, 'utf-8');
  let replacedBR = fileData
    .replaceAll(/(\r\n|\n|\r)/gm, '')
    .replaceAll('{', '{\n')
    .replaceAll('}', '}\n\n')
    .replaceAll(';', ';\n');
  const newWarnings = await stylelint.lint({
    code: replacedBR,
    configFile: PATH_TO_STYLELINTCONFIG_FILE,
  });
  const warnings = newWarnings.results[0].warnings;
  warnings.sort((a, b) => b.line - a.line);
  replacedBR = replacedBR.split(/\r?\n/);
  for (let warning of squashWarnings(warnings)) {
    let disableText;
    if (replacedBR[warning.line - 1].includes('*/')) {
      disableText = getDisableText(
        warning.rule + ', declaration-empty-line-before'
      );
    } else {
      disableText = getDisableText(warning.rule);
    }
    replacedBR.splice(warning.line - 1, 0, disableText);
  }
  await fs.writeFile(pathToFile, replacedBR.join('\n'), 'utf-8');
};

const doWork = async () => {
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
  await Promise.all(
    notGloballyDisabledFilesWithProblems.map((elem) =>
      applyDisablingToFile(elem)
    )
  );
};

doWork();
