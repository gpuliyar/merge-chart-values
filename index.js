const fs = require('fs');
const clc = require("cli-color");
const yaml = require('js-yaml');
const core = require('@actions/core');

const main = async() => {
  try {
    const repository = core.getInput('repository', { required: true });
    const chartTag = core.getInput('chart-tag', { required: true });
    updateChart(repository, chartTag);
  } catch(error) {
    console.log(clc.red(error));
  }
}

function updateChart(repository, chartTag) {
  const chart = loadYaml("charts/Chart.yaml")
  chart.name = repository
  chart.description = `Application ${repo} Helm chart to deploy on Kubernetes`
  chart.version = chartTag
  writeYaml("charts/Chart.yaml", chart);
}

function loadYaml(file) {
  return yaml.load(fs.readFileSync(file, 'utf8'));
}

function writeYaml(file, data) {
  fs.writeFileSync(file, yaml.dump(data));
}

main();
