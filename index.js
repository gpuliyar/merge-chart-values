const fs = require('fs');
const clc = require("cli-color");
const yaml = require('js-yaml');
const core = require('@actions/core');

const main = async() => {
  try {
    const repository = core.getInput('repository', { required: true });
    const chartTag = core.getInput('chart-tag', { required: true });
    const environment = core.getInput('environment', { required: true });
    updateChart(repository, chartTag);
    updateValues(repository, chartTag, environment);
  } catch(error) {
    console.log(clc.red(error));
  }
}

function updateChart(repository, chartTag) {
  const chart = loadYaml("charts/Chart.yaml");
  chart.name = repository;
  chart.description = `Application ${repository} Helm chart to deploy on Kubernetes`;
  chart.version = chartTag;
  writeYaml("charts/Chart.yaml", chart);
}

function updateValues(repository, chartTag, environment) {
  const values = loadYaml("charts/values.yaml");
  const input = loadYaml(`charts-config/values-${environment}.yaml`);
  values.applicatioName = repository;
  values.repository = repository;
  values.tag = chartTag;
  values.imagePullPolicy = "Always";
  values.teamName = input.team;

  if (input["deployment-strategy"] == "blue-green") {
    values.deploymentStrategy.blueGreen.enabled = true;
    values.deploymentStrategy.blueGreen.autoPromotionEnabled = false;
    values.deploymentStrategy.blueGreen.maxUnavailable = 0;
    values.deploymentStrategy.rolling.enabled = false;
  } else if (input["deployment-strategy"] == "rolling") {
    values.deploymentStrategy.blueGreen.enabled = false;
    values.deploymentStrategy.rolling.enabled = true;
  }

  values.configMap.enabled = true;
  delete values.configMap.mountPath;
  delete values.configMap.fileName;
  input.environment.forEach((value, key) => {
    values.configMap.content[key] = value;
  });

  writeYaml("charts/values.yaml", values);
  const json = JSON.stringify(values, null, 4);
  console.log(clc.green(json));
}

function loadYaml(file) {
  return yaml.load(fs.readFileSync(file, 'utf8'));
}

function writeYaml(file, data) {
  fs.writeFileSync(file, yaml.dump(data));
}

main();
