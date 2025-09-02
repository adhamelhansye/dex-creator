export function getOrderlyApiBaseUrl(): string {
  const deploymentEnv = process.env.DEPLOYMENT_ENV;

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
