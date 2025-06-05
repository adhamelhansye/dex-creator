export const generateDeploymentUrl = (repoUrl: string): string => {
  try {
    const match = repoUrl.match(/github\.com\/[^\/]+\/([^\/]+)/);
    if (match && match[1]) {
      const repoName = match[1];
      return `https://dex.orderly.network/${repoName}/`;
    }
  } catch (error) {
    console.error("Error constructing deployment URL:", error);
  }
  return "";
};
