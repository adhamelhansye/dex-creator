import { useState, FormEvent, useEffect } from "react";
import { toast } from "react-toastify";
import { del, get, post } from "../utils/apiClient";
import { useAuth } from "../context/useAuth";
import { Button } from "../components/Button";
import FormInput from "../components/FormInput";
import FuzzySearchInput from "../components/FuzzySearchInput";

// Interface for the API response when deleting a DEX
interface DeleteDexResponse {
  message: string;
  success: boolean;
}

// Interface for updating broker ID
interface UpdateBrokerIdResponse {
  id: string;
  brokerId: string;
  brokerName: string;
  // Other properties might be returned but we're focusing on these
}

// Interface for renaming repository
interface RenameRepoResponse {
  message: string;
  dex: {
    id: string;
    repoUrl: string;
  };
  oldName: string;
  newName: string;
}

// Interface for the admin check response
interface AdminCheckResponse {
  isAdmin: boolean;
}

// Interface for admin user
interface AdminUser {
  id: string;
  address: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for admin users response
interface AdminUsersResponse {
  admins: AdminUser[];
}

// Interface for DEX
interface Dex {
  id: string;
  brokerName: string;
  brokerId: string;
  repoUrl: string | null;
  createdAt: string;
  user: {
    address: string;
  };
}

// Interface for DEXes response
interface DexesResponse {
  dexes: Dex[];
}

export default function AdminRoute() {
  // All DEXes data
  const [allDexes, setAllDexes] = useState<Dex[]>([]);
  const [loadingDexes, setLoadingDexes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Delete DEX state
  const [walletAddress, setWalletAddress] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<
    DeleteDexResponse | { error: string } | null
  >(null);
  const [filteredWalletDexes, setFilteredWalletDexes] = useState<Dex[]>([]);

  // Admin users state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  // Broker ID update state
  const [dexId, setDexId] = useState("");
  const [brokerId, setBrokerId] = useState("");
  const [isUpdatingBrokerId, setIsUpdatingBrokerId] = useState(false);
  const [brokerIdResult, setBrokerIdResult] = useState<
    UpdateBrokerIdResponse | { error: string } | null
  >(null);
  const [filteredBrokerDexes, setFilteredBrokerDexes] = useState<Dex[]>([]);
  const [brokerSearchQuery, setBrokerSearchQuery] = useState("");

  // Repository rename state
  const [repoDexId, setRepoDexId] = useState("");
  const [newRepoName, setNewRepoName] = useState("");
  const [isRenamingRepo, setIsRenamingRepo] = useState(false);
  const [renameRepoResult, setRenameRepoResult] = useState<
    RenameRepoResponse | { error: string } | null
  >(null);
  const [filteredRepoDexes, setFilteredRepoDexes] = useState<Dex[]>([]);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");

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

        // If admin, load admin users and DEXes
        if (response.isAdmin) {
          loadAdminUsers();
          loadAllDexes();
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdmin();
  }, [isAuthenticated, token]);

  // Load all DEXes
  const loadAllDexes = async () => {
    setLoadingDexes(true);
    try {
      const response = await get<DexesResponse>("api/admin/dexes", token);
      setAllDexes(response.dexes);
    } catch (error) {
      console.error("Error loading DEXes:", error);
      toast.error("Failed to load DEXes");
    } finally {
      setLoadingDexes(false);
    }
  };

  // Load admin users
  const loadAdminUsers = async () => {
    setIsLoadingAdmins(true);
    try {
      const response = await get<AdminUsersResponse>("api/admin/users", token);
      setAdminUsers(response.admins);
    } catch (error) {
      console.error("Error loading admin users:", error);
      toast.error("Failed to load admin users");
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  // Handle wallet address search
  const handleWalletSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredWalletDexes([]);
      return;
    }

    const queryLower = query.toLowerCase();
    const filtered = allDexes.filter(
      dex =>
        dex.user.address.toLowerCase().includes(queryLower) ||
        dex.brokerName.toLowerCase().includes(queryLower)
    );
    setFilteredWalletDexes(filtered);
  };

  // Handle broker ID search
  const handleBrokerSearch = (query: string) => {
    setBrokerSearchQuery(query);
    if (!query) {
      setFilteredBrokerDexes([]);
      return;
    }

    const queryLower = query.toLowerCase();
    const filtered = allDexes.filter(
      dex =>
        dex.id.toLowerCase().includes(queryLower) ||
        dex.brokerName.toLowerCase().includes(queryLower) ||
        dex.brokerId.toLowerCase().includes(queryLower)
    );
    setFilteredBrokerDexes(filtered);
  };

  // Handle repository search
  const handleRepoSearch = (query: string) => {
    setRepoSearchQuery(query);
    if (!query) {
      setFilteredRepoDexes([]);
      return;
    }

    const queryLower = query.toLowerCase();
    // Only filter DEXes that have a repository URL
    const filtered = allDexes.filter(
      dex =>
        dex.repoUrl &&
        (dex.id.toLowerCase().includes(queryLower) ||
          dex.brokerName.toLowerCase().includes(queryLower) ||
          dex.repoUrl.toLowerCase().includes(queryLower))
    );
    setFilteredRepoDexes(filtered);
  };

  // Handle selecting a DEX for wallet address deletion
  const handleSelectWalletDex = (dex: Dex) => {
    setWalletAddress(dex.user.address);
    setFilteredWalletDexes([]);
    setSearchQuery("");
  };

  // Handle selecting a DEX for broker ID update
  const handleSelectBrokerDex = (dex: Dex) => {
    setDexId(dex.id);
    setBrokerId(dex.brokerId); // Pre-fill with current broker ID
    setFilteredBrokerDexes([]);
    setBrokerSearchQuery("");
  };

  // Handle selecting a DEX for repository rename
  const handleSelectRepoDex = (dex: Dex) => {
    setRepoDexId(dex.id);
    // Extract current repo name for pre-filling
    if (dex.repoUrl) {
      const match = dex.repoUrl.match(/github\.com\/[^/]+\/([^/]+)/);
      if (match && match[1]) {
        setNewRepoName(match[1]);
      }
    }
    setFilteredRepoDexes([]);
    setRepoSearchQuery("");
  };

  // Handle deleting a DEX by wallet address
  const handleDeleteDex = async (e: FormEvent) => {
    e.preventDefault();

    if (!walletAddress.trim()) {
      toast.error("Please enter a wallet address");
      return;
    }

    setIsDeleting(true);
    setDeleteResult(null);

    try {
      const responseData = await del<DeleteDexResponse>(
        "api/dex/admin/delete",
        {
          walletAddress: walletAddress.trim(),
        },
        token,
        { showToastOnError: false }
      );

      setDeleteResult(responseData);
      toast.success("DEX deleted successfully");

      // Refresh DEX list after successful deletion
      loadAllDexes();
    } catch (error) {
      console.error("Error in admin component:", error);

      if (error instanceof Error) {
        setDeleteResult({ error: error.message });
      } else {
        setDeleteResult({ error: "An unknown error occurred" });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle updating broker ID
  const handleUpdateBrokerId = async (e: FormEvent) => {
    e.preventDefault();

    if (!dexId.trim()) {
      toast.error("Please enter a DEX ID");
      return;
    }

    if (!brokerId.trim()) {
      toast.error("Please enter a Broker ID");
      return;
    }

    setIsUpdatingBrokerId(true);
    setBrokerIdResult(null);

    try {
      const responseData = await post<UpdateBrokerIdResponse>(
        `api/admin/dex/${dexId}/broker-id`,
        { brokerId: brokerId.trim() },
        token,
        { showToastOnError: false }
      );

      setBrokerIdResult(responseData);
      toast.success("Broker ID updated successfully");

      // Refresh DEX list after successful update
      loadAllDexes();
    } catch (error) {
      console.error("Error updating broker ID:", error);

      if (error instanceof Error) {
        setBrokerIdResult({ error: error.message });
      } else {
        setBrokerIdResult({ error: "An unknown error occurred" });
      }
    } finally {
      setIsUpdatingBrokerId(false);
    }
  };

  // Handle repository rename
  const handleRenameRepo = async (e: FormEvent) => {
    e.preventDefault();

    if (!repoDexId.trim()) {
      toast.error("Please enter a DEX ID");
      return;
    }

    if (!newRepoName.trim()) {
      toast.error("Please enter a new repository name");
      return;
    }

    setIsRenamingRepo(true);
    setRenameRepoResult(null);

    try {
      const responseData = await post<RenameRepoResponse>(
        `api/admin/dex/${repoDexId}/rename-repo`,
        { newName: newRepoName.trim() },
        token,
        { showToastOnError: false }
      );

      setRenameRepoResult(responseData);
      toast.success("Repository renamed successfully");

      // Refresh DEX list after successful rename
      loadAllDexes();
    } catch (error) {
      console.error("Error renaming repository:", error);

      if (error instanceof Error) {
        setRenameRepoResult({ error: error.message });
      } else {
        setRenameRepoResult({ error: "An unknown error occurred" });
      }
    } finally {
      setIsRenamingRepo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10 text-center">
        <div className="i-svg-spinners:pulse-rings-multiple h-12 w-12 mx-auto text-primary-light mb-4"></div>
        <p>Checking admin status...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Admin Tools</h1>
        <div className="bg-error/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-error/20">
          <p className="text-error font-medium mb-2">⚠️ Access Denied</p>
          <p className="text-gray-300 text-sm">
            You don't have admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Admin Tools</h1>
      <div className="bg-warning/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-warning/20 mb-6">
        <p className="text-warning font-medium mb-2">
          ⚠️ Warning: Admin Only Area
        </p>
        <p className="text-gray-300 text-sm">
          This page contains tools for administrators only. Improper use can
          result in data loss.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Users Section */}
        <div className="bg-light/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-light/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Admin Users</h2>
            <button
              onClick={loadAdminUsers}
              disabled={isLoadingAdmins}
              className="p-1 rounded hover:bg-dark/50"
              title="Refresh admin list"
            >
              <div
                className={`i-mdi:refresh h-5 w-5 ${isLoadingAdmins ? "animate-spin" : ""}`}
              ></div>
            </button>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            List of users with admin privileges.
          </p>

          {isLoadingAdmins ? (
            <div className="text-center py-4">
              <div className="i-svg-spinners:pulse-rings h-8 w-8 mx-auto text-primary-light mb-2"></div>
              <p className="text-sm text-gray-400">Loading admins...</p>
            </div>
          ) : (
            <>
              {adminUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-light/10">
                        <th className="px-2 py-2">Address</th>
                        <th className="px-2 py-2">Added On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map(admin => (
                        <tr key={admin.id} className="border-b border-light/5">
                          <td className="px-2 py-3 font-mono text-xs">
                            {admin.address.substring(0, 6)}...
                            {admin.address.substring(admin.address.length - 4)}
                          </td>
                          <td className="px-2 py-3">
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  No admin users found.
                </p>
              )}
            </>
          )}
        </div>

        {/* Delete DEX Section */}
        <div className="bg-light/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-light/10">
          <h2 className="text-xl font-medium mb-4">
            Delete DEX by Wallet Address
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            This tool allows you to delete a DEX associated with a specific
            wallet address. This action cannot be undone.
          </p>

          <form onSubmit={handleDeleteDex}>
            <div className="mb-4">
              <label
                htmlFor="walletSearch"
                className="block text-sm font-medium mb-1"
              >
                Search DEX
              </label>
              <FuzzySearchInput
                placeholder="Search by wallet or broker name..."
                onSearch={handleWalletSearch}
                initialValue={searchQuery}
                className="mb-2"
              />

              {filteredWalletDexes.length > 0 && (
                <div className="mt-2 border border-light/10 rounded-lg overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    {filteredWalletDexes.map(dex => (
                      <div
                        key={dex.id}
                        className="p-2 hover:bg-primary-light/10 cursor-pointer flex justify-between items-center border-b border-light/5 last:border-b-0"
                        onClick={() => handleSelectWalletDex(dex)}
                      >
                        <div>
                          <div className="font-medium">
                            {dex.brokerName || "Unnamed DEX"}
                          </div>
                          <div className="text-xs font-mono text-gray-400">
                            {dex.user.address.substring(0, 8)}...
                            {dex.user.address.substring(
                              dex.user.address.length - 6
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(dex.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery &&
                filteredWalletDexes.length === 0 &&
                !loadingDexes && (
                  <div className="text-sm text-gray-400 p-2">
                    No DEXes found matching your search.
                  </div>
                )}

              {loadingDexes && (
                <div className="text-center py-2">
                  <div className="i-svg-spinners:pulse-rings h-6 w-6 mx-auto text-primary-light/80"></div>
                </div>
              )}
            </div>

            <FormInput
              id="walletAddress"
              label="Wallet Address"
              value={walletAddress}
              onChange={e => setWalletAddress(e.target.value)}
              placeholder="0x..."
              helpText="Enter the full wallet address"
              required
            />

            <Button
              type="submit"
              variant="danger"
              isLoading={isDeleting}
              loadingText="Deleting..."
              className="mt-2"
            >
              Delete DEX
            </Button>
          </form>

          {deleteResult && (
            <div className="mt-6 p-4 bg-dark/70 rounded-lg border border-light/10 overflow-x-auto">
              <h3 className="text-sm font-medium mb-2">Result:</h3>
              <pre className="text-xs text-gray-300">
                {JSON.stringify(deleteResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Update Broker ID Section */}
        <div className="bg-light/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-light/10">
          <h2 className="text-xl font-medium mb-4">Update Broker ID</h2>
          <p className="text-gray-400 text-sm mb-4">
            Update the broker ID for a specific DEX. This affects the DEX's
            integration with the Orderly Network.
          </p>

          <form onSubmit={handleUpdateBrokerId}>
            <div className="mb-4">
              <label
                htmlFor="brokerSearch"
                className="block text-sm font-medium mb-1"
              >
                Search DEX
              </label>
              <FuzzySearchInput
                placeholder="Search by DEX ID or broker name..."
                onSearch={handleBrokerSearch}
                initialValue={brokerSearchQuery}
                className="mb-2"
              />

              {filteredBrokerDexes.length > 0 && (
                <div className="mt-2 border border-light/10 rounded-lg overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    {filteredBrokerDexes.map(dex => (
                      <div
                        key={dex.id}
                        className="p-2 hover:bg-primary-light/10 cursor-pointer flex justify-between border-b border-light/5 last:border-b-0"
                        onClick={() => handleSelectBrokerDex(dex)}
                      >
                        <div>
                          <div className="font-medium">
                            {dex.brokerName || "Unnamed DEX"}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {dex.id.substring(0, 8)}...
                          </div>
                          <div className="text-xs text-gray-400">
                            Current Broker ID: {dex.brokerId}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(dex.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {brokerSearchQuery &&
                filteredBrokerDexes.length === 0 &&
                !loadingDexes && (
                  <div className="text-sm text-gray-400 p-2">
                    No DEXes found matching your search.
                  </div>
                )}

              {loadingDexes && (
                <div className="text-center py-2">
                  <div className="i-svg-spinners:pulse-rings h-6 w-6 mx-auto text-primary-light/80"></div>
                </div>
              )}
            </div>

            <FormInput
              id="dexId"
              label="DEX ID"
              value={dexId}
              onChange={e => setDexId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              helpText="Enter the UUID of the DEX to update"
              required
            />

            <FormInput
              id="brokerId"
              label="New Broker ID"
              value={brokerId}
              onChange={e => setBrokerId(e.target.value)}
              placeholder="new-broker-id"
              helpText="Enter the new broker ID (1-50 characters)"
              required
              minLength={1}
              maxLength={50}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdatingBrokerId}
              loadingText="Updating..."
              className="mt-2"
            >
              Update Broker ID
            </Button>
          </form>

          {brokerIdResult && (
            <div className="mt-6 p-4 bg-dark/70 rounded-lg border border-light/10 overflow-x-auto">
              <h3 className="text-sm font-medium mb-2">Result:</h3>
              <pre className="text-xs text-gray-300">
                {JSON.stringify(brokerIdResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Rename Repository Section */}
        <div className="bg-light/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-light/10">
          <h2 className="text-xl font-medium mb-4">Rename Repository</h2>
          <p className="text-gray-400 text-sm mb-4">
            Rename the GitHub repository for a DEX. This will update all
            references including the deployment URL.
          </p>

          <form onSubmit={handleRenameRepo}>
            <div className="mb-4">
              <label
                htmlFor="repoSearch"
                className="block text-sm font-medium mb-1"
              >
                Search DEX
              </label>
              <FuzzySearchInput
                placeholder="Search by DEX ID or broker name..."
                onSearch={handleRepoSearch}
                initialValue={repoSearchQuery}
                className="mb-2"
              />

              {filteredRepoDexes.length > 0 && (
                <div className="mt-2 border border-light/10 rounded-lg overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    {filteredRepoDexes.map(dex => (
                      <div
                        key={dex.id}
                        className="p-2 hover:bg-primary-light/10 cursor-pointer flex justify-between border-b border-light/5 last:border-b-0"
                        onClick={() => handleSelectRepoDex(dex)}
                      >
                        <div>
                          <div className="font-medium">
                            {dex.brokerName || "Unnamed DEX"}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {dex.id.substring(0, 8)}...
                          </div>
                          {dex.repoUrl && (
                            <div className="text-xs text-gray-400 truncate max-w-xs">
                              Repo:{" "}
                              {dex.repoUrl.replace("https://github.com/", "")}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(dex.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {repoSearchQuery &&
                filteredRepoDexes.length === 0 &&
                !loadingDexes && (
                  <div className="text-sm text-gray-400 p-2">
                    No DEXes found matching your search.
                  </div>
                )}

              {loadingDexes && (
                <div className="text-center py-2">
                  <div className="i-svg-spinners:pulse-rings h-6 w-6 mx-auto text-primary-light/80"></div>
                </div>
              )}
            </div>

            <FormInput
              id="repoDexId"
              label="DEX ID"
              value={repoDexId}
              onChange={e => setRepoDexId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              helpText="Enter the UUID of the DEX to update"
              required
            />

            <FormInput
              id="newRepoName"
              label="New Repository Name"
              value={newRepoName}
              onChange={e => setNewRepoName(e.target.value)}
              placeholder="new-repo-name"
              helpText="Lowercase letters, numbers, and hyphens only"
              required
              pattern="^[a-z0-9-]+$"
              minLength={1}
              maxLength={90}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isRenamingRepo}
              loadingText="Renaming..."
              className="mt-2"
            >
              Rename Repository
            </Button>
          </form>

          {renameRepoResult && (
            <div className="mt-6 p-4 bg-dark/70 rounded-lg border border-light/10 overflow-x-auto">
              <h3 className="text-sm font-medium mb-2">Result:</h3>
              <pre className="text-xs text-gray-300">
                {JSON.stringify(renameRepoResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
