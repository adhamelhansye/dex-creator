import { useState, useEffect, useCallback } from "react";
import { get } from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { Card } from "./Card";

// Types for workflow run data
type WorkflowRun = {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
};

type WorkflowStatusResponse = {
  totalCount: number;
  workflowRuns: WorkflowRun[];
};

type WorkflowRunDetailsResponse = {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  jobs: Array<{
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    startedAt: string | null;
    completedAt: string | null;
    steps: Array<{
      name: string;
      status: string;
      conclusion: string | null;
      number: number;
    }>;
  }>;
};

interface WorkflowStatusProps {
  dexId: string;
  workflowName?: string;
  className?: string;
  autoRefresh?: boolean;
  onSuccessfulDeployment?: (
    deploymentUrl: string,
    isNewDeployment: boolean
  ) => void;
}

export default function WorkflowStatus({
  dexId,
  workflowName,
  className = "",
  autoRefresh = true,
  onSuccessfulDeployment,
}: WorkflowStatusProps) {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [workflowStatus, setWorkflowStatus] =
    useState<WorkflowStatusResponse | null>(null);
  const [selectedRun, setSelectedRun] =
    useState<WorkflowRunDetailsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deploymentChecked, setDeploymentChecked] = useState(false);

  const fetchWorkflowStatus = useCallback(async () => {
    if (!token || !dexId) return;

    setIsLoading(true);
    setError(null);

    try {
      let url = `api/dex/${dexId}/workflow-status`;
      if (workflowName) {
        url += `?workflow=${encodeURIComponent(workflowName)}`;
      }

      const data = await get<WorkflowStatusResponse>(url, token);
      setWorkflowStatus(data);

      // If this is a manual refresh, reset the deployment checked flag
      setDeploymentChecked(false);
    } catch (error) {
      console.error("Error fetching workflow status:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to fetch workflow status: ${message}`);
      toast.error("Could not fetch workflow status");
    } finally {
      setIsLoading(false);
    }
  }, [token, dexId, workflowName]);

  const fetchRunDetails = useCallback(
    async (runId: number) => {
      if (!token || !dexId) return;

      try {
        const data = await get<WorkflowRunDetailsResponse>(
          `api/dex/${dexId}/workflow-runs/${runId}`,
          token
        );
        setSelectedRun(data);
      } catch (error) {
        console.error("Error fetching run details:", error);
        toast.error("Could not fetch workflow run details");
      }
    },
    [token, dexId]
  );

  useEffect(() => {
    fetchWorkflowStatus();

    // Set up auto-refresh if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      // Use much longer intervals to reduce API load
      const refreshInterval =
        !workflowStatus || workflowStatus.totalCount === 0
          ? 60000 // 1 minute when no workflows found (was 5 seconds)
          : 180000; // 3 minutes otherwise (was 30 seconds)

      interval = setInterval(fetchWorkflowStatus, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchWorkflowStatus, autoRefresh]);

  // Function to construct deployment URL from repo URL
  const getGitHubPagesUrl = useCallback((repoUrl: string): string => {
    try {
      // Extract repo name from GitHub URL
      // Example: https://github.com/OrderlyNetworkDexCreator/my-dex
      const match = repoUrl.match(/github\.com\/[^\/]+\/([^\/]+)/);
      if (match && match[1]) {
        const repoName = match[1];
        // Use custom domain with repo name as path
        return `https://dex.orderly.network/${repoName}/`;
      }
    } catch (error) {
      console.error("Error constructing deployment URL:", error);
    }
    return "";
  }, []);

  // Function to check for successful deployments
  const checkForSuccessfulDeployment = useCallback(() => {
    if (
      !workflowStatus ||
      !workflowStatus.workflowRuns.length ||
      !onSuccessfulDeployment
    ) {
      return;
    }

    // Get previously notified workflow IDs from localStorage
    const storageKey = `notified-deployments-${dexId}`;
    let notifiedDeployments: number[] = [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        notifiedDeployments = JSON.parse(stored);
      }
    } catch (err) {
      console.error("Error reading from localStorage:", err);
    }

    // Look for the most recent successful "Deploy to GitHub Pages" workflow run
    const deployWorkflows = workflowStatus.workflowRuns.filter(
      run => run.name === "Deploy to GitHub Pages"
    );

    // If we have deploy workflows, check for successful ones
    if (deployWorkflows.length > 0) {
      // Find the most recent successful deployment
      const successfulDeployment = deployWorkflows.find(
        run => run.status === "completed" && run.conclusion === "success"
      );

      if (successfulDeployment) {
        // Get deployment URL from the HTML URL (repo URL)
        if (successfulDeployment.htmlUrl) {
          const repoUrl =
            successfulDeployment.htmlUrl.split("/actions/runs/")[0];
          const deploymentUrl = getGitHubPagesUrl(repoUrl);
          if (deploymentUrl) {
            // Check if we've already notified for this workflow
            const isNewDeployment = !notifiedDeployments.includes(
              successfulDeployment.id
            );

            // Call parent handler with the deploymentUrl
            onSuccessfulDeployment(deploymentUrl, isNewDeployment);

            // Store this workflow ID in localStorage to avoid repeat notifications
            if (isNewDeployment) {
              notifiedDeployments.push(successfulDeployment.id);
              try {
                localStorage.setItem(
                  storageKey,
                  JSON.stringify(notifiedDeployments)
                );
              } catch (err) {
                console.error("Error writing to localStorage:", err);
              }
            }

            setDeploymentChecked(true);
            return;
          }
        }
      }

      // If we have workflows but none are successful yet, select the most recent one for display
      if (!selectedRun && deployWorkflows.length > 0) {
        fetchRunDetails(deployWorkflows[0].id);
      }
    }
  }, [
    workflowStatus,
    onSuccessfulDeployment,
    getGitHubPagesUrl,
    selectedRun,
    fetchRunDetails,
    dexId,
  ]);

  // Check for successful deployment when workflowStatus changes
  useEffect(() => {
    if (!deploymentChecked && workflowStatus) {
      checkForSuccessfulDeployment();
    }
  }, [workflowStatus, checkForSuccessfulDeployment, deploymentChecked]);

  // Format date to local time
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status badge class based on workflow status/conclusion
  const getStatusBadgeClass = (status: string, conclusion: string | null) => {
    if (status === "completed") {
      switch (conclusion) {
        case "success":
          return "bg-green-500";
        case "failure":
          return "bg-red-500";
        case "cancelled":
          return "bg-gray-500";
        default:
          return "bg-yellow-500";
      }
    } else if (status === "in_progress") {
      return "bg-blue-500 animate-pulse";
    } else if (status === "queued") {
      return "bg-blue-300";
    }
    return "bg-gray-400";
  };

  // Get human-readable status
  const getStatusText = (status: string, conclusion: string | null) => {
    if (status === "completed") {
      switch (conclusion) {
        case "success":
          return "Success";
        case "failure":
          return "Failed";
        case "cancelled":
          return "Cancelled";
        default:
          return conclusion || "Completed";
      }
    }
    return status.replace("_", " ");
  };

  if (isLoading && !workflowStatus) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="i-svg-spinners:pulse-rings-multiple h-6 w-6 mx-auto text-primary-light"></div>
        <p className="text-center text-sm mt-2">Loading workflow status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="error" className={className}>
        <h3 className="text-md font-medium mb-2">Workflow Status Error</h3>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchWorkflowStatus}
          className="mt-3 px-3 py-1 text-xs bg-dark/50 hover:bg-dark/70 rounded-md"
        >
          Retry
        </button>
      </Card>
    );
  }

  // If no workflows or empty response
  if (!workflowStatus || workflowStatus.totalCount === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="i-svg-spinners:pulse-rings-multiple h-6 w-6 mx-auto text-primary-light"></div>
        <p className="text-center text-sm mt-2">
          Waiting for workflows to start...
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card className="slide-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium">
            {workflowName
              ? `"${workflowName}" Workflow Status`
              : "Workflow Status"}
          </h3>
          <button
            onClick={fetchWorkflowStatus}
            disabled={isLoading}
            className="p-1 rounded hover:bg-dark/50"
            title="Refresh"
          >
            <div
              className={`i-mdi:refresh h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
            ></div>
          </button>
        </div>

        {workflowStatus.workflowRuns.length === 0 ? (
          <p className="text-sm text-gray-400">No recent workflow runs found</p>
        ) : (
          <div className="space-y-4">
            {/* List of workflow runs - limit to 5 most recent */}
            <div className="overflow-auto max-h-80">
              {workflowStatus.workflowRuns.slice(0, 5).map(run => (
                <div
                  key={run.id}
                  className="p-3 mb-2 bg-dark/30 rounded-lg hover:bg-dark/50 cursor-pointer staggered-item"
                  onClick={() => fetchRunDetails(run.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div
                        className={`h-3 w-3 rounded-full mr-2 ${getStatusBadgeClass(
                          run.status,
                          run.conclusion
                        )}`}
                      ></div>
                      <span className="font-medium">{run.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {getStatusText(run.status, run.conclusion)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400 flex justify-between">
                    <span>Run #{run.id}</span>
                    <span>{formatDate(run.updatedAt)}</span>
                  </div>
                </div>
              ))}
              {workflowStatus.workflowRuns.length > 5 && (
                <div className="text-xs text-gray-400 text-center mt-2 slide-fade-in-delayed">
                  Showing 5 most recent of {workflowStatus.workflowRuns.length}{" "}
                  total runs
                </div>
              )}
            </div>

            {/* Selected run details */}
            {selectedRun && (
              <div className="bg-dark/20 p-3 rounded-lg mt-4 border border-light/10 slide-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">
                    Run Details: {selectedRun.name}
                  </h4>
                  <a
                    href={selectedRun.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-light hover:underline"
                  >
                    View on GitHub
                  </a>
                </div>
                <div className="my-2 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Status</span>
                    <span className="font-medium">
                      {getStatusText(
                        selectedRun.status,
                        selectedRun.conclusion
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Started</span>
                    <span>{formatDate(selectedRun.createdAt)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Last updated</span>
                    <span>{formatDate(selectedRun.updatedAt)}</span>
                  </div>
                </div>

                {selectedRun.jobs.length > 0 && (
                  <div className="mt-3 slide-fade-in-delayed">
                    <h5 className="text-sm font-medium mb-2">Jobs</h5>
                    <div className="space-y-2">
                      {selectedRun.jobs.map((job, index) => (
                        <div
                          key={job.id}
                          className="bg-dark/30 p-2 rounded text-xs"
                          style={{
                            animation: `slideFadeIn 0.25s ease ${0.1 + index * 0.05}s forwards`,
                            opacity: 0,
                            transform: "translateY(-10px)",
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{job.name}</span>
                            <div
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                job.conclusion === "success"
                                  ? "bg-green-900/30 text-green-300"
                                  : job.conclusion === "failure"
                                    ? "bg-red-900/30 text-red-300"
                                    : job.status === "in_progress"
                                      ? "bg-blue-900/30 text-blue-300"
                                      : "bg-gray-900/30 text-gray-300"
                              }`}
                            >
                              {getStatusText(job.status, job.conclusion)}
                            </div>
                          </div>

                          {job.steps && job.steps.length > 0 && (
                            <div className="mt-2 pl-2 border-l border-light/10">
                              {job.steps.map(step => (
                                <div
                                  key={step.number}
                                  className="flex justify-between py-1"
                                >
                                  <span className="text-gray-400">
                                    {step.name}
                                  </span>
                                  <span
                                    className={
                                      step.conclusion === "success"
                                        ? "text-green-400"
                                        : step.conclusion === "failure"
                                          ? "text-red-400"
                                          : "text-gray-400"
                                    }
                                  >
                                    {getStatusText(
                                      step.status,
                                      step.conclusion
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
