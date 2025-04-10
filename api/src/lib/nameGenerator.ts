/**
 * Helper functions for generating standardized repository names
 */

/**
 * Sanitizes a broker name for use in repository names by:
 * - Converting to lowercase
 * - Replacing spaces with hyphens
 * - Removing special characters
 * - Replacing multiple hyphens with single ones
 * - Removing leading/trailing hyphens
 * - Limiting length to ensure GitHub compatibility
 *
 * @param brokerName The original broker name
 * @param maxLength Maximum length for the sanitized name (default: 30)
 * @returns A sanitized version of the broker name suitable for repository names
 */
export function sanitizeBrokerName(
  brokerName: string,
  maxLength: number = 30
): string {
  return brokerName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove any characters that aren't alphanumeric or hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single one
    .replace(/^-|-$/g, "") // Remove leading and trailing hyphens
    .substring(0, maxLength); // Keep it reasonably short
}

/**
 * Generates a unique repository name from a broker name by appending a timestamp suffix
 *
 * @param brokerName The original broker name
 * @param maxLength Maximum length for the base name before adding suffix (default: 30)
 * @returns A unique repository name suitable for GitHub
 */
export function generateRepositoryName(
  brokerName: string,
  maxLength: number = 30
): string {
  const sanitized = sanitizeBrokerName(brokerName, maxLength);

  // Use last 4 digits of timestamp for shorter, unique suffix
  const shortUniqueSuffix = Date.now().toString().slice(-4);

  return `${sanitized}-${shortUniqueSuffix}`;
}
