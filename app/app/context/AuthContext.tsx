import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { API_BASE_URL } from "../utils/wagmiConfig";
import { toast } from "react-toastify";

interface User {
  id: string;
  address: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
  validateToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true); // Add state for initial validation
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  // Validate token function
  const validateToken = useCallback(async (): Promise<boolean> => {
    // If no token or user, not valid
    if (!token || !user?.address) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: user.address,
          token,
        }),
      });

      if (!response.ok) {
        // Token is invalid, clear auth state
        logout();
        return false;
      }

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error("Token validation error:", error);
      logout();
      return false;
    }
  }, [token, user]);

  // Load saved auth state on component mount and validate token
  useEffect(() => {
    const validateSavedAuth = async () => {
      setIsValidating(true);

      try {
        const savedToken = localStorage.getItem("auth_token");
        const savedUser = localStorage.getItem("auth_user");

        if (savedToken && savedUser) {
          // Set the saved values first
          const parsedUser = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(parsedUser);

          // Then validate with the server
          const isValid = await validateToken();

          if (!isValid) {
            // If not valid, clear the auth state
            console.log("Saved token is invalid, logging out");
            logout();
            toast.warning("Your session has expired. Please log in again.");
          }
        }
      } catch (error) {
        console.error("Error validating saved auth:", error);
        logout();
      } finally {
        setIsValidating(false);
      }
    };

    validateSavedAuth();
  }, []);

  // Handle wallet connection/disconnection
  useEffect(() => {
    if (!isConnected && user) {
      // Wallet was disconnected, log out the user
      logout();
    }
  }, [isConnected]);

  const login = useCallback(async () => {
    if (!address) {
      const errorMsg = "No wallet connected";
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Request a nonce from the server
      const nonceResponse = await fetch(`${API_BASE_URL}/api/auth/nonce`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      });

      if (!nonceResponse.ok) {
        const errorMsg = "Failed to get authentication nonce";
        throw new Error(errorMsg);
      }

      const { message } = await nonceResponse.json();

      // Step 2: Sign the message with the wallet
      const signature = await signMessageAsync({ message });

      // Step 3: Verify the signature on the server
      const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address, signature }),
      });

      if (!verifyResponse.ok) {
        const errorMsg = "Signature verification failed";
        throw new Error(errorMsg);
      }

      const { user: userData, token: authToken } = await verifyResponse.json();

      // Step 4: Save the authentication data
      setUser(userData);
      setToken(authToken);
      localStorage.setItem("auth_token", authToken);
      localStorage.setItem("auth_user", JSON.stringify(userData));
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Authentication failed";
      setError(errorMsg);
      throw err; // Re-throw the error so it can be caught by the component
    } finally {
      setIsLoading(false);
    }
  }, [address, signMessageAsync]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    disconnect();
  }, [disconnect]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading: isLoading || isValidating,
        error,
        login,
        logout,
        validateToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
