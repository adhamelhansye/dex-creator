/**
 * Global disconnect function that can be set by components using wagmi hooks
 * and accessed by the apiClient to disconnect wallet on 401 errors
 */

let globalDisconnect: (() => void) | null = null;
let isHandlingSessionExpiry = false;

export function setGlobalDisconnect(disconnectFn: () => void) {
  globalDisconnect = disconnectFn;
}

export function disconnectWallet() {
  isHandlingSessionExpiry = true;
  if (globalDisconnect) {
    globalDisconnect();
  }
  setTimeout(() => {
    isHandlingSessionExpiry = false;
  }, 1000);
}

export function isHandlingSessionExpiryDisconnect() {
  return isHandlingSessionExpiry;
}
