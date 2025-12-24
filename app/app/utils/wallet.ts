export function parseWalletError(error: any) {
  if (
    error instanceof Error &&
    error.message?.toLowerCase().includes("user rejected")
  ) {
    return "User rejected the request";
  }
  return error?.message;
}
