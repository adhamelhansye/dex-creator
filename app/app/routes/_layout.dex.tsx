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
import ImagePaste from "../components/ImagePaste";
import PreviewButton from "../components/PreviewButton";
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
  primaryLogo?: string | null;
  secondaryLogo?: string | null;
  favicon?: string | null;
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
  const [primaryLogo, setPrimaryLogo] = useState<string | null>(null);
  const [secondaryLogo, setSecondaryLogo] = useState<string | null>(null);
  const [favicon, setFavicon] = useState<string | null>(null);
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
    primaryLogo: null as string | null,
    secondaryLogo: null as string | null,
    favicon: null as string | null,
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
          if (data.primaryLogo) {
            setPrimaryLogo(data.primaryLogo);
          }
          if (data.secondaryLogo) {
            setSecondaryLogo(data.secondaryLogo);
          }
          if (data.favicon) {
            setFavicon(data.favicon);
          }

          // Store original values for change detection
          setOriginalValues({
            brokerName: data.brokerName || "",
            telegramLink: data.telegramLink || "",
            discordLink: data.discordLink || "",
            xLink: data.xLink || "",
            primaryLogo: data.primaryLogo || null,
            secondaryLogo: data.secondaryLogo || null,
            favicon: data.favicon || null,
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

  // Handle image field changes
  const handleImageChange = (field: string) => (value: string | null) => {
    switch (field) {
      case "primaryLogo":
        setPrimaryLogo(value);
        break;
      case "secondaryLogo":
        setSecondaryLogo(value);
        break;
      case "favicon":
        setFavicon(value);
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
        trimmedXLink !== originalValues.xLink ||
        primaryLogo !== originalValues.primaryLogo ||
        secondaryLogo !== originalValues.secondaryLogo ||
        favicon !== originalValues.favicon;

      if (!hasChanges) {
        toast.info("No changes to save");
        return;
      }
    }

    setIsSaving(true);

    // If we're creating the DEX for the first time, show a forking status
    if (!dexData || !dexData.id) {
      setForkingStatus("Creating DEX and forking repository...");
    }

    try {
      let savedData: DexData;

      // Prepare the form data
      const dexFormData = {
        brokerName: trimmedBrokerName,
        telegramLink: trimmedTelegramLink || null,
        discordLink: trimmedDiscordLink || null,
        xLink: trimmedXLink || null,
        primaryLogo: primaryLogo,
        secondaryLogo: secondaryLogo,
        favicon: favicon,
      };

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
          primaryLogo,
          secondaryLogo,
          favicon,
        });

        toast.success("DEX information updated successfully!");
      } else {
        // Create new DEX
        savedData = await post<DexData>("api/dex", dexFormData, token);

        // Update originalValues after successful save
        setOriginalValues({
          brokerName: trimmedBrokerName,
          telegramLink: trimmedTelegramLink,
          discordLink: trimmedDiscordLink,
          xLink: trimmedXLink,
          primaryLogo,
          secondaryLogo,
          favicon,
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
      setPrimaryLogo(null);
      setSecondaryLogo(null);
      setFavicon(null);
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
              Branding
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Customize your DEX with your own branding by pasting your logos
              below. Copy an image to your clipboard (from any image editor or
              browser), then click in the paste area and press Ctrl+V or ⌘+V.
            </p>

            {/* Primary Logo - Full width */}
            <div className="mb-6">
              <ImagePaste
                id="primaryLogo"
                label="Primary Logo"
                value={primaryLogo || undefined}
                onChange={handleImageChange("primaryLogo")}
                imageType="primaryLogo"
                helpText="This will be used as the main logo in your DEX"
              />
            </div>

            {/* Secondary Logo and Favicon in a grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImagePaste
                id="secondaryLogo"
                label="Secondary Logo"
                value={secondaryLogo || undefined}
                onChange={handleImageChange("secondaryLogo")}
                imageType="secondaryLogo"
                helpText="This will be used in the footer and other areas"
              />

              <ImagePaste
                id="favicon"
                label="Favicon"
                value={favicon || undefined}
                onChange={handleImageChange("favicon")}
                imageType="favicon"
                helpText="This will be shown in browser tabs"
              />
            </div>

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

          {/* DEX Preview Button - Moved outside the form */}
          <div className="mt-6 pt-4 border-t border-light/10">
            <h3 className="text-md font-medium mb-3">Visual Preview</h3>
            <p className="text-xs text-gray-400 mb-4">
              See a visual preview of how your DEX will look with the current
              configuration. This is just a visual preview and does not create
              or deploy your DEX.
            </p>

            <div className="flex justify-start">
              <PreviewButton
                brokerName={brokerName || "My DEX"}
                initialSymbol="PERP_BTC_USDC"
                primaryLogo={primaryLogo}
                secondaryLogo={secondaryLogo}
                className="rounded-full py-2 px-6 font-medium transition-all duration-200 cursor-pointer border-none bg-gradient-primaryButton text-white shadow-glow hover:bg-gradient-primaryButtonHover hover:shadow-glow-hover hover:transform hover:-translate-y-0.5 flex items-center gap-2"
                buttonText="Preview DEX Design"
              />
            </div>
          </div>

          {dexData?.repoUrl ? (
            <Card variant="success" className="mb-6">
              <h3 className="text-lg font-semibold mb-2">
                DEX Creation Status
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                We've created the source code for your DEX! Here's what's
                happening now:
              </p>

              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <h4 className="text-md font-medium mb-2 flex items-center">
                  <div className="i-mdi:code-tags text-primary-light mr-2 h-5 w-5"></div>
                  Step 1: Source Code Created
                </h4>
                <p className="text-sm text-gray-300 mb-2">
                  We've created a GitHub repository containing all the code
                  needed for your DEX. Think of this as the blueprint for your
                  exchange:
                </p>
                <a
                  href={dexData.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-light hover:underline break-all mb-1 flex items-center text-sm"
                >
                  <span className="break-all">{dexData.repoUrl}</span>
                  <div className="i-mdi:open-in-new h-4 w-4 ml-1 flex-shrink-0"></div>
                </a>
                <p className="text-xs text-gray-400 italic">
                  (You don't need to do anything with this link unless you're a
                  developer)
                </p>
              </div>

              {/* Show the deployment URL if available */}
              {deploymentUrl ? (
                <div className="mb-4 p-3 bg-success/10 rounded-lg border border-success/20 slide-fade-in">
                  <h4 className="text-md font-medium mb-2 flex items-center">
                    <div className="i-mdi:check-circle text-success mr-2 h-5 w-5"></div>
                    Step 2: Your DEX is Live!
                  </h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Congratulations! Your DEX website is fully built and ready
                    to use. Your users can access it at:
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

                  {/* Add the update explanation section */}
                  <div className="mt-4 pt-3 border-t border-light/10">
                    <h5 className="text-sm font-medium mb-2 flex items-center">
                      <div className="i-mdi:information-outline text-primary-light mr-2 h-4 w-4"></div>
                      Making Changes to Your DEX
                    </h5>
                    <p className="text-xs text-gray-300 mb-2">
                      When you update any information above (like your broker
                      name, logos, or social links):
                    </p>
                    <ul className="text-xs text-gray-300 list-disc ml-5 space-y-1">
                      <li>Your changes are first saved to our system</li>
                      <li>
                        An automatic update process (workflow) runs to rebuild
                        your DEX
                      </li>
                      <li>
                        Once complete, your changes will appear live on your DEX
                        website
                      </li>
                      <li>This process typically takes 2-5 minutes</li>
                    </ul>
                    <p className="text-xs text-gray-400 mt-2 italic">
                      You can track the progress of your updates in the
                      "Deployment Progress" section below
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <h4 className="text-md font-medium mb-2 flex items-center">
                    <div className="i-mdi:progress-clock text-warning mr-2 h-5 w-5"></div>
                    Step 2: Building Your DEX Website
                  </h4>
                  <p className="text-sm text-gray-300 mb-2">
                    We're currently building your DEX website from the source
                    code. This process usually takes 2-5 minutes to complete.
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    Once complete, you'll see a link to your live DEX here.
                  </p>

                  {/* Add note about future changes */}
                  <div className="mt-3 pt-3 border-t border-light/10">
                    <h5 className="text-sm font-medium mb-2 flex items-center">
                      <div className="i-mdi:information-outline text-warning mr-2 h-4 w-4"></div>
                      About Future Updates
                    </h5>
                    <p className="text-xs text-gray-300">
                      Whenever you make changes to your DEX (updating logos,
                      social links, etc.), this same build process will run
                      again. Your changes will be live after the process
                      completes, which typically takes 2-5 minutes.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-light/10">
                <h4 className="text-md font-medium mb-3">
                  Updates & Deployment Status
                </h4>
                <p className="text-xs text-gray-400 mb-3">
                  This shows the current status of your DEX updates. When the
                  latest run shows "completed", your changes are live on your
                  DEX website:
                </p>
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
