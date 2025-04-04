interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  onLogin,
}: LoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm z-[1001]"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative z-[1002] max-w-md p-6 rounded-xl bg-background-light border border-primary-light/20 shadow-2xl">
        <h3 className="text-xl font-bold mb-4 gradient-text">
          Complete Your Login
        </h3>

        <div className="mb-6 space-y-4">
          <p className="text-gray-300">
            You're almost there! To secure your session, you'll need to sign a
            message with your wallet.
          </p>

          <div className="bg-background-dark/50 p-4 rounded-lg border border-secondary-light/10 text-sm">
            <h4 className="font-semibold mb-2 text-secondary-light">
              Why do I need to sign?
            </h4>
            <p className="text-gray-400">
              Signing a message proves you own this wallet without sharing your
              private keys. This is a secure method that doesn't cost any gas
              fees or involve blockchain transactions.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn btn-secondary rounded-full">
            Later
          </button>
          <button
            onClick={onLogin}
            className="btn btn-connect glow-effect rounded-full"
          >
            Sign Message
          </button>
        </div>
      </div>
    </div>
  );
}
