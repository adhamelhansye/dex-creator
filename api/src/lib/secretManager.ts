import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

interface SecretCache {
  [key: string]: string;
}

let secretCache: SecretCache = {};
let isInitialized = false;

export interface SecretConfig {
  databaseUrl: string;
  githubToken: string;
  templatePat: string;
  orderReceiverAddress: string;
  brokerCreationPrivateKey: string;
  brokerCreationPrivateKeySol: string;
}

function getSecretNames(deploymentEnv: string): Record<string, string> {
  const baseProject = "projects/964694002890/secrets";

  switch (deploymentEnv) {
    case "mainnet":
      return {
        databaseUrl: `${baseProject}/dex-creator-postgres-db-prod-evm/versions/latest`,
        githubToken: `${baseProject}/dex-creator-github-token-prod-evm/versions/latest`,
        templatePat: `${baseProject}/dex-creator-template-pat-prod-evm/versions/latest`,
        orderReceiverAddress: `${baseProject}/dex-creator-order-receiver-address-prod-evm/versions/latest`,
        brokerCreationPrivateKey: `${baseProject}/dex-creator-broker-creation-private-key-prod-evm/versions/latest`,
        brokerCreationPrivateKeySol: `${baseProject}/dex-creator-broker-creation-private-key-sol-prod-evm/versions/latest`,
      };
    case "staging":
      return {
        databaseUrl: `${baseProject}/dex-creator-postgres-db-staging-evm/versions/latest`,
        githubToken: `${baseProject}/dex-creator-github-token-staging-evm/versions/latest`,
        templatePat: `${baseProject}/dex-creator-template-pat-staging-evm/versions/latest`,
        orderReceiverAddress: `${baseProject}/dex-creator-order-receiver-address-staging-evm/versions/latest`,
        brokerCreationPrivateKey: `${baseProject}/dex-creator-broker-creation-private-key-staging-evm/versions/latest`,
        brokerCreationPrivateKeySol: `${baseProject}/dex-creator-broker-creation-private-key-sol-staging-evm/versions/latest`,
      };
    default:
      return {};
  }
}

async function fetchSecret(
  client: SecretManagerServiceClient,
  secretName: string,
  envVarName: string
): Promise<string> {
  try {
    console.log(`🔑 Fetching ${envVarName} from secret: ${secretName}`);
    const [version] = await client.accessSecretVersion({
      name: secretName,
    });
    const secret = version.payload?.data?.toString();
    if (!secret) {
      throw new Error(`Secret ${secretName} is empty or invalid`);
    }
    console.log(`✅ Fetched ${envVarName} from Google Secret Manager`);
    return secret;
  } catch (error) {
    console.error(
      `❌ Failed to get ${envVarName} from Google Secret Manager:`,
      error
    );
    const envValue = process.env[envVarName];
    if (envValue) {
      console.log(`⚠️ Using environment variable for ${envVarName}`);
      return envValue;
    } else {
      throw new Error(
        `Required secret '${envVarName}' not found in Secret Manager or environment variables`
      );
    }
  }
}

export async function initializeSecretManager(): Promise<SecretConfig> {
  if (isInitialized) {
    return getSecretConfig();
  }

  console.log("🔧 Initializing secret manager...");

  const deploymentEnv = process.env.DEPLOYMENT_ENV;

  if (!deploymentEnv || deploymentEnv === "qa" || deploymentEnv === "dev") {
    console.log(
      "🔧 Using environment variables for secrets (qa/dev environment)"
    );

    const requiredEnvVars = [
      "DATABASE_URL",
      "GITHUB_TOKEN",
      "TEMPLATE_PAT",
      "ORDER_RECEIVER_ADDRESS",
      "BROKER_CREATION_PRIVATE_KEY",
      "BROKER_CREATION_PRIVATE_KEY_SOL",
    ];

    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
      throw new Error(
        `Missing required environment variables for ${deploymentEnv || "local"} environment: ${missingEnvVars.join(", ")}`
      );
    }

    secretCache = {
      databaseUrl: process.env.DATABASE_URL!,
      githubToken: process.env.GITHUB_TOKEN!,
      templatePat: process.env.TEMPLATE_PAT!,
      orderReceiverAddress: process.env.ORDER_RECEIVER_ADDRESS!,
      brokerCreationPrivateKey: process.env.BROKER_CREATION_PRIVATE_KEY!,
      brokerCreationPrivateKeySol: process.env.BROKER_CREATION_PRIVATE_KEY_SOL!,
    };
    isInitialized = true;
    return getSecretConfig();
  }

  const secretNames = getSecretNames(deploymentEnv);

  if (Object.keys(secretNames).length === 0) {
    throw new Error(
      `Unknown deployment environment: ${deploymentEnv}. Please set environment variables directly.`
    );
  }

  const client = new SecretManagerServiceClient();

  const [
    databaseUrl,
    githubToken,
    templatePat,
    orderReceiverAddress,
    brokerCreationPrivateKey,
    brokerCreationPrivateKeySol,
  ] = await Promise.all([
    fetchSecret(client, secretNames.databaseUrl, "DATABASE_URL"),
    fetchSecret(client, secretNames.githubToken, "GITHUB_TOKEN"),
    fetchSecret(client, secretNames.templatePat, "TEMPLATE_PAT"),
    fetchSecret(
      client,
      secretNames.orderReceiverAddress,
      "ORDER_RECEIVER_ADDRESS"
    ),
    fetchSecret(
      client,
      secretNames.brokerCreationPrivateKey,
      "BROKER_CREATION_PRIVATE_KEY"
    ),
    fetchSecret(
      client,
      secretNames.brokerCreationPrivateKeySol,
      "BROKER_CREATION_PRIVATE_KEY_SOL"
    ),
  ]);

  secretCache = {
    databaseUrl,
    githubToken,
    templatePat,
    orderReceiverAddress,
    brokerCreationPrivateKey,
    brokerCreationPrivateKeySol,
  };

  isInitialized = true;
  console.log("🚀 Secret manager initialized");
  return getSecretConfig();
}

export function getSecretConfig(): SecretConfig {
  if (!isInitialized) {
    throw new Error(
      "Secret manager not initialized. Call initializeSecretManager() first."
    );
  }

  return {
    databaseUrl: secretCache.databaseUrl,
    githubToken: secretCache.githubToken,
    templatePat: secretCache.templatePat,
    orderReceiverAddress: secretCache.orderReceiverAddress,
    brokerCreationPrivateKey: secretCache.brokerCreationPrivateKey,
    brokerCreationPrivateKeySol: secretCache.brokerCreationPrivateKeySol,
  };
}

export function getSecret(key: keyof SecretConfig): string {
  const config = getSecretConfig();
  return config[key];
}
