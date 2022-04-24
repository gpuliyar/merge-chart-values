const fs = require('fs');
const clc = require("cli-color");
const yaml = require('js-yaml');
const core = require('@actions/core');

const main = async () => {
  try {
    const repository = core.getInput('repository', { required: true });
    const chartTag = core.getInput('chart-tag', { required: true });
    const environment = core.getInput('environment', { required: true });
    // const repository = "infra-helloworld";
    // const chartTag = "0.0.1";
    // const environment = "staging";
    updateChart(repository, chartTag);
    updateValues(repository, chartTag, environment);
  } catch (error) {
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
  values.overallTimeout = "30s";

  values.deploymentStrategy = setDeploymentStrategy(input["deployment-strategy"]);
  values.configMap = setEnvironment(input.environment);
  values.externalSecrets = setSecrets(repository, environment, input.secrets);
  values.services = setServices(repository, environment, input);

  writeYaml("charts/values.yaml", values);
}

function setServices(repository, environment, input) {
  var services = [];
  input.services.forEach((service, index) => {
    services.push({
      name: `${repository}-${service.type}-${index + 1}`,
    })

    if (service.type == "web") {
      services[index].ports = service.ports
    }

    if (service.args) {
      services[index].args = service.args
    }

    if (service.command) {
      services[index].command = service.command
    }

    const machineSize = getMachineSize(service.machine?.type || "standard", environment);
    services[index].resources = getResources(machineSize);
    services[index].autoScaling = setAutoScaling(environment, service.machine?.count, service.machine?.scale);

    services[index].replicaCount = 1;
    services[index].maxUnavailable = 0;
  });

  return services;
}

function setAutoScaling(environment, count, scale) {
  if (environment == "staging") {
    count = count || 1;
  } else {
    count = count || 2;
  }

  scale = scale || "1x";
  scale.slice(-1);
  const scaleN = parseFloat(scale);

  var scaleFactor = {};
  if (scaleN > 1) {
    scaleFactor = {
      targetCPUUtilizationPercentage: 80,
      targetMemoryUtilizationPercentage: 80
    };
  }

  return {
    minReplicas: count,
    maxReplicas: Math.ceil(count * scaleN),
    ...scaleFactor
  }
}

function setEnvironment(environment) {
  return {
    enabled: true,
    content: environment
  }
}

function setSecrets(repository, environment, file) {
  const secrets = loadYaml(`charts-config/${file}`);
  var config = [];
  for (let key in secrets.secrets) {
    config.push({
      environmentVariableName: key,
      key: secrets.secrets[key]
    });
  }

  return {
    enabled: true,
    secrets: [{
      awsSecretName: `${repository}-${environment}-secrets`,
      config
    }]
  }
}

function setDeploymentStrategy(strategy) {
  if (strategy == "blue-green") {
    return {
      blueGreen: {
        enabled: true,
        autoPromotionEnabled: false,
        maxUnavailable: 0
      },
      rolling: {
        enabled: false
      }
    }
  } else if (strategy == "rolling") {
    return {
      blueGreen: {
        enabled: false
      },
      rolling: {
        enabled: true
      }
    }
  } else {
    throw new Error("Unsupported deployment strategy");
  }
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
  switch (type) {
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
  fs.writeFileSync(file, yamlOp);
}

main();
