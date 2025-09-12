/**
 * Common Result type for error handling without exceptions
 *
 * @template T The type of data returned on success
 * @template E The type of error returned on failure (defaults to string message)
 */
export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };
