import { useEffect, useState } from "react";
import { Button } from "./Button";
import { toast } from "react-toastify";
import { getPublicKeyAsync } from "@noble/ed25519";
import { encodeBase58 } from "ethers";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderlyKey: Uint8Array;
  accountId: string;
}

export default function AdminLoginModal({
  isOpen,
  onClose,
  orderlyKey,
  accountId,
}: AdminLoginModalProps) {
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  if (!isOpen) return null;

  const privateKeyHex = `ed25519:${encodeBase58(orderlyKey)}`;

  const getPublicKey = async () => {
    try {
      const publicKeyBytes = await getPublicKeyAsync(orderlyKey);
      return `ed25519:${encodeBase58(publicKeyBytes)}`;
    } catch (error) {
      console.error("Failed to get public key:", error);
      return "Error generating public key";
    }
  };

  const [publicKey, setPublicKey] = useState<string>("");

  useEffect(() => {
    getPublicKey().then(setPublicKey);
  }, [orderlyKey]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center h-screen">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm z-[1001]"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative z-[1002] max-w-lg w-full mx-4 p-6 rounded-xl bg-background-light border border-primary-light/20 shadow-2xl slide-fade-in">
        <h3 className="text-xl font-bold mb-4 gradient-text">
          Admin Dashboard Login
        </h3>

        <div className="mb-6 space-y-4">
          <p className="text-gray-300">
            Copy these credentials to log into the Orderly Admin Dashboard. Keep
            your private key secure!
          </p>

          {/* Account ID */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-light">
              Account ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={accountId}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg bg-background-dark border border-light/10 text-white font-mono text-sm"
              />
              <Button
                variant="secondary"
                onClick={() => copyToClipboard(accountId, "Account ID")}
                className="flex-shrink-0"
              >
                <div className="i-mdi:content-copy w-4 h-4"></div>
              </Button>
            </div>
          </div>

          {/* Public Key */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-light">
              Public Key (Orderly Key)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={publicKey}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg bg-background-dark border border-light/10 text-white font-mono text-sm"
              />
              <Button
                variant="secondary"
                onClick={() => copyToClipboard(publicKey, "Public Key")}
                className="flex-shrink-0"
              >
                <div className="i-mdi:content-copy w-4 h-4"></div>
              </Button>
            </div>
          </div>

          {/* Private Key */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-light">
              Private Key (Secret Key)
            </label>
            <div className="flex gap-2">
              <input
                type={showPrivateKey ? "text" : "password"}
                value={privateKeyHex}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg bg-background-dark border border-light/10 text-white font-mono text-sm"
              />
              <Button
                variant="secondary"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="flex-shrink-0"
              >
                <div
                  className={`w-4 h-4 ${showPrivateKey ? "i-mdi:eye-off" : "i-mdi:eye"}`}
                ></div>
              </Button>
              <Button
                variant="secondary"
                onClick={() => copyToClipboard(privateKeyHex, "Private Key")}
                className="flex-shrink-0"
              >
                <div className="i-mdi:content-copy w-4 h-4"></div>
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              ⚠️ Never share your private key with anyone!
            </p>
          </div>
        </div>

        <div className="bg-background-dark/50 p-4 rounded-lg border border-secondary-light/10 text-sm mb-6">
          <h4 className="font-semibold mb-2 text-secondary-light">
            How to log in:
          </h4>
          <ol className="text-gray-400 space-y-1 list-decimal list-inside">
            <li>Open the Admin Dashboard link</li>
            <li>Paste your Account ID in the first field</li>
            <li>Paste your Public Key in the second field</li>
            <li>Paste your Private Key in the third field</li>
            <li>Click "Sign In" to access your broker settings</li>
          </ol>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() =>
              window.open("https://admin.orderly.network/", "_blank")
            }
          >
            Open Admin Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
