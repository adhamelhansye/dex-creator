import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useAppKit } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { Icon } from "@iconify/react";
import { Button } from "./Button";
import { useLocation } from "@remix-run/react";

export default function WalletConnect() {
  const [connectError, setConnectError] = useState<string | null>(null);
  const [hasUserDismissedModal, setHasUserDismissedModal] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const appKit = useAppKit();
  const location = useLocation();
  const { openModal, closeModal } = useModal();
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
        console.error("Token validation failed:", error);
      });
    }
  }, [validateToken, isConnected, user]);

  // Show toast for auth errors instead of displaying in UI
  useEffect(() => {
    if (authError) {
      console.error("Authentication error:", authError);
    }
  }, [authError]);

  // Show toast for connection errors
  useEffect(() => {
    if (connectError) {
      toast.error(`Connection error: ${connectError}`);
      console.error("Connection error:", connectError);
    }
  }, [connectError]);

  // Reset the dismissed state ONLY when authenticating
  useEffect(() => {
    if (isAuthenticated) {
      setHasUserDismissedModal(false);
    }
  }, [isAuthenticated]);

  // Show login modal when wallet is connected but not authenticated
  useEffect(() => {
    if (isConnected && !isAuthenticated && !hasUserDismissedModal) {
      const timer = setTimeout(() => {
        openModal("login", {
          onLogin: handleLogin,
          onClose: handleModalClose,
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    isConnected,
    isAuthenticated,
    hasUserDismissedModal,
    location.pathname,
    openModal,
  ]);

  // Clear any connection errors when connection state changes
  useEffect(() => {
    if (isConnected) {
      setConnectError(null);
    }
  }, [isConnected]);

  // Format address to shortened form (0x1234...5678)
  const formatAddress = (addr: string) => {
    // Even shorter format for very small screens
    if (window.innerWidth < 360) {
      return `${addr.substring(0, 3)}...${addr.substring(addr.length - 2)}`;
    }
    // Shorter format for small screens
    if (window.innerWidth < 640) {
      return `${addr.substring(0, 4)}...${addr.substring(addr.length - 3)}`;
    }
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Open the AppKit modal
  const openWalletModal = () => {
    appKit?.open();
  };

  // Handle modal close (when "Later" is clicked)
  const handleModalClose = () => {
    setHasUserDismissedModal(true);
    closeModal();
  };

  // Handle login
  const handleLogin = async () => {
    try {
      await login();
      // Close the modal after successful login
      closeModal();
    } catch (error) {
      // Error will be handled by the authError useEffect
      console.error("Login failed:", error);
      // Don't close the modal on failure
    }
  };

  // Handle showing the login modal
  const handleShowLoginModal = () => {
    openModal("login", {
      onLogin: handleLogin,
      onClose: handleModalClose,
    });
  };

  return (
    <div className="relative z-20">
      {!isConnected ? (
        /* Not connected state */
        <Button
          variant="primary"
          size="sm"
          withGlow
          className="whitespace-nowrap"
          onClick={openWalletModal}
        >
          <span className="hidden xs:inline">Connect Wallet</span>
          <span className="xs:hidden">Connect</span>
        </Button>
      ) : !isAuthenticated ? (
        /* Connected but not authenticated */
        <div className="flex items-center">
          <div className="flex items-center bg-background-light/30 rounded-full px-1 py-0.5 md:px-2 md:py-1 border border-secondary-light/20">
            <div className="flex items-center gap-0.5 md:gap-1 mr-0.5 md:mr-2">
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-teal-light mr-2 md:mr-3"></div>
              <span className="hidden md:inline text-xs text-gray-300 font-medium max-w-[80px] md:max-w-none truncate">
                {formatAddress(address as string)}
              </span>
            </div>
            <div className="flex gap-0.5 md:gap-1">
              {/* Login button */}
              <Button
                variant="primary"
                size="xs"
                withGlow
                onClick={handleShowLoginModal}
                isLoading={isLoading}
                loadingText="Validating"
                className="text-xs py-0.5 px-2.5 md:text-sm md:py-1.5 md:px-4"
              >
                Login
              </Button>
              {/* Disconnect button */}
              <Button
                variant="ghost"
                size="xs"
                className="rounded-full p-0.5! flex items-center justify-center min-w-0"
                onClick={() => disconnect()}
                title="Disconnect"
                aria-label="Disconnect"
              >
                <Icon icon="heroicons:power" width={10} className="md:w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated state */
        <div className="flex items-center bg-background-light/30 rounded-full px-1 py-0.5 md:px-2 md:py-1 border border-primary-light/20">
          <div className="flex items-center gap-0.5 md:gap-1 mr-0.5 md:mr-2">
            <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-teal-light mr-2 md:mr-3"></div>
            <span className="text-[10px] sm:text-xs text-primary-light font-medium max-w-[50px] md:max-w-none truncate">
              {formatAddress(user?.address as string)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="xs"
            className="rounded-full p-0.5! md:p-1! flex items-center justify-center min-w-0"
            onClick={logout}
            title="Disconnect"
            aria-label="Disconnect"
          >
            <Icon icon="heroicons:power" width={10} className="md:w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
