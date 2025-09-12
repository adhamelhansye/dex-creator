import { useState, FormEvent, useEffect } from "react";
import { toast } from "react-toastify";
import { del, get, post } from "../utils/apiClient";
import { useAuth } from "../context/useAuth";
import { useModal } from "../context/ModalContext";
import { Button } from "../components/Button";
import FormInput from "../components/FormInput";
import FuzzySearchInput from "../components/FuzzySearchInput";
import Pagination from "../components/Pagination";
import { generateDeploymentUrl } from "../utils/deploymentUrl";
import { getBlockExplorerUrlByChainId } from "../../../config";
import { getCurrentEnvironment } from "../utils/config";
import { getChainById } from "../../../config";

const formatFee = (fee: number | null | undefined): string => {
  if (fee === null || fee === undefined) return "-";
  const displayFee = fee / 10;
  const formatNumber = (value: number, maxDecimals: number = 1) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    }).format(value);

  return `${formatNumber(displayFee)} bps (${formatNumber(displayFee * 0.01, 3)}%)`;
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
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface DexStatsResponse {
  total: number;
  graduated: number;
  demo: number;
}

interface DeleteBrokerIdResponse {
  success: boolean;
  message: string;
  brokerId: string;
  transactionHashes: Record<number, string>;
  dex: {
    id: string;
    brokerName: string;
    brokerId: string;
  };
}

const getChainName = (chainId: number): string => {
  const chain = getChainById(chainId);
  return chain ? chain.name : "Unknown";
};

export default function AdminRoute() {
  const [allDexes, setAllDexes] = useState<Dex[]>([]);
  const [loadingDexes, setLoadingDexes] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalDexes, setTotalDexes] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [dexStats, setDexStats] = useState<DexStatsResponse | null>(null);

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

  const [repoDexId, setRepoDexId] = useState("");
  const [newRepoName, setNewRepoName] = useState("");
  const [isRenamingRepo, setIsRenamingRepo] = useState(false);
  const [filteredRepoDexes, setFilteredRepoDexes] = useState<Dex[]>([]);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, token } = useAuth();
  const { openModal } = useModal();

  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());

  const [redeployingDexes, setRedeployingDexes] = useState<Set<string>>(
    new Set()
  );

  const [brokerIdToDelete, setBrokerIdToDelete] = useState("");
  const currentEnvironment = getCurrentEnvironment();
  const [isDeletingBrokerId, setIsDeletingBrokerId] = useState(false);
  const [deleteBrokerIdResult, setDeleteBrokerIdResult] =
    useState<DeleteBrokerIdResponse | null>(null);

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
    openModal("confirmation", {
      title: "Redeploy DEX",
      message: `Are you sure you want to trigger a redeployment for "${brokerName}"?`,
      warningMessage:
        "This will redeploy the DEX to GitHub Pages. The process may take several minutes to complete, but the current version will remain available during deployment.",
      confirmButtonText: "Redeploy",
      confirmButtonVariant: "primary",
      onConfirm: async () => {
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
      },
    });
  };

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

        if (response.isAdmin) {
          loadAdminUsers();
          loadAllDexes(1, 20, "");
          loadDexStats();
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

  const loadAllDexes = async (
    page?: number,
    size?: number,
    search?: string
  ) => {
    if (!isAuthenticated || !token) {
      return;
    }

    const targetPage = page ?? currentPage;
    const targetSize = size ?? pageSize;
    const targetSearch = search ?? searchTerm;
    const isSearch = !!targetSearch;
    const isInitialLoad = targetPage === 1 && targetSearch === "";

    if (isSearch && !isInitialLoad) {
      setSearchLoading(true);
    } else {
      setLoadingDexes(true);
    }

    try {
      const offset = (targetPage - 1) * targetSize;
      const searchParam = targetSearch
        ? `&search=${encodeURIComponent(targetSearch)}`
        : "";
      const response = await get<DexesResponse>(
        `api/admin/dexes?limit=${targetSize}&offset=${offset}${searchParam}`,
        token
      );
      setAllDexes(response.dexes);
      setTotalDexes(response.pagination.total);
      setCurrentPage(targetPage);
      setPageSize(targetSize);
      setSearchTerm(targetSearch);
    } catch (error) {
      console.error("Error loading DEXes:", error);
      toast.error("Failed to load DEXes");
    } finally {
      if (isSearch) {
        setSearchLoading(false);
      } else {
        setLoadingDexes(false);
      }
    }
  };

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

  const loadDexStats = async () => {
    try {
      const response = await get<DexStatsResponse>(
        "api/admin/dexes/stats",
        token
      );
      setDexStats(response);
    } catch (error) {
      console.error("Error loading DEX statistics:", error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const timeoutId = setTimeout(() => {
      loadAllDexes(1, pageSize, searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, pageSize, isAuthenticated, token]);

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

  const handleRepoSearch = (query: string) => {
    setRepoSearchQuery(query);
    if (!query) {
      setFilteredRepoDexes([]);
      return;
    }

    const queryLower = query.toLowerCase();
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

  const handleSelectBrokerDex = (dex: Dex) => {
    setDexId(dex.id);
    setBrokerId(dex.brokerId);
    setFilteredBrokerDexes([]);
    setBrokerSearchQuery("");
  };

  const handleSelectRepoDex = (dex: Dex) => {
    setRepoDexId(dex.id);
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

    const selectedDex = allDexes.find(dex => dex.id === dexToDeleteId.trim());
    const dexName = selectedDex?.brokerName || "Unnamed DEX";

    openModal("confirmation", {
      title: "Delete DEX",
      message: `Are you sure you want to delete "${dexName}"? This action cannot be undone.`,
      warningMessage:
        "Deleting this DEX will permanently remove all associated data from the system, including the GitHub repository. However, any deployed instances on GitHub Pages will remain active and must be manually disabled through GitHub.",
      confirmButtonText: "Delete DEX",
      confirmButtonVariant: "danger",
      isDestructive: true,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await del<DeleteDexResponse>(
            `api/admin/dex/${dexToDeleteId.trim()}`,
            null,
            token,
            { showToastOnError: false }
          );

          toast.success("DEX deleted successfully");
          loadAllDexes(currentPage, pageSize, searchTerm);
          loadDexStats();
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
      },
    });
  };

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

    const selectedDex = allDexes.find(dex => dex.id === dexId.trim());
    const dexName = selectedDex?.brokerName || "Selected DEX";
    const currentBrokerId = selectedDex?.brokerId || "Unknown";

    openModal("confirmation", {
      title: "Update Broker ID",
      message: `Are you sure you want to update the broker ID for "${dexName}" from "${currentBrokerId}" to "${brokerId.trim()}"?`,
      warningMessage:
        "Updating the broker ID will affect the DEX's integration with the Orderly Network. This change will be immediate and may impact trading functionality.",
      confirmButtonText: "Update Broker ID",
      confirmButtonVariant: "warning",
      onConfirm: async () => {
        setIsUpdatingBrokerId(true);
        try {
          await post<UpdateBrokerIdResponse>(
            `api/admin/dex/${dexId}/broker-id`,
            { brokerId: brokerId.trim() },
            token,
            { showToastOnError: false }
          );

          toast.success("Broker ID updated successfully");
          loadAllDexes(currentPage, pageSize, searchTerm);
          loadDexStats();
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
      },
    });
  };

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

    const selectedDex = allDexes.find(dex => dex.id === repoDexId.trim());
    const dexName = selectedDex?.brokerName || "Selected DEX";
    const currentRepoName = selectedDex?.repoUrl
      ? selectedDex.repoUrl.split("/").pop()
      : "Unknown";

    openModal("confirmation", {
      title: "Rename Repository",
      message: `Are you sure you want to rename the repository for "${dexName}" from "${currentRepoName}" to "${newRepoName.trim()}"?`,
      warningMessage:
        "Renaming the repository will update all references including the deployment URL. This may cause temporary downtime during the transition.",
      confirmButtonText: "Rename Repository",
      confirmButtonVariant: "warning",
      onConfirm: async () => {
        setIsRenamingRepo(true);
        try {
          await post<RenameRepoResponse>(
            `api/admin/dex/${repoDexId}/rename-repo`,
            { newName: newRepoName.trim() },
            token,
            { showToastOnError: false }
          );

          toast.success("Repository renamed successfully");
          loadAllDexes(currentPage, pageSize, searchTerm);
          loadDexStats();
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
      },
    });
  };

  const handleDeleteBrokerId = async (e: FormEvent) => {
    e.preventDefault();

    if (!brokerIdToDelete.trim()) {
      toast.error("Please enter a broker ID to delete");
      return;
    }

    openModal("confirmation", {
      title: "⚠️ Delete Broker ID",
      message: `Are you absolutely sure you want to delete broker ID "${brokerIdToDelete.trim()}" on-chain? This is an extremely destructive action.`,
      warningMessage: `This will permanently delete the broker ID on-chain and reset any DEX using it to demo mode. This action CANNOT be undone and will affect all trading functionality for associated DEXes. Current environment: ${currentEnvironment}`,
      confirmButtonText: "Delete Broker ID",
      confirmButtonVariant: "danger",
      isDestructive: true,
      onConfirm: async () => {
        setIsDeletingBrokerId(true);
        setDeleteBrokerIdResult(null);
        try {
          const response = await post<DeleteBrokerIdResponse>(
            "api/admin/broker/delete",
            {
              brokerId: brokerIdToDelete.trim(),
            },
            token,
            { showToastOnError: false }
          );

          toast.success(response.message);
          setDeleteBrokerIdResult(response);
          loadAllDexes(currentPage, pageSize, searchTerm);
          loadDexStats();
          setBrokerIdToDelete("");
        } catch (error) {
          setDeleteBrokerIdResult(null);
          console.error("Error deleting broker ID:", error);
          if (error instanceof Error) {
            toast.error(error.message);
          } else {
            toast.error("An unknown error occurred");
          }
        } finally {
          setIsDeletingBrokerId(false);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10 text-center mt-26 pb-52">
        <div className="i-svg-spinners:pulse-rings-multiple h-12 w-12 mx-auto text-primary-light mb-4"></div>
        <p>Checking admin status...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10 mt-26 pb-52">
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
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-10 mt-26 pb-52">
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

        {/* Broker ID Management */}
        <div className="bg-primary/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-primary/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Broker ID Management</h2>
            <button
              onClick={() => {
                loadAllDexes(currentPage, pageSize, searchTerm);
                loadDexStats();
              }}
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
            Manage broker ID configurations and fee settings for DEXes.
            Graduation is now automated - users can graduate their DEX by
            sending ORDER tokens.
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

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-success/10 rounded-lg p-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">
                        Active Broker IDs
                      </span>
                      <span className="text-2xl font-medium text-success">
                        {dexStats?.graduated || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Configurations */}
              {dexStats?.graduated && dexStats.graduated > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <div className="i-mdi:percent-outline text-primary-light mr-1.5 h-4 w-4"></div>
                    Recent Fee Configurations
                  </h3>
                  <div className="bg-light/10 rounded-lg p-3">
                    <div className="text-xs mb-2 text-gray-400">
                      Graduated brokers with fee configurations:
                    </div>
                    <ul className="text-xs space-y-2">
                      {allDexes
                        .filter(dex => dex.brokerId !== "demo")
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

        {/* Delete DEX Section */}
        <div className="bg-error/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-error/20">
          <div className="flex items-center mb-4">
            <div className="i-mdi:alert-octagon text-error mr-2 h-6 w-6" />
            <h2 className="text-xl font-medium text-error">Delete DEX</h2>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Danger zone! This tool will{" "}
            <span className="text-error font-semibold">
              permanently delete a DEX
            </span>{" "}
            and all associated data. This action{" "}
            <span className="font-semibold">cannot be undone</span>.
          </p>

          <form onSubmit={handleDeleteDex}>
            <div className="mb-4">
              <label
                htmlFor="dexSearch"
                className="block text-sm font-medium mb-1 text-error"
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
                <div className="mt-2 border border-error/30 rounded-lg overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    {filteredDeleteDexes.map(dex => (
                      <div
                        key={dex.id}
                        className="p-2 hover:bg-error/10 cursor-pointer flex justify-between items-center border-b border-error/20 last:border-b-0"
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

            <div>
              <label
                htmlFor="dexToDeleteId"
                className="block text-sm font-medium mb-1 text-error"
              >
                DEX ID
              </label>
              <input
                type="text"
                id="dexToDeleteId"
                value={dexToDeleteId}
                onChange={e => setDexToDeleteId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-dark rounded px-4 py-3 text-base border border-error/30 focus:border-error outline-none placeholder:text-gray-500"
              />
              <div className="text-xs text-gray-400 mt-1">
                Enter the DEX ID or use the search above to find a DEX
              </div>
            </div>

            <Button
              type="submit"
              variant="danger"
              isLoading={isDeleting}
              loadingText="Deleting..."
              className="mt-4 text-base font-semibold py-3"
            >
              Delete DEX
            </Button>
          </form>
        </div>

        {/* Delete Broker ID Section */}
        <div className="bg-error/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-error/20">
          <div className="flex items-center mb-4">
            <div className="i-mdi:alert-octagon text-error mr-2 h-6 w-6" />
            <h2 className="text-xl font-medium text-error">Delete Broker ID</h2>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Danger zone! This tool will{" "}
            <span className="text-error font-semibold">
              delete a broker ID on-chain
            </span>{" "}
            and reset any DEX using it to demo mode. This action{" "}
            <span className="font-semibold">cannot be undone</span>.
          </p>

          <form onSubmit={handleDeleteBrokerId} className="space-y-4">
            <div>
              <label
                htmlFor="brokerIdToDelete"
                className="block text-sm font-medium mb-1 text-error"
              >
                Broker ID
              </label>
              <input
                type="text"
                id="brokerIdToDelete"
                value={brokerIdToDelete}
                onChange={e => setBrokerIdToDelete(e.target.value)}
                placeholder="Enter broker ID to delete"
                className="w-full bg-dark rounded px-4 py-3 text-base border border-error/30 focus:border-error outline-none placeholder:text-gray-500"
              />
              <div className="text-xs text-gray-400 mt-1">
                Enter the broker ID to delete
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-error">
                Environment
              </label>
              <div className="w-full bg-dark rounded px-4 py-3 text-base border border-error/30">
                <span className="text-gray-300 capitalize">
                  {currentEnvironment}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Current deployment environment
              </div>
            </div>
            <Button
              type="submit"
              variant="danger"
              isLoading={isDeletingBrokerId}
              loadingText="Deleting..."
              className="mt-2 text-base font-semibold py-3"
            >
              Delete Broker ID
            </Button>
          </form>

          {deleteBrokerIdResult && (
            <div className="mt-6 bg-dark/40 border border-success/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="i-mdi:check-circle text-success mr-2 h-5 w-5" />
                <span className="text-success font-medium">
                  Broker ID deleted on-chain
                </span>
              </div>
              <div className="text-xs text-gray-300 mb-1">
                <strong>Broker ID:</strong> {deleteBrokerIdResult.brokerId}
              </div>

              {deleteBrokerIdResult.dex && (
                <div className="text-xs text-gray-300 mb-1">
                  <strong>DEX Reset:</strong>{" "}
                  {deleteBrokerIdResult.dex.brokerName} (ID:{" "}
                  {deleteBrokerIdResult.dex.id})
                </div>
              )}
              <div className="text-xs text-gray-300">
                <strong>Transaction Hashes:</strong>
                <ul className="list-disc ml-6 mt-1">
                  {Object.entries(deleteBrokerIdResult.transactionHashes).map(
                    ([chainId, txHash]) => (
                      <li key={txHash} className="break-all">
                        <a
                          href={
                            getBlockExplorerUrlByChainId(
                              txHash,
                              parseInt(chainId)
                            ) || "#"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-light hover:underline"
                        >
                          {getChainName(parseInt(chainId))}: {txHash}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Browse All DEXes Section */}
        <div className="bg-light/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-light/10 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Browse All DEXes</h2>
            <button
              onClick={() => {
                loadAllDexes(currentPage, pageSize, searchTerm);
                loadDexStats();
              }}
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

          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by broker name or broker ID..."
                value={searchTerm}
                onChange={e => handleSearch(e.target.value)}
                className="w-full bg-dark border border-light/20 rounded px-4 py-2 text-sm focus:border-primary-light outline-none placeholder:text-gray-500"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 p-1"
                  title="Clear search"
                >
                  <div className="i-mdi:close h-4 w-4"></div>
                </button>
              )}
            </div>
          </div>

          {loadingDexes ? (
            <div className="text-center py-4">
              <div className="i-svg-spinners:pulse-rings h-8 w-8 mx-auto text-primary-light mb-2"></div>
              <p className="text-sm text-gray-400">Loading DEXes...</p>
            </div>
          ) : allDexes.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No DEXes found.</p>
          ) : (
            <div className="relative space-y-4 max-h-[600px] overflow-y-auto">
              {/* Search Loading Overlay */}
              {searchLoading && (
                <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center min-h-[200px]">
                  <div className="text-center p-4">
                    <div className="i-svg-spinners:pulse-rings h-6 w-6 mx-auto text-primary-light mb-2"></div>
                    <p className="text-xs text-gray-300">Searching...</p>
                  </div>
                </div>
              )}
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

                    {dex.repoUrl && (
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
                    )}

                    {dex.customDomain && (
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
                    )}

                    {dex.repoUrl && (
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

          {/* Pagination Controls */}
          {!loadingDexes && allDexes.length > 0 && (
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalDexes}
              onPageChange={page => loadAllDexes(page, pageSize, searchTerm)}
              onPageSizeChange={size => loadAllDexes(1, size, searchTerm)}
              itemName="DEXes"
            />
          )}
        </div>
      </div>
    </div>
  );
}
