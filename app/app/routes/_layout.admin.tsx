import { useState, FormEvent, useEffect } from "react";
import { toast } from "react-toastify";
import { del, get, post } from "../utils/apiClient";
import { useAuth } from "../context/useAuth";
import { Button } from "../components/Button";
import FormInput from "../components/FormInput";
import FuzzySearchInput from "../components/FuzzySearchInput";
import { generateDeploymentUrl } from "../utils/deploymentUrl";

const formatFee = (fee: number | null | undefined): string => {
  if (fee === null || fee === undefined) return "-";
  return `${fee} bps (${(fee * 0.01).toFixed(2)}%)`;
};

const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    toast.error(`Failed to copy ${label}`);
  }
};

interface DeleteDexResponse {
  message: string;
  success: boolean;
}

interface UpdateBrokerIdResponse {
  id: string;
  brokerId: string;
  brokerName: string;
}

interface RenameRepoResponse {
  message: string;
  dex: {
    id: string;
    repoUrl: string;
  };
  oldName: string;
  newName: string;
}

interface AdminCheckResponse {
  isAdmin: boolean;
}

interface AdminUser {
  id: string;
  address: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminUsersResponse {
  admins: AdminUser[];
}

interface Dex {
  id: string;
  brokerName: string;
  brokerId: string;
  preferredBrokerId?: string | null;
  repoUrl: string | null;
  customDomain?: string | null;
  createdAt: string;
  makerFee?: number | null;
  takerFee?: number | null;
  themeCSS?: string | null;
  user: {
    address: string;
  };
}

interface DexesResponse {
  dexes: Dex[];
}

interface ApproveBrokerIdResponse {
  success: boolean;
  message: string;
  dex: {
    id: string;
    brokerName: string;
    brokerId: string;
    preferredBrokerId: string | null;
  };
}

export default function AdminRoute() {
  const [allDexes, setAllDexes] = useState<Dex[]>([]);
  const [loadingDexes, setLoadingDexes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [dexToDeleteId, setDexToDeleteId] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [filteredDeleteDexes, setFilteredDeleteDexes] = useState<Dex[]>([]);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  const [dexId, setDexId] = useState("");
  const [brokerId, setBrokerId] = useState("");
  const [isUpdatingBrokerId, setIsUpdatingBrokerId] = useState(false);
  const [filteredBrokerDexes, setFilteredBrokerDexes] = useState<Dex[]>([]);
  const [brokerSearchQuery, setBrokerSearchQuery] = useState("");

  const [isApprovingBrokerId, setIsApprovingBrokerId] = useState(false);
  const [pendingBrokerIds, setPendingBrokerIds] = useState<Dex[]>([]);
  const [customBrokerId, setCustomBrokerId] = useState("");
  const [selectedDexForApproval, setSelectedDexForApproval] = useState<
    string | null
  >(null);

  const [repoDexId, setRepoDexId] = useState("");
  const [newRepoName, setNewRepoName] = useState("");
  const [isRenamingRepo, setIsRenamingRepo] = useState(false);
  const [filteredRepoDexes, setFilteredRepoDexes] = useState<Dex[]>([]);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, token } = useAuth();

  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());

  const [redeployingDexes, setRedeployingDexes] = useState<Set<string>>(
    new Set()
  );

  const toggleThemeVisibility = (dexId: string) => {
    setExpandedThemes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dexId)) {
        newSet.delete(dexId);
      } else {
        newSet.add(dexId);
      }
      return newSet;
    });
  };

  const handleRedeployment = async (dexId: string, brokerName: string) => {
    setRedeployingDexes(prev => new Set(prev).add(dexId));

    try {
      await post(`api/admin/dex/${dexId}/redeploy`, {}, token);
      toast.success(`Redeployment triggered for ${brokerName}`);
    } catch (error) {
      console.error("Error triggering redeployment:", error);
      if (error instanceof Error) {
        toast.error(`Failed to trigger redeployment: ${error.message}`);
      } else {
        toast.error("Failed to trigger redeployment");
      }
    } finally {
      setRedeployingDexes(prev => {
        const newSet = new Set(prev);
        newSet.delete(dexId);
        return newSet;
      });
    }
  };

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

      const pending = response.dexes.filter(
        dex => dex.preferredBrokerId && dex.preferredBrokerId !== dex.brokerId
      );
      setPendingBrokerIds(pending);
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

  const handleDeleteDexSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredDeleteDexes([]);
      return;
    }

    const queryLower = query.toLowerCase();
    const filtered = allDexes.filter(
      dex =>
        dex.user.address.toLowerCase().includes(queryLower) ||
        dex.brokerName.toLowerCase().includes(queryLower) ||
        dex.id.toLowerCase().includes(queryLower)
    );
    setFilteredDeleteDexes(filtered);
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

  const handleSelectDexToDelete = (dex: Dex) => {
    setDexToDeleteId(dex.id);
    setFilteredDeleteDexes([]);
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

  const handleDeleteDex = async (e: FormEvent) => {
    e.preventDefault();

    if (!dexToDeleteId.trim()) {
      toast.error("Please select a DEX to delete");
      return;
    }

    setIsDeleting(true);

    try {
      await del<DeleteDexResponse>(
        `api/admin/dex/${dexToDeleteId.trim()}`,
        null,
        token,
        { showToastOnError: false }
      );

      toast.success("DEX deleted successfully");

      loadAllDexes();
      setDexToDeleteId("");
    } catch (error) {
      console.error("Error in admin component:", error);

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
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

    try {
      await post<UpdateBrokerIdResponse>(
        `api/admin/dex/${dexId}/broker-id`,
        { brokerId: brokerId.trim() },
        token,
        { showToastOnError: false }
      );

      toast.success("Broker ID updated successfully");

      // Refresh DEX list after successful update
      loadAllDexes();
    } catch (error) {
      console.error("Error updating broker ID:", error);

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
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

    try {
      await post<RenameRepoResponse>(
        `api/admin/dex/${repoDexId}/rename-repo`,
        { newName: newRepoName.trim() },
        token,
        { showToastOnError: false }
      );

      toast.success("Repository renamed successfully");

      // Refresh DEX list after successful rename
      loadAllDexes();
    } catch (error) {
      console.error("Error renaming repository:", error);

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setIsRenamingRepo(false);
    }
  };

  const handleBrokerIdApproval = async (dexId: string, customId?: string) => {
    setIsApprovingBrokerId(true);

    try {
      const response = await post<ApproveBrokerIdResponse>(
        "api/admin/graduation/approve",
        {
          dexId,
          customBrokerId: customId,
        },
        token,
        { showToastOnError: false }
      );

      toast.success(response.message);

      loadAllDexes();

      setCustomBrokerId("");
      setSelectedDexForApproval(null);
    } catch (error) {
      console.error("Error approving broker ID:", error);

      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setIsApprovingBrokerId(false);
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

        {/* Broker ID Management - New Section */}
        <div className="bg-primary/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-primary/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Broker ID Management</h2>
            <button
              onClick={loadAllDexes}
              disabled={loadingDexes}
              className="p-1 rounded hover:bg-dark/50"
              title="Refresh DEX list"
            >
              <div
                className={`i-mdi:refresh h-5 w-5 ${loadingDexes ? "animate-spin" : ""}`}
              ></div>
            </button>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Approve or reject broker ID requests and manage fee configurations
            for DEXes.
          </p>

          {loadingDexes ? (
            <div className="text-center py-4">
              <div className="i-svg-spinners:pulse-rings h-8 w-8 mx-auto text-primary-light mb-2"></div>
              <p className="text-sm text-gray-400">Loading DEXes...</p>
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <div className="i-mdi:chart-box text-primary-light mr-1.5 h-4 w-4"></div>
                  Quick Stats
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-warning/10 rounded-lg p-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">
                        Pending Broker IDs
                      </span>
                      <span className="text-2xl font-medium text-warning">
                        {pendingBrokerIds.length}
                      </span>
                    </div>
                  </div>

                  <div className="bg-success/10 rounded-lg p-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">
                        Active Broker IDs
                      </span>
                      <span className="text-2xl font-medium text-success">
                        {allDexes.filter(
                          dex =>
                            dex.brokerId !== "demo" &&
                            dex.brokerId === dex.preferredBrokerId
                        ).length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Show quick stats for pending broker IDs */}
              {pendingBrokerIds.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <div className="i-mdi:account-key text-warning mr-1.5 h-4 w-4"></div>
                    Pending Broker ID Requests
                  </h3>
                  <div className="bg-warning/10 rounded-lg p-3">
                    <ul className="text-xs space-y-1">
                      {pendingBrokerIds.slice(0, 3).map(dex => (
                        <li key={dex.id} className="flex flex-col space-y-2">
                          <div className="flex justify-between">
                            <span>
                              <span className="font-medium">
                                {dex.brokerName}
                              </span>
                              :{" "}
                              <span className="text-primary-light">
                                {dex.preferredBrokerId}
                              </span>
                              {/* Show fee information */}
                              <span className="text-gray-400 ml-2">
                                Fees:{" "}
                                <span className="text-success">
                                  {formatFee(dex.makerFee)}
                                </span>{" "}
                                /{" "}
                                <span className="text-error">
                                  {formatFee(dex.takerFee)}
                                </span>
                              </span>
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setSelectedDexForApproval(dex.id);
                                  setCustomBrokerId(
                                    dex.preferredBrokerId || ""
                                  );
                                }}
                                className="text-primary-light hover:text-primary"
                                title="Modify broker ID"
                              >
                                <div className="i-mdi:pencil h-4 w-4"></div>
                              </button>
                            </div>
                          </div>

                          {selectedDexForApproval === dex.id && (
                            <div className="flex flex-col bg-dark/30 p-2 rounded">
                              <p className="text-xs text-gray-400 mb-2">
                                You can modify the broker ID if needed before
                                finalizing it.
                              </p>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={customBrokerId}
                                  onChange={e =>
                                    setCustomBrokerId(e.target.value)
                                  }
                                  placeholder="Enter custom broker ID"
                                  className="flex-1 bg-dark rounded px-2 py-1 text-xs border border-light/10 focus:border-primary-light"
                                />
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    handleBrokerIdApproval(
                                      dex.id,
                                      customBrokerId
                                    )
                                  }
                                  className="text-success hover:text-success/80 flex-1 bg-success/10 rounded-sm py-1 text-xs"
                                >
                                  Done
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedDexForApproval(null);
                                    setCustomBrokerId("");
                                  }}
                                  className="text-gray-400 hover:text-gray-300 bg-dark/50 rounded-sm px-2"
                                  title="Cancel"
                                >
                                  <div className="i-mdi:close h-3 w-3"></div>
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                    {pendingBrokerIds.length > 3 && (
                      <div className="text-center mt-2 text-xs text-gray-400">
                        +{pendingBrokerIds.length - 3} more pending requests
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Link to full pending request list */}
              <div className="text-right mb-4">
                <a
                  href="#pending-broker-ids"
                  className="text-xs text-primary-light hover:underline flex items-center justify-end gap-1"
                >
                  View all pending requests
                  <div className="i-mdi:arrow-right h-3 w-3"></div>
                </a>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 gap-2 mt-4">
                <button
                  onClick={() => {
                    // Scroll to update broker section
                    document
                      .getElementById("update-broker-id")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }}
                  className="bg-primary/20 hover:bg-primary/30 rounded-lg p-3 text-left flex items-center"
                >
                  <div className="i-mdi:account-key text-primary-light h-5 w-5 mr-2"></div>
                  <div>
                    <div className="text-sm font-medium">Update Broker ID</div>
                    <div className="text-xs text-gray-400">
                      Change broker ID for a DEX
                    </div>
                  </div>
                </button>
              </div>

              {/* Fee Configurations */}
              {allDexes.filter(
                dex =>
                  dex.brokerId !== "demo" &&
                  dex.brokerId === dex.preferredBrokerId
              ).length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <div className="i-mdi:percent-outline text-primary-light mr-1.5 h-4 w-4"></div>
                    Recent Fee Configurations
                  </h3>
                  <div className="bg-light/10 rounded-lg p-3">
                    <div className="text-xs mb-2 text-gray-400">
                      Approved brokers with fee configurations:
                    </div>
                    <ul className="text-xs space-y-2">
                      {allDexes
                        .filter(
                          dex =>
                            dex.brokerId !== "demo" &&
                            dex.brokerId === dex.preferredBrokerId
                        )
                        .slice(0, 3)
                        .map(dex => (
                          <li
                            key={dex.id}
                            className="flex justify-between items-center border-b border-light/5 pb-1"
                          >
                            <div>
                              <div className="font-medium">
                                {dex.brokerName}
                              </div>
                              <div className="text-primary-light text-xs">
                                {dex.brokerId}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex flex-col items-end">
                                <div className="flex items-center text-xs">
                                  <span className="text-gray-400 mr-1">
                                    Maker:
                                  </span>
                                  <span className="text-success">
                                    {formatFee(dex.makerFee)}
                                  </span>
                                </div>
                                <div className="flex items-center text-xs">
                                  <span className="text-gray-400 mr-1">
                                    Taker:
                                  </span>
                                  <span className="text-error">
                                    {formatFee(dex.takerFee)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete DEX Section */}
        <div className="bg-light/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-light/10">
          <h2 className="text-xl font-medium mb-4">Delete DEX</h2>
          <p className="text-gray-400 text-sm mb-4">
            This tool allows you to delete a DEX. This action cannot be undone
            and will remove all associated data.
          </p>

          <form onSubmit={handleDeleteDex}>
            <div className="mb-4">
              <label
                htmlFor="dexSearch"
                className="block text-sm font-medium mb-1"
              >
                Search DEX
              </label>
              <FuzzySearchInput
                placeholder="Search by wallet address, broker name or DEX ID..."
                onSearch={handleDeleteDexSearch}
                initialValue={searchQuery}
                className="mb-2"
              />

              {filteredDeleteDexes.length > 0 && (
                <div className="mt-2 border border-light/10 rounded-lg overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    {filteredDeleteDexes.map(dex => (
                      <div
                        key={dex.id}
                        className="p-2 hover:bg-primary-light/10 cursor-pointer flex justify-between items-center border-b border-light/5 last:border-b-0"
                        onClick={() => handleSelectDexToDelete(dex)}
                      >
                        <div>
                          <div className="font-medium">
                            {dex.brokerName || "Unnamed DEX"}
                          </div>
                          <div className="text-xs font-mono text-gray-400">
                            ID: {dex.id.substring(0, 8)}...
                          </div>
                          <div className="text-xs font-mono text-gray-400">
                            Wallet: {dex.user.address.substring(0, 8)}...
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
                filteredDeleteDexes.length === 0 &&
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
              id="dexToDeleteId"
              label="DEX ID"
              value={dexToDeleteId}
              onChange={e => setDexToDeleteId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              helpText="Enter the DEX ID or use the search above to find a DEX"
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
        </div>

        {/* Update Broker ID Section */}
        <div className="bg-light/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-light/10">
          <h2 className="text-xl font-medium mb-4" id="update-broker-id">
            Update Broker ID
          </h2>
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
        </div>

        {/* Pending Broker ID Requests Section */}
        <div
          className="bg-light/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-light/10"
          id="pending-broker-ids"
        >
          <h2 className="text-xl font-medium mb-4" id="pending-broker-ids">
            Pending Broker ID Requests
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            The following DEXes have requested specific broker IDs. Review the
            requests and click "Done" to set their broker ID.
          </p>

          {isApprovingBrokerId && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center">
                <div className="i-svg-spinners:pulse-rings-multiple text-primary-light mr-2 h-4 w-4"></div>
                <span className="text-sm">Processing broker ID...</span>
              </div>
            </div>
          )}

          {loadingDexes ? (
            <p>Loading DEXes...</p>
          ) : pendingBrokerIds.length === 0 ? (
            <p className="text-gray-400">No pending broker ID requests</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-4">Broker Name</th>
                    <th className="text-left py-2 px-4">Wallet Address</th>
                    <th className="text-left py-2 px-4">Current ID</th>
                    <th className="text-left py-2 px-4">Requested ID</th>
                    <th className="text-left py-2 px-4">Fees (Maker/Taker)</th>
                    <th className="text-left py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBrokerIds.map(dex => (
                    <tr
                      key={dex.id}
                      className="border-b border-gray-700 hover:bg-gray-700/30"
                    >
                      <td className="py-2 px-4">{dex.brokerName}</td>
                      <td className="py-2 px-4">
                        <span className="font-mono text-xs">
                          {dex.user.address}
                        </span>
                      </td>
                      <td className="py-2 px-4">{dex.brokerId}</td>
                      <td className="py-2 px-4 relative">
                        {selectedDexForApproval === dex.id ? (
                          <div className="flex flex-col gap-2">
                            <p className="text-xs text-gray-400 mb-1">
                              You can modify the broker ID if needed before
                              finalizing it.
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={customBrokerId}
                                onChange={e =>
                                  setCustomBrokerId(e.target.value)
                                }
                                className="flex-1 bg-dark rounded px-2 py-1 text-xs border border-light/10 focus:border-primary-light"
                                placeholder="Enter custom broker ID"
                              />
                              <button
                                onClick={() => {
                                  setSelectedDexForApproval(null);
                                  setCustomBrokerId("");
                                }}
                                className="bg-gray-700 text-gray-300 hover:bg-gray-600 p-1 rounded"
                                title="Cancel"
                              >
                                <div className="i-mdi:close h-4 w-4"></div>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            {dex.preferredBrokerId}
                            <button
                              onClick={() => {
                                setSelectedDexForApproval(dex.id);
                                setCustomBrokerId(dex.preferredBrokerId || "");
                              }}
                              className="text-primary-light hover:text-primary ml-2"
                              title="Edit broker ID"
                            >
                              <div className="i-mdi:pencil h-4 w-4"></div>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center">
                          <span className="text-success">
                            {formatFee(dex.makerFee)}
                          </span>
                          <span className="mx-1">/</span>
                          <span className="text-error">
                            {formatFee(dex.takerFee)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              handleBrokerIdApproval(dex.id, customBrokerId)
                            }
                            disabled={isApprovingBrokerId}
                          >
                            Done
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Browse All DEXes Section */}
        <div className="bg-light/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-light/10 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Browse All DEXes</h2>
            <button
              onClick={loadAllDexes}
              disabled={loadingDexes}
              className="p-1 rounded hover:bg-dark/50"
              title="Refresh DEX list"
            >
              <div
                className={`i-mdi:refresh h-5 w-5 ${loadingDexes ? "animate-spin" : ""} `}
              ></div>
            </button>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            A comprehensive list of all DEXes and their database values.
          </p>

          {loadingDexes ? (
            <div className="text-center py-4">
              <div className="i-svg-spinners:pulse-rings h-8 w-8 mx-auto text-primary-light mb-2"></div>
              <p className="text-sm text-gray-400">Loading DEXes...</p>
            </div>
          ) : allDexes.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No DEXes found.</p>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {allDexes.map(dex => (
                <div
                  key={dex.id}
                  className="bg-dark/30 p-3 rounded-lg border border-light/10"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-primary-light">
                      {dex.brokerName || "Unnamed DEX"} (ID:{" "}
                      {dex.id.substring(0, 8)}...)
                    </h3>
                    <button
                      onClick={() => copyToClipboard(dex.id, "DEX ID")}
                      className="text-gray-400 hover:text-primary-light p-1 rounded"
                      title="Copy full DEX ID"
                    >
                      <div className="i-mdi:content-copy h-4 w-4"></div>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>Broker ID:</strong> {dex.brokerId}
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(dex.brokerId, "Broker ID")
                        }
                        className="text-gray-400 hover:text-primary-light p-1 rounded ml-2"
                        title="Copy Broker ID"
                      >
                        <div className="i-mdi:content-copy h-3 w-3"></div>
                      </button>
                    </div>

                    {dex.preferredBrokerId && (
                      <div className="flex items-center justify-between">
                        <div>
                          <strong>Preferred Broker ID:</strong>{" "}
                          {dex.preferredBrokerId}
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              dex.preferredBrokerId!,
                              "Preferred Broker ID"
                            )
                          }
                          className="text-gray-400 hover:text-primary-light p-1 rounded ml-2"
                          title="Copy Preferred Broker ID"
                        >
                          <div className="i-mdi:content-copy h-3 w-3"></div>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <strong>Wallet Address:</strong>{" "}
                        <span className="font-mono">{dex.user.address}</span>
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(dex.user.address, "Wallet Address")
                        }
                        className="text-gray-400 hover:text-primary-light p-1 rounded ml-2"
                        title="Copy Wallet Address"
                      >
                        <div className="i-mdi:content-copy h-3 w-3"></div>
                      </button>
                    </div>

                    <div>
                      <strong>Created At:</strong>{" "}
                      {new Date(dex.createdAt).toLocaleString()}
                    </div>

                    {dex.repoUrl && (
                      <>
                        <div className="md:col-span-2 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <strong>Repo URL:</strong>{" "}
                            <a
                              href={dex.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-light hover:underline break-all"
                            >
                              {dex.repoUrl}
                            </a>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(dex.repoUrl!, "Repository URL")
                            }
                            className="text-gray-400 hover:text-primary-light p-1 rounded ml-2 flex-shrink-0"
                            title="Copy Repository URL"
                          >
                            <div className="i-mdi:content-copy h-3 w-3"></div>
                          </button>
                        </div>

                        {dex.customDomain ? (
                          <div className="md:col-span-2 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <strong>Custom Domain:</strong>{" "}
                              <a
                                href={`https://${dex.customDomain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-warning hover:underline break-all"
                              >
                                {dex.customDomain}
                              </a>
                            </div>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  `https://${dex.customDomain}`,
                                  "Custom Domain URL"
                                )
                              }
                              className="text-gray-400 hover:text-primary-light p-1 rounded ml-2 flex-shrink-0"
                              title="Copy Custom Domain URL"
                            >
                              <div className="i-mdi:content-copy h-3 w-3"></div>
                            </button>
                          </div>
                        ) : (
                          <div className="md:col-span-2 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <strong>Deployment URL:</strong>{" "}
                              <a
                                href={generateDeploymentUrl(dex.repoUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-success hover:underline break-all"
                              >
                                {generateDeploymentUrl(dex.repoUrl).replace(
                                  "https://",
                                  ""
                                )}
                              </a>
                            </div>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  generateDeploymentUrl(dex.repoUrl!),
                                  "Deployment URL"
                                )
                              }
                              className="text-gray-400 hover:text-primary-light p-1 rounded ml-2 flex-shrink-0"
                              title="Copy Deployment URL"
                            >
                              <div className="i-mdi:content-copy h-3 w-3"></div>
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    <div>
                      <strong>Maker Fee:</strong> {formatFee(dex.makerFee)}
                    </div>
                    <div>
                      <strong>Taker Fee:</strong> {formatFee(dex.takerFee)}
                    </div>
                  </div>

                  {/* Redeployment Button - only show if DEX has a repository */}
                  {dex.repoUrl && (
                    <div className="mt-3 pt-3 border-t border-light/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs">Actions:</strong>
                        </div>
                        <Button
                          onClick={() =>
                            handleRedeployment(dex.id, dex.brokerName)
                          }
                          disabled={redeployingDexes.has(dex.id)}
                          variant="primary"
                          size="sm"
                          className="text-xs px-3 py-1 flex items-center gap-2"
                        >
                          {redeployingDexes.has(dex.id) ? (
                            <>
                              <div className="i-svg-spinners:pulse-rings h-3 w-3"></div>
                              Deploying...
                            </>
                          ) : (
                            <>
                              <div className="i-mdi:rocket-launch h-3 w-3"></div>
                              Redeploy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Theme Section */}
                  {dex.themeCSS && (
                    <div className="mt-3 pt-3 border-t border-light/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs">CSS Theme:</strong>
                          <button
                            onClick={() => toggleThemeVisibility(dex.id)}
                            className="text-gray-400 hover:text-primary-light p-1 rounded"
                            title={
                              expandedThemes.has(dex.id)
                                ? "Hide theme"
                                : "Show theme"
                            }
                          >
                            <div
                              className={`h-3 w-3 transition-transform ${
                                expandedThemes.has(dex.id)
                                  ? "i-mdi:chevron-up"
                                  : "i-mdi:chevron-down"
                              }`}
                            ></div>
                          </button>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(dex.themeCSS!, "CSS Theme")
                          }
                          className="text-gray-400 hover:text-primary-light p-1 rounded"
                          title="Copy CSS Theme"
                        >
                          <div className="i-mdi:content-copy h-3 w-3"></div>
                        </button>
                      </div>

                      {expandedThemes.has(dex.id) && (
                        <div className="bg-dark/50 rounded p-2 max-h-40 overflow-y-auto">
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all">
                            {dex.themeCSS}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
