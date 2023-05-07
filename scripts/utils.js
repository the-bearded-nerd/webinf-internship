const fs = require('fs/promises');

const notDisabledGlobally = async (fileName) => {
  const fileContent = await fs.readFile(fileName, 'utf-8');
  return !fileContent.startsWith('/* stylelint-disable */');
};

const asyncFilter = async (arr, predicate) => {
  const results = await Promise.all(arr.map(predicate));
  return arr.filter((_, index) => results[index]);
};

module.exports = {
  notDisabledGlobally,
  asyncFilter,
};
