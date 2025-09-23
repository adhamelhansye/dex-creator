import React, { useEffect } from "react";

interface BlockchainConfigProps {
  chainIds: number[];
  onChainIdsChange: (chainIds: number[]) => void;
  defaultChain?: number;
  onDefaultChainChange?: (chainId: number | undefined) => void;
  disableMainnet?: boolean;
  disableTestnet?: boolean;
  onDisableMainnetChange?: (disabled: boolean) => void;
  onDisableTestnetChange?: (disabled: boolean) => void;
}

const BlockchainConfigSection: React.FC<BlockchainConfigProps> = ({
  chainIds,
  onChainIdsChange,
  defaultChain,
  onDefaultChainChange,
  disableMainnet,
  disableTestnet,
  onDisableMainnetChange,
  onDisableTestnetChange,
}) => {
  const supportedChains = [
    // Mainnet chains
    {
      id: 42161,
      name: "Arbitrum One",
      symbol: "ETH",
      type: "L2",
      network: "mainnet",
    },
    { id: 10, name: "Optimism", symbol: "ETH", type: "L2", network: "mainnet" },
    { id: 8453, name: "Base", symbol: "ETH", type: "L2", network: "mainnet" },
    // { id: 5000, name: "Mantle", symbol: "MNT", type: "L2", network: "mainnet" },
    { id: 1, name: "Ethereum", symbol: "ETH", type: "L1", network: "mainnet" },
    {
      id: 56,
      name: "BNB Chain",
      symbol: "BNB",
      type: "L1",
      network: "mainnet",
    },
    // { id: 1329, name: "Sei", symbol: "SEI", type: "L1", network: "mainnet" },
    // {
    //   id: 43114,
    //   name: "Avalanche",
    //   symbol: "AVAX",
    //   type: "L1",
    //   network: "mainnet",
    // },
    {
      id: 900900900,
      name: "Solana",
      symbol: "SOL",
      type: "L1",
      network: "mainnet",
    },
    // { id: 2818, name: "Morph", symbol: "ETH", type: "L2", network: "mainnet" },
    // { id: 146, name: "Sonic", symbol: "S", type: "L1", network: "mainnet" },
    // {
    //   id: 80094,
    //   name: "Berachain",
    //   symbol: "BERA",
    //   type: "L1",
    //   network: "mainnet",
    // },
    // { id: 1514, name: "Story", symbol: "IP", type: "L1", network: "mainnet" },
    // { id: 34443, name: "Mode", symbol: "ETH", type: "L2", network: "mainnet" },
    // { id: 98866, name: "Plume", symbol: "ETH", type: "L2", network: "mainnet" },
    // {
    //   id: 2741,
    //   name: "Abstract",
    //   symbol: "ETH",
    //   type: "L2",
    //   network: "mainnet",
    // },

    // Testnet chains
    {
      id: 421614,
      name: "Arbitrum Sepolia",
      symbol: "ETH",
      type: "L2",
      network: "testnet",
    },
    {
      id: 84532,
      name: "Base Sepolia",
      symbol: "ETH",
      type: "L2",
      network: "testnet",
    },
    {
      id: 97,
      name: "BSC Testnet",
      symbol: "BNB",
      type: "L1",
      network: "testnet",
    },
    {
      id: 901901901,
      name: "Solana Devnet",
      symbol: "SOL",
      type: "L1",
      network: "testnet",
    },
    {
      id: 11124,
      name: "Abstract Sepolia",
      symbol: "ETH",
      type: "L2",
      network: "testnet",
    },
  ];

  useEffect(() => {
    if (disableMainnet) {
      const mainnetChainIds = supportedChains
        .filter(chain => chain.network === "mainnet")
        .map(chain => chain.id);
      const filteredChainIds = chainIds.filter(
        id => !mainnetChainIds.includes(id)
      );
      if (filteredChainIds.length !== chainIds.length) {
        onChainIdsChange(filteredChainIds);
      }
    }
  }, [disableMainnet]);

  useEffect(() => {
    if (disableTestnet) {
      const testnetChainIds = supportedChains
        .filter(chain => chain.network === "testnet")
        .map(chain => chain.id);
      const filteredChainIds = chainIds.filter(
        id => !testnetChainIds.includes(id)
      );
      if (filteredChainIds.length !== chainIds.length) {
        onChainIdsChange(filteredChainIds);
      }
    }
  }, [disableTestnet]);

  const handleChainToggle = (chainId: number) => {
    if (chainIds.includes(chainId)) {
      onChainIdsChange(chainIds.filter(id => id !== chainId));
    } else {
      onChainIdsChange([...chainIds, chainId]);
    }
  };

  const handleSelectAll = () => {
    const activeChains = supportedChains.filter(chain => {
      if (disableMainnet && chain.network === "mainnet") return false;
      if (disableTestnet && chain.network === "testnet") return false;
      return true;
    });
    onChainIdsChange(activeChains.map(chain => chain.id));
  };

  const handleClearAll = () => {
    onChainIdsChange([]);
  };

  const bothNetworksDisabled = disableMainnet && disableTestnet;

  const handleMainnetToggle = (checked: boolean) => {
    if (checked && disableTestnet) {
      return;
    }
    onDisableMainnetChange?.(checked);

    if (checked) {
      const mainnetChainIds = supportedChains
        .filter(chain => chain.network === "mainnet")
        .map(chain => chain.id);
      const filteredChainIds = chainIds.filter(
        id => !mainnetChainIds.includes(id)
      );
      onChainIdsChange(filteredChainIds);
    }
  };

  const handleTestnetToggle = (checked: boolean) => {
    if (checked && disableMainnet) {
      return;
    }
    onDisableTestnetChange?.(checked);

    if (checked) {
      const testnetChainIds = supportedChains
        .filter(chain => chain.network === "testnet")
        .map(chain => chain.id);
      const filteredChainIds = chainIds.filter(
        id => !testnetChainIds.includes(id)
      );
      onChainIdsChange(filteredChainIds);
    }
  };

  const mainnetChains = supportedChains.filter(
    chain => chain.network === "mainnet"
  );
  const testnetChains = supportedChains.filter(
    chain => chain.network === "testnet"
  );

  const mainnetL1 = mainnetChains.filter(chain => chain.type === "L1");
  const mainnetL2 = mainnetChains.filter(chain => chain.type === "L2");
  const testnetL1 = testnetChains.filter(chain => chain.type === "L1");
  const testnetL2 = testnetChains.filter(chain => chain.type === "L2");

  const ChainCheckbox = ({ chain }: { chain: (typeof supportedChains)[0] }) => {
    const isDefaultChain = defaultChain === chain.id;
    return (
      <label
        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ease-in-out ${
          isDefaultChain
            ? "border-primary/50 bg-primary/10 hover:bg-primary/15"
            : "border-light/10 bg-light/5 hover:bg-light/10"
        }`}
      >
        <input
          type="checkbox"
          checked={chainIds.includes(chain.id)}
          onChange={() => handleChainToggle(chain.id)}
          className="mr-3 w-4 h-4 text-primary bg-transparent border-2 border-light/30 rounded focus:ring-primary focus:ring-2 transition-colors duration-200"
        />
        <div className="flex items-center flex-1">
          <div className="flex-1">
            <div className="font-medium text-sm text-white flex items-center gap-2">
              {chain.name}
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  chain.type === "L1"
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-green-500/20 text-green-300"
                }`}
              >
                {chain.type}
              </span>
              {chain.network === "testnet" && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300">
                  Testnet
                </span>
              )}
              {isDefaultChain && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/30 text-primary-light flex items-center gap-1">
                  <div className="i-mdi:star w-3 h-3"></div>
                  Default
                </span>
              )}
            </div>
            <div className="text-xs text-light/70">
              Chain ID: {chain.id} • {chain.symbol}
            </div>
          </div>
        </div>
      </label>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-bold mb-1">Supported Blockchains</h4>
          <p className="text-xs text-gray-400">
            Select which blockchains your DEX will support. Users will be able
            to trade on these networks.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary-light rounded-full transition-all duration-200 ease-in-out"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-full transition-all duration-200 ease-in-out"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* All Chains Mode Explanation */}
      {chainIds.length === 0 && (
        <div className="text-center py-4 px-2 text-sm bg-blue-500/10 border border-blue-500/20 rounded-lg slide-fade-in">
          <div className="text-blue-300 font-medium mb-1">
            🌐 All Chains Mode (Default)
          </div>
          <div className="text-gray-400 text-xs leading-relaxed">
            No specific chains selected. Your DEX will automatically support{" "}
            <strong>all current and future blockchains</strong> added to the
            Orderly Network. This ensures maximum compatibility and
            future-proofing without needing updates.
          </div>
        </div>
      )}

      {/* Default Chain Selection */}
      <div className="space-y-3">
        <div>
          <label
            htmlFor="defaultChain"
            className="block text-sm font-medium mb-1"
          >
            Default Chain (Optional)
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Choose which mainnet blockchain your DEX will use by default when
            users first connect. Users can always switch to other supported
            chains afterward.
          </p>
        </div>
        <select
          id="defaultChain"
          value={defaultChain || ""}
          onChange={e =>
            onDefaultChainChange?.(
              e.target.value ? parseInt(e.target.value) : undefined
            )
          }
          className="w-full px-3 py-2 bg-background-card border border-light/10 rounded-lg text-sm"
        >
          <option value="">No default chain</option>
          {(chainIds.length > 0
            ? chainIds
            : supportedChains.map(chain => chain.id)
          )
            .filter(chainId => {
              const chain = supportedChains.find(c => c.id === chainId);
              if (!chain) return false;
              if (chain.network !== "mainnet") return false;
              if (disableMainnet) return false;
              return true;
            })
            .map(chainId => {
              const chain = supportedChains.find(c => c.id === chainId);
              return chain ? (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ) : null;
            })}
        </select>
        {defaultChain && (
          <div className="text-xs text-gray-400">
            Selected default:{" "}
            <span className="text-primary-light">
              {supportedChains.find(c => c.id === defaultChain)?.name ||
                `Chain ${defaultChain}`}
            </span>
          </div>
        )}
      </div>

      {/* Network Toggle Controls */}
      <div className="flex gap-4">
        <label
          className={`flex items-center cursor-pointer transition-all duration-200 ease-in-out hover:text-white ${disableTestnet ? "opacity-50" : ""}`}
        >
          <input
            type="checkbox"
            className="mr-2 transition-colors duration-200"
            checked={disableMainnet}
            disabled={disableTestnet}
            onChange={e => handleMainnetToggle(e.target.checked)}
            title={
              disableTestnet
                ? "Cannot disable mainnet when testnet is already disabled"
                : ""
            }
          />
          <span className="text-sm text-gray-300">Disable Mainnet</span>
        </label>
        <label
          className={`flex items-center cursor-pointer transition-all duration-200 ease-in-out hover:text-white ${disableMainnet ? "opacity-50" : ""}`}
        >
          <input
            type="checkbox"
            className="mr-2 transition-colors duration-200"
            checked={disableTestnet}
            disabled={disableMainnet}
            onChange={e => handleTestnetToggle(e.target.checked)}
            title={
              disableMainnet
                ? "Cannot disable testnet when mainnet is already disabled"
                : ""
            }
          />
          <span className="text-sm text-gray-300">Disable Testnet</span>
        </label>
      </div>

      {/* Error message for invalid state */}
      {bothNetworksDisabled && (
        <div className="text-center py-3 text-sm bg-red-500/10 border border-red-500/20 rounded-lg slide-fade-in">
          <div className="text-red-300 font-medium mb-1">
            ⚠️ Invalid Configuration
          </div>
          <div className="text-gray-400 text-xs">
            Cannot disable both mainnet and testnet. Your DEX needs to support
            at least one network type.
          </div>
        </div>
      )}

      {/* Mainnet Networks */}
      <div
        className={`space-y-4 transition-all duration-300 ease-in-out ${disableMainnet ? "opacity-50 pointer-events-none" : ""}`}
      >
        <h4 className="text-sm font-semibold text-white flex items-center">
          <div className="i-mdi:earth h-4 w-4 mr-2"></div>
          Mainnet Networks
          {disableMainnet && (
            <span className="ml-2 text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded slide-fade-in">
              Disabled
            </span>
          )}
        </h4>

        {!disableMainnet ? (
          <div className="slide-fade-in space-y-6">
            {/* Mainnet Layer 1 Chains */}
            <div>
              <h5 className="text-sm font-bold mb-3 text-blue-300 flex items-center">
                <div className="i-mdi:layers h-4 w-4 mr-2"></div>
                Layer 1 Networks
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mainnetL1.map(chain => (
                  <ChainCheckbox key={chain.id} chain={chain} />
                ))}
              </div>
            </div>

            {/* Mainnet Layer 2 Chains */}
            <div>
              <h5 className="text-sm font-bold mb-3 text-green-300 flex items-center">
                <div className="i-mdi:layers-triple h-4 w-4 mr-2"></div>
                Layer 2 Networks
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mainnetL2.map(chain => (
                  <ChainCheckbox key={chain.id} chain={chain} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-gray-500 slide-fade-in">
            Mainnet networks are disabled
          </div>
        )}
      </div>

      {/* Testnet Networks */}
      <div
        className={`space-y-4 transition-all duration-300 ease-in-out ${disableTestnet ? "opacity-50 pointer-events-none" : ""}`}
      >
        <h4 className="text-sm font-semibold text-orange-300 flex items-center">
          <div className="i-mdi:flask h-4 w-4 mr-2"></div>
          Testnet Networks
          {disableTestnet && (
            <span className="ml-2 text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded slide-fade-in">
              Disabled
            </span>
          )}
        </h4>

        {!disableTestnet ? (
          <div className="slide-fade-in space-y-6">
            {/* Testnet Layer 1 Chains */}
            {testnetL1.length > 0 && (
              <div>
                <h5 className="text-sm font-bold mb-3 text-blue-300 flex items-center">
                  <div className="i-mdi:layers h-4 w-4 mr-2"></div>
                  Layer 1 Networks
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {testnetL1.map(chain => (
                    <ChainCheckbox key={chain.id} chain={chain} />
                  ))}
                </div>
              </div>
            )}

            {/* Testnet Layer 2 Chains */}
            {testnetL2.length > 0 && (
              <div>
                <h5 className="text-sm font-bold mb-3 text-green-300 flex items-center">
                  <div className="i-mdi:layers-triple h-4 w-4 mr-2"></div>
                  Layer 2 Networks
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {testnetL2.map(chain => (
                    <ChainCheckbox key={chain.id} chain={chain} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-gray-500 slide-fade-in">
            Testnet networks are disabled
          </div>
        )}
      </div>

      {/* Selection Summary */}
      <div className="pt-3 border-t border-light/10">
        {chainIds.length === 0 ? (
          <div className="text-center py-2 text-xs text-gray-400">
            Using All Chains Mode - supporting all current and future
            blockchains
          </div>
        ) : (
          <div className="text-xs text-gray-400">
            Selected {chainIds.length} blockchain
            {chainIds.length !== 1 ? "s" : ""} •{" "}
            {mainnetChains.filter(chain => chainIds.includes(chain.id)).length}{" "}
            Mainnet,{" "}
            {testnetChains.filter(chain => chainIds.includes(chain.id)).length}{" "}
            Testnet
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainConfigSection;
