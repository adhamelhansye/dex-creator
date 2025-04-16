import { useState, FormEvent, useEffect } from "react";
import { toast } from "react-toastify";
import { del, get } from "../utils/apiClient";
import { useAuth } from "../context/useAuth";

// Interface for the API response when deleting a DEX
interface DeleteDexResponse {
  message: string;
  success: boolean;
}

// Interface for the admin check response
interface AdminCheckResponse {
  isAdmin: boolean;
}

export default function AdminRoute() {
  const [walletAddress, setWalletAddress] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState<
    DeleteDexResponse | { error: string } | null
  >(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, token } = useAuth();

  // Check if the current user is an admin
  useEffect(() => {
    async function checkAdmin() {
      if (!isAuthenticated) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await get<AdminCheckResponse>(
          "api/admin/check",
          token
        );
        setIsAdmin(response.isAdmin);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdmin();
  }, [isAuthenticated, token]);

  // Handle deleting a DEX by wallet address
  const handleDeleteDex = async (e: FormEvent) => {
    e.preventDefault();

    if (!walletAddress.trim()) {
      toast.error("Please enter a wallet address");
      return;
    }

    setIsDeleting(true);
    setResult(null);

    try {
      const responseData = await del<DeleteDexResponse>(
        "api/dex/admin/delete",
        {
          walletAddress: walletAddress.trim(),
        },
        token, // Use the authentication token
        { showToastOnError: false } // We'll handle the toast ourselves for a better UX
      );

      setResult(responseData);
      toast.success("DEX deleted successfully");
    } catch (error) {
      console.error("Error in admin component:", error);

      // We already set a custom error message in the API response
      // but we want to display it in the result panel too
      if (error instanceof Error) {
        setResult({ error: error.message });
      } else {
        setResult({ error: "An unknown error occurred" });
      }

      // Toast was already shown by the apiClient
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10 text-center">
        <p>Checking admin status...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Admin Tools</h1>
        <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-red-500/20">
          <p className="text-red-300 font-medium mb-2">⚠️ Access Denied</p>
          <p className="text-gray-300 text-sm">
            You don't have admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Admin Tools</h1>
      <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-red-500/20 mb-6">
        <p className="text-red-300 font-medium mb-2">
          ⚠️ Warning: Admin Only Area
        </p>
        <p className="text-gray-300 text-sm">
          This page contains tools for administrators only. Improper use can
          result in data loss.
        </p>
      </div>

      <div className="bg-light/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-light/10">
        <h2 className="text-xl font-medium mb-4">
          Delete DEX by Wallet Address
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          This tool allows you to delete a DEX associated with a specific wallet
          address. This action cannot be undone.
        </p>

        <form onSubmit={handleDeleteDex}>
          <div className="mb-4">
            <label
              htmlFor="walletAddress"
              className="block text-sm font-medium mb-2"
            >
              Wallet Address
            </label>
            <input
              id="walletAddress"
              type="text"
              value={walletAddress}
              onChange={e => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 bg-dark/50 border border-light/10 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isDeleting}
            className={`px-6 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-full font-medium 
              ${
                isDeleting
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:from-red-600 hover:to-red-800"
              }`}
          >
            {isDeleting ? "Deleting..." : "Delete DEX"}
          </button>
        </form>

        {result && (
          <div className="mt-6 p-4 bg-dark/70 rounded-lg border border-light/10 overflow-x-auto">
            <h3 className="text-sm font-medium mb-2">Result:</h3>
            <pre className="text-xs text-gray-300">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
