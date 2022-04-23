const fs = require('fs');
const clc = require("cli-color");
const yaml = require('js-yaml');
const core = require('@actions/core');

const main = async() => {
  try {
    const repository = core.getInput('repository', { required: true });
    const chartTag = core.getInput('chart-tag', { required: true });
    const chart = yaml.load(fs.readFileSync("charts/Chart.yaml", 'utf8'));
    chart.name = repository
    chart.description = `Application ${repo} Helm chart to deploy on Kubernetes`
    chart.version = chartTag
    fs.writeFileSync("charts/Chart.yaml", yaml.dump(chart));
  } catch(error) {
    console.log(clc.red(error));
  }
}

main();
