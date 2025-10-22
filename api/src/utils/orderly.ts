export function getOrderlyApiBaseUrl(): string {
  const deploymentEnv = process.env.DEPLOYMENT_ENV;

  if (process.env.IS_DOCKER === "true") {
    return "http://orderly-gateway-rest";
  }

  switch (deploymentEnv) {
    case "mainnet":
      return "https://api.orderly.org";
    case "staging":
      return "https://testnet-api.orderly.org";
    case "qa":
      return "https://qa-api-aliyun.orderly.network";
    case "dev":
    default:
      return "https://dev-api-aliyun.orderly.network";
  }
}
