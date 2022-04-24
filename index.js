const fs = require('fs');
const clc = require("cli-color");
const yaml = require('js-yaml');
const core = require('@actions/core');

const main = async() => {
  try {
    // const repository = core.getInput('repository', { required: true });
    // const chartTag = core.getInput('chart-tag', { required: true });
    // const environment = core.getInput('environment', { required: true });
    const repository = "infra-helloworld";
    const chartTag = "0.0.1";
    const environment = "staging";
    updateChart(repository, chartTag);
    updateValues(repository, chartTag, environment);
  } catch(error) {
    console.log(clc.red(error));
  }
}

function updateChart(repository, chartTag) {
  const chart = loadYaml("charts/Chart.yaml");
  chart.name = repository;
  chart.description = `${repository} application helm chart to deploy on Kubernetes cluster`;
  chart.version = chartTag;
  writeYaml("charts/Chart.yaml", chart);
}

function updateValues(repository, chartTag, environment) {
  const values = loadYaml("charts/values.yaml");
  const input = loadYaml(`charts-config/values-${environment}.yaml`);
  values.applicationName = repository;
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

  values.overallTimeout = "30s";

  values.configMap.enabled = true;
  values.configMap.content = input.environment;
  delete values.configMap.mountPath;
  delete values.configMap.fileName;

  values.externalSecrets.enabled = true;
  values.externalSecrets.secrets[0].awsSecretName = `${repository}-${environment}-secrets`;
  values.externalSecrets.secrets[0].config = [];
  const secrets = loadYaml(`charts-config/${input.secrets}`);
  for(let key in secrets.secrets) {
    values.externalSecrets.secrets[0].config.push({
      environmentVariableName: key,
      key: secrets.secrets[key]
    });
  }

  values.services = [];
  input.services.forEach((service, index) => {
    values.services.push({
      name: `${repository}-${service.type}-${index + 1}`,
    })

    if (service.type == "web") {
      values.services[index].ports = service.ports
    }

    if (service.args) {
      values.services[index].args = service.args
    }

    if (service.command) {
      values.services[index].command = service.command
    }

    const machineSize = getMachineSize(service.machine?.type || "standard", environment);
    values.services[index].resources = getResources(machineSize);

    values.services[index].replicaCount = 1;
    values.services[index].maxUnavailable = 0;
  });

  writeYaml("charts/values.yaml", values);
}

function getResources(size) {
  return {
    limits: {
      cpu: `${1000 * size}m`,
      memory: `${2 * size}Gi`
    },
    requests: {
      cpu: `${1000 * size}m`,
      memory: `${2 * size}Gi`
    }
  }
}

function getMachineSize(type, environment) {
  type = type || "standard";
  if (environment == "staging" && type == "standard") {
    type = "small";
  } else if (environment == "production" && type == "standard") {
    type = "large";
  }
  switch(type) {
    case "xsmall":
      return .5;
    case "small":
      return 1;
    case "medium":
      return 2;
    case "large":
      return 4;
    case "xlarge":
      return 8;
    default:
      throw new Error("Invalid machine type");
  }
}

function loadYaml(file) {
  return yaml.load(fs.readFileSync(file, 'utf8'));
}

function writeYaml(file, data) {
  const yamlOp = yaml.dump(data);
  console.log(clc.yellow(yamlOp));
  // fs.writeFileSync(file, yamlOp);
}

main();
