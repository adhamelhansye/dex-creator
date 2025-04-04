import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAuth } from '../context/AuthContext';
import { useAppKit } from '@reown/appkit/react';
import { toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import LoginModal from './LoginModal';

export default function WalletConnect() {
  const [connectError, setConnectError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasUserDismissedModal, setHasUserDismissedModal] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const appKit = useAppKit();
  const {
    user,
    isAuthenticated,
    login,
    logout,
    isLoading,
    error: authError,
    validateToken,
  } = useAuth();

  // Validate token on component mount
  useEffect(() => {
    if (isConnected && user) {
      // If we're connected and have user data, validate the token
      validateToken().catch(error => {
        console.error('Token validation failed:', error);
      });
    }
  }, [validateToken, isConnected, user]);

  // Show toast for auth errors instead of displaying in UI
  useEffect(() => {
    if (authError) {
      toast.error(`Authentication error: ${authError}`);
      console.error('Authentication error:', authError);
    }
  }, [authError]);

  // Show toast for connection errors
  useEffect(() => {
    if (connectError) {
      toast.error(`Connection error: ${connectError}`);
      console.error('Connection error:', connectError);
    }
  }, [connectError]);

  // Reset the dismissed state when disconnecting or authenticating
  useEffect(() => {
    if (!isConnected || isAuthenticated) {
      setHasUserDismissedModal(false);
    }
  }, [isConnected, isAuthenticated]);

  // Show login modal when wallet is connected but not authenticated
  useEffect(() => {
    if (
      isConnected &&
      !isAuthenticated &&
      !showLoginModal &&
      !hasUserDismissedModal
    ) {
      // Short delay to ensure the wallet modal is fully closed first
      const timer = setTimeout(() => {
        setShowLoginModal(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isConnected, isAuthenticated, showLoginModal, hasUserDismissedModal]);

  // Clear any connection errors when connection state changes
  useEffect(() => {
    if (isConnected) {
      setConnectError(null);
    }
  }, [isConnected]);

  // Format address to shortened form (0x1234...5678)
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Open the AppKit modal
  const openWalletModal = () => {
    appKit?.open();
  };

  // Handle login through modal - always close modal regardless of outcome
  const handleLoginFromModal = async () => {
    setShowLoginModal(false); // Close modal immediately

    try {
      await login();
    } catch (error) {
      // Error will be handled by the authError useEffect
      console.error('Login failed:', error);
    }
  };

  // Handle closing the modal with "Later" button
  const handleDismissModal = () => {
    setShowLoginModal(false);
    setHasUserDismissedModal(true);
  };

  return (
    <div className="relative z-20">
      {!isConnected ? (
        <div className="flex flex-col">
          <button
            className="rounded-full py-1.5 px-3 md:py-2 md:px-4 lg:py-3 lg:px-6 text-xs md:text-sm lg:text-base font-medium bg-gradient-primaryButton text-white shadow-glow hover:opacity-90 transition-all duration-200"
            onClick={openWalletModal}
          >
            Connect Wallet
          </button>
        </div>
      ) : !isAuthenticated ? (
        <div className="flex flex-col">
          <div className="flex items-center bg-background-light/30 rounded-full px-1.5 py-0.5 md:px-2 md:py-1 lg:px-4 lg:py-2 border border-secondary-light/20">
            <div className="flex items-center gap-0.5 md:gap-1 lg:gap-2 mr-1 md:mr-2 lg:mr-3">
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 lg:w-2 lg:h-2 rounded-full bg-teal-light"></div>
              <span className="text-xs lg:text-sm text-gray-300 font-medium">
                {formatAddress(address as string)}
              </span>
            </div>
            <div className="flex gap-0.5 md:gap-1 lg:gap-2">
              <button
                className="hidden md:block rounded-full py-1 px-3 md:py-1.5 md:px-4 text-xs md:text-sm font-medium bg-gradient-primaryButton text-white hover:opacity-90 transition-all duration-200"
                onClick={() => {
                  setHasUserDismissedModal(false);
                  setShowLoginModal(true);
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Validating...' : 'Login'}
              </button>
              <button
                className="rounded-full p-0.5 md:p-1 lg:p-1.5 bg-background-light/50 border border-secondary-light/20 hover:bg-background-light/70 text-gray-400 hover:text-gray-300 transition-all duration-200"
                onClick={() => disconnect()}
                title="Disconnect"
              >
                <Icon
                  icon="heroicons:power"
                  width={12}
                  className="md:w-4 lg:w-4"
                />
              </button>
            </div>
          </div>

          {/* Login Modal */}
          <LoginModal
            isOpen={showLoginModal}
            onClose={handleDismissModal}
            onLogin={handleLoginFromModal}
          />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex items-center bg-background-light/30 rounded-full px-1.5 py-0.5 md:px-2 md:py-1 lg:px-4 lg:py-2 border border-primary-light/20">
            <div className="flex items-center gap-0.5 md:gap-1 lg:gap-2 mr-1 md:mr-2 lg:mr-3">
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 lg:w-2 lg:h-2 rounded-full bg-teal-light"></div>
              <span className="text-xs lg:text-sm text-primary-light font-medium">
                {formatAddress(user?.address as string)}
              </span>
            </div>
            <button
              className="rounded-full p-0.5 md:p-1 lg:p-1.5 bg-background-light/40 border border-secondary-light/20 hover:bg-background-light/60 text-gray-400 hover:text-gray-300 transition-all duration-200"
              onClick={logout}
              title="Disconnect"
            >
              <Icon
                icon="heroicons:power"
                width={12}
                className="md:w-4 lg:w-4"
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
