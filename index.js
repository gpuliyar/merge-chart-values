const fs = require('fs');
const moment = require('moment');
const clc = require("cli-color");
const yaml = require('js-yaml');
const core = require('@actions/core');

const main = async() => {
  try {
    const valuesYamlFile = core.getInput('values-file', { required: true });
    const repository = core.getInput('repository', { required: true });
    const imageTag = core.getInput('image-tag', { required: true });
    const valuesYaml = yaml.safeLoad(fs.readFileSync(valuesYamlFile, 'utf8'));
    const indentedJson = JSON.stringify(config, null, 4);
    console.log(clc.green(indentedJson));
  } catch(error) {
    console.log(clc.red(error));
  }
}

main();
