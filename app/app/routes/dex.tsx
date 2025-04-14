import { useState, useEffect, FormEvent } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { get, post, put, del } from "../utils/apiClient";
import WalletConnect from "../components/WalletConnect";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import FormInput from "../components/FormInput";
import Form, { FormErrors } from "../components/Form";
import {
  validateUrl,
  required,
  minLength,
  maxLength,
  composeValidators,
} from "../utils/validation";
import WorkflowStatus from "../components/WorkflowStatus";
import { useNavigate } from "@remix-run/react";

// Define type for DEX data
interface DexData {
  id: string;
  brokerName: string;
  brokerId: string;
  themeCSS?: string | null;
  telegramLink?: string | null;
  discordLink?: string | null;
  xLink?: string | null;
  repoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DexRoute() {
  const { isAuthenticated, token, isLoading } = useAuth();
  const { openModal } = useModal();
  const navigate = useNavigate();
  const [brokerName, setBrokerName] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [discordLink, setDiscordLink] = useState("");
  const [xLink, setXLink] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [forkingStatus, setForkingStatus] = useState("");
  const [dexData, setDexData] = useState<DexData | null>(null);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Keep track of original values for change detection
  const [originalValues, setOriginalValues] = useState({
    brokerName: "",
    telegramLink: "",
    discordLink: "",
    xLink: "",
  });

  // Fetch existing DEX data if available
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    async function fetchDexData() {
      try {
        const data = await get<DexData | { exists: false }>("api/dex", token);

        // Check if data exists and set it
        if (data && "id" in data) {
          setDexData(data);

          // If DEX exists, populate the form fields
          if (data.brokerName) {
            setBrokerName(data.brokerName);
          }
          if (data.telegramLink) {
            setTelegramLink(data.telegramLink);
          }
          if (data.discordLink) {
            setDiscordLink(data.discordLink);
          }
          if (data.xLink) {
            setXLink(data.xLink);
          }

          // Store original values for change detection
          setOriginalValues({
            brokerName: data.brokerName || "",
            telegramLink: data.telegramLink || "",
            discordLink: data.discordLink || "",
            xLink: data.xLink || "",
          });

          // Try to construct the deployment URL if a repo exists
          if (data.repoUrl) {
            try {
              const match = data.repoUrl.match(/github\.com\/[^\/]+\/([^\/]+)/);
              if (match && match[1]) {
                const repoName = match[1];
                const deploymentUrl = `https://dex.orderly.network/${repoName}/`;
                setDeploymentUrl(deploymentUrl);

                // We set this as a potential URL, but the WorkflowStatus component
                // will verify if a successful deployment actually exists
              }
            } catch (error) {
              console.error("Error constructing deployment URL:", error);
            }
          }
        }
      } catch (error) {
        // Error handling is done in the apiClient, no need to duplicate here
        console.error("Error in component:", error);
      }
    }

    fetchDexData();
  }, [isAuthenticated, token]);

  // Handle retrying the forking process
  const handleRetryForking = async () => {
    if (!dexData || !dexData.id || !token) {
      toast.error("DEX information is not available");
      return;
    }

    setIsForking(true);
    setForkingStatus("Creating repository from template...");

    try {
      const result = await post<{ dex: DexData }>(
        `api/dex/${dexData.id}/fork`,
        {},
        token
      );

      // Refresh DEX data
      setDexData(result.dex);
      toast.success("Repository forked successfully!");
    } catch (error) {
      console.error("Error forking repository:", error);
      toast.error("Failed to fork repository. Please try again later.");
    } finally {
      setIsForking(false);
      setForkingStatus("");
    }
  };

  // Validation functions for form fields
  const brokerNameValidator = composeValidators(
    required("Broker name"),
    minLength(3, "Broker name"),
    maxLength(50, "Broker name")
  );

  const urlValidator = validateUrl();

  // Handle form field changes
  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Update the state based on the field
      switch (field) {
        case "brokerName":
          setBrokerName(value);
          break;
        case "telegramLink":
          setTelegramLink(value);
          break;
        case "discordLink":
          setDiscordLink(value);
          break;
        case "xLink":
          setXLink(value);
          break;
      }
    };

  // Handle saving the DEX information
  const handleSubmit = async (_: FormEvent, errors: FormErrors) => {
    if (!isAuthenticated) {
      toast.error("Please connect your wallet and login first");
      return;
    }

    // Check if there are any validation errors
    if (Object.values(errors).some(error => error !== null)) {
      // Don't submit if validation errors exist
      return;
    }

    // Prepare trimmed values
    const trimmedBrokerName = brokerName.trim();
    const trimmedTelegramLink = telegramLink.trim();
    const trimmedDiscordLink = discordLink.trim();
    const trimmedXLink = xLink.trim();

    // If this is an update (DEX already exists), check for changes
    if (dexData && dexData.id) {
      const hasChanges =
        trimmedBrokerName !== originalValues.brokerName ||
        trimmedTelegramLink !== originalValues.telegramLink ||
        trimmedDiscordLink !== originalValues.discordLink ||
        trimmedXLink !== originalValues.xLink;

      if (!hasChanges) {
        toast.info("No changes detected");
        return;
      }
    }

    setIsSaving(true);

    // For new DEX, show forking status
    if (!dexData || !dexData.id) {
      setForkingStatus("Saving DEX information...");
    }

    try {
      // Prepare data to send
      const dexFormData = {
        brokerName: trimmedBrokerName,
        telegramLink: trimmedTelegramLink || undefined,
        discordLink: trimmedDiscordLink || undefined,
        xLink: trimmedXLink || undefined,
      };

      // If DEX already exists, update it; otherwise create a new one
      let savedData: DexData;

      if (dexData && dexData.id) {
        // Update existing DEX
        savedData = await put<DexData>(
          `api/dex/${dexData.id}`,
          dexFormData,
          token
        );

        // Update originalValues after successful save
        setOriginalValues({
          brokerName: trimmedBrokerName,
          telegramLink: trimmedTelegramLink,
          discordLink: trimmedDiscordLink,
          xLink: trimmedXLink,
        });

        toast.success("DEX information updated successfully!");
      } else {
        // Create new DEX
        setForkingStatus("Creating repository from template...");
        savedData = await post<DexData>("api/dex", dexFormData, token);

        // Update originalValues after successful save
        setOriginalValues({
          brokerName: trimmedBrokerName,
          telegramLink: trimmedTelegramLink,
          discordLink: trimmedDiscordLink,
          xLink: trimmedXLink,
        });

        // Check if we got a repo URL back
        if (savedData.repoUrl) {
          toast.success("DEX created and repository forked successfully!");
        } else {
          toast.success("DEX information saved successfully!");
          toast.warning("Repository could not be forked. You can retry later.");
        }
      }

      setDexData(savedData);
    } catch (error) {
      // Error handling is done in the apiClient, this is just for any additional component-specific handling
      console.error("Error in component:", error);
    } finally {
      setIsSaving(false);
      setForkingStatus("");
    }
  };

  // Handler for when a successful deployment is detected
  const handleSuccessfulDeployment = (
    url: string,
    isNewDeployment: boolean
  ) => {
    setDeploymentUrl(url);

    // Only show the toast notification if this is a new deployment
    if (isNewDeployment) {
      toast.success("Your DEX has been successfully deployed!");
    }
  };

  // Handle deleting the DEX
  const handleDelete = async () => {
    if (!dexData || !dexData.id || !token) {
      toast.error("DEX information is not available");
      return;
    }

    setIsDeleting(true);

    try {
      await del<{ message: string }>(`api/dex/${dexData.id}`, null, token);
      toast.success("DEX deleted successfully!");

      // Reset state and redirect to home page
      setDexData(null);
      setBrokerName("");
      setTelegramLink("");
      setDiscordLink("");
      setXLink("");
      setDeploymentUrl(null);

      // Redirect to home
      navigate("/");
    } catch (error) {
      console.error("Error deleting DEX:", error);
      toast.error("Failed to delete the DEX. Please try again later.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle showing delete confirmation
  const handleShowDeleteConfirm = () => {
    openModal("deleteConfirm", {
      onConfirm: handleDelete,
      entityName: "DEX",
    });
  };

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="i-svg-spinners:pulse-rings-multiple h-12 w-12 mx-auto text-primary-light mb-4"></div>
          <div className="text-base md:text-lg mb-2">Loading your DEX</div>
          <div className="text-xs md:text-sm text-gray-400">
            Please wait while we fetch your configuration
          </div>
        </div>
      </div>
    );
  }

  // Display authentication UI for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6">
            Create Your DEX
          </h1>
          <Card>
            <h2 className="text-lg md:text-xl font-medium mb-3 md:mb-4">
              Authentication Required
            </h2>
            <p className="mb-4 md:mb-6 text-sm md:text-base text-gray-300">
              Please connect your wallet and login to create and manage your
              DEX.
            </p>
            <div className="flex justify-center">
              <WalletConnect />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // If we are forking, show a more detailed loading state
  if ((isSaving || isForking) && forkingStatus) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="i-svg-spinners:pulse-rings-multiple h-12 w-12 mx-auto text-primary-light mb-4"></div>
          <div className="text-lg md:text-xl mb-4 font-medium">
            {forkingStatus}
          </div>
          <div className="text-xs md:text-sm text-gray-400 max-w-sm mx-auto">
            This may take a moment. We're setting up your DEX repository and
            configuring it with your information.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">
          {dexData ? "Manage Your DEX" : "Create Your DEX"}
        </h1>
      </div>

      {!isAuthenticated && !isLoading ? (
        <div className="text-center mt-16">
          <Card className="p-8">
            <p className="text-lg mb-6">
              Please connect your wallet to create or manage your DEX.
            </p>
            <div className="flex justify-center">
              <WalletConnect />
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          <Form
            onSubmit={handleSubmit}
            className="space-y-6"
            submitText={
              dexData && dexData.id
                ? "Update DEX Information"
                : "Create Your DEX"
            }
            isLoading={isSaving}
            loadingText="Saving"
            disabled={isForking || isDeleting}
          >
            <FormInput
              id="brokerName"
              label="Broker Name"
              value={brokerName}
              onChange={handleInputChange("brokerName")}
              placeholder="Enter your broker name"
              helpText="This name will be used in the HTML metadata, environment configuration, and other places throughout your DEX"
              required={true}
              minLength={3}
              maxLength={50}
              validator={brokerNameValidator}
            />

            <h3 className="text-md font-medium mb-3 mt-6 border-t border-light/10 pt-4">
              Social Media Links
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Add social media links that will appear in your DEX footer. Leave
              empty if not applicable.
            </p>

            <FormInput
              id="telegramLink"
              label="Telegram URL"
              value={telegramLink}
              onChange={handleInputChange("telegramLink")}
              type="url"
              placeholder="https://t.me/your-group"
              validator={urlValidator}
            />

            <FormInput
              id="discordLink"
              label="Discord URL"
              value={discordLink}
              onChange={handleInputChange("discordLink")}
              type="url"
              placeholder="https://discord.gg/your-server"
              validator={urlValidator}
            />

            <FormInput
              id="xLink"
              label="Twitter/X URL"
              value={xLink}
              onChange={handleInputChange("xLink")}
              type="url"
              placeholder="https://twitter.com/your-account"
              validator={urlValidator}
            />
          </Form>

          {dexData?.repoUrl ? (
            <Card variant="success" className="mb-6">
              <h3 className="text-lg font-semibold mb-2">
                Your DEX Repository
              </h3>
              <p className="text-sm text-gray-300 mb-2">
                Your DEX has been created and is available at:
              </p>
              <a
                href={dexData.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-light hover:underline break-all mb-4 flex items-center"
              >
                <span className="break-all">{dexData.repoUrl}</span>
                <div className="i-mdi:open-in-new h-4 w-4 ml-1 flex-shrink-0"></div>
              </a>

              {/* Show the deployment URL if available */}
              {deploymentUrl && (
                <div className="mt-3 mb-4 p-3 bg-success/10 rounded-lg border border-success/20 slide-fade-in">
                  <h4 className="text-md font-medium mb-2 flex items-center">
                    <div className="i-mdi:check-circle text-success mr-2 h-5 w-5"></div>
                    Live DEX Available
                  </h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Your DEX is now live and accessible at:
                  </p>
                  <a
                    href={deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded text-primary-light transition-colors"
                  >
                    <span className="break-all">{deploymentUrl}</span>
                    <div className="i-mdi:open-in-new h-4 w-4"></div>
                  </a>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-light/10">
                <h4 className="text-md font-medium mb-3">Deployment Status</h4>
                <WorkflowStatus
                  dexId={dexData.id}
                  workflowName="Deploy to GitHub Pages"
                  onSuccessfulDeployment={handleSuccessfulDeployment}
                />
              </div>
            </Card>
          ) : dexData && !dexData.repoUrl ? (
            // Repository creation failed but DEX was created
            // Show retry button
            <Card variant="error" className="mb-6">
              <p className="text-sm text-gray-300 mb-2">
                <span className="text-red-300 font-medium">⚠️ Note:</span> Your
                DEX configuration was saved, but we couldn't create your
                repository.
              </p>
              <p className="text-sm text-gray-300 mb-4">
                You can retry the repository creation now.
              </p>
              <Button
                onClick={handleRetryForking}
                disabled={isForking}
                variant="danger"
                size="sm"
                isLoading={isForking}
                loadingText="Retrying..."
              >
                Retry Repository Creation
              </Button>
            </Card>
          ) : null}

          {/* Danger Zone card */}
          {dexData && dexData.id && (
            <div className="mt-12 pt-6 border-t border-primary-light/10">
              <Card variant="error">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-red-500">
                      Danger Zone
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      This action permanently deletes your DEX and its GitHub
                      repository.
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    onClick={handleShowDeleteConfirm}
                    className="mt-4 md:mt-0 shrink-0"
                    disabled={isDeleting || isLoading || isSaving}
                  >
                    Delete DEX
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
