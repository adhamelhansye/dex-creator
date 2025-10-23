export const CHAIN_PREFIXES = [
  "eth:",
  "base:",
  "arb:",
  "sepolia:",
  "sep:",
  "base-sep:",
  "basesep:",
  "arb-sep:",
  "arbsep:",
];

export const cleanMultisigAddress = (address: string): string => {
  let cleanAddress = address;

  for (const prefix of CHAIN_PREFIXES) {
    if (cleanAddress.toLowerCase().startsWith(prefix)) {
      cleanAddress = cleanAddress.substring(prefix.length);
      break;
    }
  }

  return cleanAddress;
};

export const extractChainFromAddress = (address: string): number | null => {
  const chainPrefixes: Record<string, number> = {
    "eth:": 1,
    "base:": 8453,
    "arb:": 42161,
    "sepolia:": 11155111,
    "sep:": 11155111,
    "base-sep:": 84532,
    "basesep:": 84532,
    "arb-sep:": 421614,
    "arbsep:": 421614,
  };

  for (const [prefix, chainId] of Object.entries(chainPrefixes)) {
    if (address.toLowerCase().startsWith(prefix)) {
      return chainId;
    }
  }
  return null;
};
