const path = require('path');

const PATH_TO_STYLELINTIGNORE_FILE = path.resolve(
  __dirname,
  '..',
  '.stylelintignore'
);
const PATH_TO_STYLELINTCONFIG_FILE = path.resolve(
  __dirname,
  '..',
  '.stylelintrc.json'
);

module.exports = {
  PATH_TO_STYLELINTCONFIG_FILE,
  PATH_TO_STYLELINTIGNORE_FILE,
};
