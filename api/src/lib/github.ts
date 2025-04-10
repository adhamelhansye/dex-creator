import { Octokit } from "@octokit/core";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";
import sodium from "libsodium-wrappers";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Get current file's directory (ES module replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Octokit with GitHub token
const MyOctokit = Octokit.plugin(restEndpointMethods);
const octokit = new MyOctokit({
  auth: process.env.GITHUB_TOKEN,
});

// Template repository information
const templateRepo =
  process.env.GITHUB_TEMPLATE_REPO ||
  "OrderlyNetworkDexCreator/dex-creator-template";
const [templateOwner, templateRepoName] = templateRepo.split("/");

/**
 * Creates a fork of the template repository for a user's DEX
 * @param repoName The name for the new repository
 * @returns The URL of the created repository
 */
export async function forkTemplateRepository(
  repoName: string
): Promise<string> {
  try {
    // Validate repository name
    if (!repoName || repoName.trim() === "") {
      throw new Error("Repository name cannot be empty");
    }

    // GitHub has specific repo name requirements
    if (!/^[a-z0-9-]+$/i.test(repoName)) {
      throw new Error(
        "Repository name can only contain alphanumeric characters and hyphens"
      );
    }

    // GitHub has a 100 character limit for repo names
    if (repoName.length > 100) {
      throw new Error(
        "Repository name exceeds GitHub's maximum length of 100 characters"
      );
    }

    console.log(
      `Forking repository ${templateOwner}/${templateRepoName} to OrderlyNetworkDexCreator/${repoName}`
    );

    // Organization to create the fork in
    const orgName = "OrderlyNetworkDexCreator";

    // Use GitHub's native fork functionality
    const response = await octokit.rest.repos.createFork({
      owner: templateOwner,
      repo: templateRepoName,
      organization: orgName,
      name: repoName,
    });

    const repoUrl = response.data.html_url;
    console.log(`Successfully forked repository: ${repoUrl}`);

    // GitHub forks happen asynchronously, so the fork might not be immediately available
    // We'll wait for a few seconds to ensure the fork is created
    console.log("Waiting for fork to be fully created...");
    await new Promise(resolve => setTimeout(resolve, 5_000));

    // Enable GitHub Actions on the forked repository
    await enableRepositoryActions(orgName, repoName);

    // Add GitHub Pages deployment token as a secret if available
    const deploymentToken = process.env.PAGES_DEPLOYMENT_TOKEN;
    if (deploymentToken) {
      try {
        await addSecretToRepository(
          orgName,
          repoName,
          "PAGES_DEPLOYMENT_TOKEN",
          deploymentToken
        );
        console.log(
          `Added PAGES_DEPLOYMENT_TOKEN secret to ${orgName}/${repoName}`
        );
      } catch (secretError) {
        console.error(
          "Error adding GitHub Pages deployment token secret:",
          secretError
        );
        // Continue even if adding the secret fails - we don't want to fail the fork operation
      }
    } else {
      console.warn("PAGES_DEPLOYMENT_TOKEN not found in environment variables");
      console.warn("GitHub Pages deployment may not work without this token");
    }

    // Add workflow files to the repository
    try {
      await addWorkflowFilesToRepository(orgName, repoName);
      console.log(`Added workflow files to ${orgName}/${repoName}`);
    } catch (workflowError) {
      console.error("Error adding workflow files:", workflowError);
      // Continue even if adding the workflow files fails
    }

    // Enable GitHub Pages on the repository
    try {
      await enableGitHubPages(orgName, repoName);
      console.log(`Enabled GitHub Pages for ${orgName}/${repoName}`);
    } catch (pagesError) {
      console.error("Error enabling GitHub Pages:", pagesError);
      // Continue even if enabling GitHub Pages fails
    }

    return repoUrl;
  } catch (error: unknown) {
    console.error("Error forking repository:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to fork repository: ${errorMessage}`);
  }
}

/**
 * Enables GitHub Actions on a repository
 * This is necessary because GitHub disables Actions by default on forked repositories
 * that contain workflows
 * @param owner The repository owner (username or organization)
 * @param repo The repository name
 */
async function enableRepositoryActions(
  owner: string,
  repo: string
): Promise<void> {
  try {
    // First, enable Actions on the repository
    await octokit.rest.actions.setGithubActionsPermissionsRepository({
      owner,
      repo,
      enabled: true,
      allowed_actions: "all",
    });

    // Then, enable all workflows
    await octokit.rest.actions.setGithubActionsDefaultWorkflowPermissionsRepository(
      {
        owner,
        repo,
        default_workflow_permissions: "write",
      }
    );
    console.log(`GitHub Actions successfully enabled on ${owner}/${repo}`);
  } catch (error) {
    console.error(`Error enabling GitHub Actions on ${owner}/${repo}:`, error);
    throw error;
  }
}

/**
 * Adds a secret to a GitHub repository
 * @param owner The repository owner (username or organization)
 * @param repo The repository name
 * @param secretName The name of the secret
 * @param secretValue The plaintext value of the secret
 */
async function addSecretToRepository(
  owner: string,
  repo: string,
  secretName: string,
  secretValue: string
): Promise<void> {
  try {
    console.log(`Adding secret ${secretName} to ${owner}/${repo}...`);

    // Get the repository's public key for encrypting secrets
    console.log(`Fetching public key for ${owner}/${repo}...`);
    const { data: publicKeyData } = await octokit.rest.actions.getRepoPublicKey(
      {
        owner,
        repo,
      }
    );

    console.log(`Received public key: ${publicKeyData.key}`);

    // Encrypt the secret using the repository's public key
    const encryptedValue = await encryptSecret(publicKeyData.key, secretValue);

    // Add the encrypted secret to the repository
    console.log(`Submitting encrypted secret to GitHub...`);
    await octokit.rest.actions.createOrUpdateRepoSecret({
      owner,
      repo,
      secret_name: secretName,
      encrypted_value: encryptedValue,
      key_id: publicKeyData.key_id,
    });

    console.log(`Successfully added secret ${secretName} to ${owner}/${repo}`);
  } catch (error) {
    console.error(
      `Error adding secret ${secretName} to ${owner}/${repo}:`,
      error
    );
    throw error;
  }
}

/**
 * Encrypts a secret using the repository's public key
 * @param publicKey The repository's public key (from GitHub API)
 * @param secretValue The plaintext secret value to encrypt
 * @returns The encrypted secret value ready for GitHub API
 */
async function encryptSecret(
  publicKey: string,
  secretValue: string
): Promise<string> {
  try {
    // Ensure sodium is ready
    await sodium.ready;

    console.log("Processing public key:", publicKey);

    // Ensure the key has correct base64 padding if needed
    let normalizedKey = publicKey;
    if (publicKey.length % 4 !== 0) {
      const padding = 4 - (publicKey.length % 4);
      normalizedKey = publicKey + "=".repeat(padding);
      console.log("Added padding to key:", normalizedKey);
    }

    const buffer = Buffer.from(normalizedKey, "base64");
    const publicKeyBinary = new Uint8Array(buffer);

    // GitHub requires keys to be 32 bytes (256 bits)
    if (publicKeyBinary.length !== 32) {
      console.error(
        `Invalid key length: ${publicKeyBinary.length} bytes, expected 32 bytes`
      );
      throw new Error("Invalid key length for GitHub encryption");
    }

    // Convert the secret value to a binary buffer
    const secretBinary = sodium.from_string(secretValue);

    // Encrypt the secret using the public key
    const encryptedBinary = sodium.crypto_box_seal(
      secretBinary,
      publicKeyBinary
    );

    // Convert the encrypted value to standard base64 for GitHub API
    // (NOT URL-safe base64 which uses - and _)
    const base64 = Buffer.from(encryptedBinary).toString("base64");
    console.log("Encrypted value (first 20 chars):", base64.substring(0, 20));

    return base64;
  } catch (error) {
    console.error("Error encrypting secret:", error);
    throw error;
  }
}

/**
 * Updates DEX configuration files in the repository
 * @param owner The GitHub username of the DEX owner
 * @param repo The repository name
 * @param config The DEX configuration to apply
 */
export async function updateDexConfig(
  owner: string,
  repo: string,
  config: {
    brokerId: string;
    brokerName: string;
    themeCSS?: string;
    telegramLink?: string;
    discordLink?: string;
    xLink?: string;
  }
): Promise<void> {
  try {
    // Update .env file with broker ID and name
    const envContent = `# Broker settings
VITE_ORDERLY_BROKER_ID=${config.brokerId}
VITE_ORDERLY_BROKER_NAME=${config.brokerName}

# Meta tags
VITE_APP_NAME=${config.brokerName}
VITE_APP_DESCRIPTION=${config.brokerName} - A DEX powered by Orderly Network
`;

    await updateFileInRepo(
      owner,
      repo,
      ".env",
      envContent,
      "Update broker configuration"
    );

    // Update theme.css if provided
    if (config.themeCSS) {
      await updateFileInRepo(
        owner,
        repo,
        "app/styles/theme.css",
        config.themeCSS,
        "Update theme CSS"
      );
    }

    // Update config.tsx with social links if provided
    if (config.telegramLink || config.discordLink || config.xLink) {
      // First get the current file to modify it
      const configFile = await getFileFromRepo(
        owner,
        repo,
        "app/utils/config.tsx"
      );

      if (configFile) {
        let configContent = Buffer.from(configFile.content, "base64").toString(
          "utf-8"
        );

        // Replace social links
        if (config.telegramLink) {
          configContent = configContent.replace(
            /telegramLink:.*,/,
            `telegramLink: "${config.telegramLink}",`
          );
        }

        if (config.discordLink) {
          configContent = configContent.replace(
            /discordLink:.*,/,
            `discordLink: "${config.discordLink}",`
          );
        }

        if (config.xLink) {
          configContent = configContent.replace(
            /xLink:.*,/,
            `xLink: "${config.xLink}",`
          );
        }

        await updateFileInRepo(
          owner,
          repo,
          "app/utils/config.tsx",
          configContent,
          "Update social links"
        );
      }
    }
  } catch (error: unknown) {
    console.error("Error updating DEX configuration:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to update DEX configuration: ${errorMessage}`);
  }
}

/**
 * Upload logo files to the repository
 * @param owner The GitHub username of the DEX owner
 * @param repo The repository name
 * @param files Object containing the logo files to upload
 */
export async function uploadLogoFiles(
  owner: string,
  repo: string,
  files: {
    primaryLogo?: string;
    secondaryLogo?: string;
    favicon?: string;
  }
): Promise<void> {
  try {
    // Upload primary logo if provided
    if (files.primaryLogo) {
      await updateFileInRepo(
        owner,
        repo,
        "public/orderly-logo.svg",
        files.primaryLogo,
        "Update primary logo",
        true
      );
    }

    // Upload secondary logo if provided
    if (files.secondaryLogo) {
      await updateFileInRepo(
        owner,
        repo,
        "public/orderly-logo-secondary.svg",
        files.secondaryLogo,
        "Update secondary logo",
        true
      );
    }

    // Upload favicon if provided
    if (files.favicon) {
      await updateFileInRepo(
        owner,
        repo,
        "public/favicon.png",
        files.favicon,
        "Update favicon",
        true
      );
    }
  } catch (error: unknown) {
    console.error("Error uploading logo files:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to upload logo files: ${errorMessage}`);
  }
}

/**
 * Helper function to get a file from a repository
 */
async function getFileFromRepo(owner: string, repo: string, path: string) {
  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    return response.data as { content: string; sha: string };
  } catch (error: unknown) {
    console.error(`Error getting file ${path}:`, error);
    return null;
  }
}

/**
 * Helper function to update a file in a repository
 */
async function updateFileInRepo(
  owner: string,
  repo: string,
  path: string,
  content: string,
  commitMessage: string,
  isBinary = false
) {
  // First get the current file to get its SHA
  const currentFile = await getFileFromRepo(owner, repo, path);

  // Convert content to base64 if not already
  let contentBase64 = content;
  if (!isBinary) {
    contentBase64 = Buffer.from(content).toString("base64");
  }

  // Create or update the file
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: commitMessage,
    content: contentBase64,
    sha: currentFile?.sha,
  });
}

/**
 * Adds workflow files to a GitHub repository
 * @param owner The repository owner (username or organization)
 * @param repo The repository name
 */
async function addWorkflowFilesToRepository(
  owner: string,
  repo: string
): Promise<void> {
  console.log(`Adding workflow files to ${owner}/${repo}...`);

  // Path to workflow files
  const workflowsDir = path.resolve(__dirname, "../workflows");

  // Check if workflows directory exists
  if (!fs.existsSync(workflowsDir)) {
    throw new Error(`Workflows directory not found at ${workflowsDir}`);
  }

  // Read deploy.yml
  const deployYmlPath = path.join(workflowsDir, "deploy.yml");
  if (!fs.existsSync(deployYmlPath)) {
    throw new Error(`deploy.yml not found at ${deployYmlPath}`);
  }
  const deployYmlContent = fs.readFileSync(deployYmlPath, "utf-8");

  // Read sync-fork.yml
  const syncForkYmlPath = path.join(workflowsDir, "sync-fork.yml");
  if (!fs.existsSync(syncForkYmlPath)) {
    throw new Error(`sync-fork.yml not found at ${syncForkYmlPath}`);
  }
  const syncForkYmlContent = fs.readFileSync(syncForkYmlPath, "utf-8");

  // Get the latest commit SHA from the default branch
  console.log(`Getting latest commit for ${owner}/${repo}...`);
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: "heads/main",
  });
  const latestCommitSha = refData.object.sha;

  // Create blobs for each file
  console.log("Creating blobs for workflow files...");
  const [deployYmlBlob, syncForkYmlBlob] = await Promise.all([
    octokit.rest.git.createBlob({
      owner,
      repo,
      content: Buffer.from(deployYmlContent).toString("base64"),
      encoding: "base64",
    }),
    octokit.rest.git.createBlob({
      owner,
      repo,
      content: Buffer.from(syncForkYmlContent).toString("base64"),
      encoding: "base64",
    }),
  ]);

  // Create a tree with both files
  console.log("Creating git tree with workflow files...");
  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: latestCommitSha,
    tree: [
      {
        path: ".github/workflows/deploy.yml",
        mode: "100644", // file mode (100644 = file)
        type: "blob",
        sha: deployYmlBlob.data.sha,
      },
      {
        path: ".github/workflows/sync-fork.yml",
        mode: "100644", // file mode (100644 = file)
        type: "blob",
        sha: syncForkYmlBlob.data.sha,
      },
    ],
  });

  // Create a commit
  console.log("Creating commit with workflow files...");
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: "Add GitHub workflow files",
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  // Update the reference
  console.log("Updating branch reference...");
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: "heads/main",
    sha: newCommit.sha,
  });

  console.log(
    `Successfully added workflow files to ${owner}/${repo} in a single commit`
  );
}

/**
 * Enables GitHub Pages for a repository
 * @param owner The repository owner (username or organization)
 * @param repo The repository name
 */
async function enableGitHubPages(owner: string, repo: string): Promise<void> {
  console.log(`Enabling GitHub Pages for ${owner}/${repo}...`);

  // Configure GitHub Pages with GitHub Actions deployment
  await octokit.rest.repos.createPagesSite({
    owner,
    repo,
    build_type: "workflow",
  });

  console.log(`Successfully enabled GitHub Pages for ${owner}/${repo}`);
}
