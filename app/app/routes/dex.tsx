import { useState, useEffect, FormEvent } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { get, post, put } from "../utils/apiClient";
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
  const [brokerName, setBrokerName] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [discordLink, setDiscordLink] = useState("");
  const [xLink, setXLink] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [forkingStatus, setForkingStatus] = useState("");
  const [dexData, setDexData] = useState<DexData | null>(null);

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

    setIsSaving(true);

    // For new DEX, show forking status
    if (!dexData || !dexData.id) {
      setForkingStatus("Saving DEX information...");
    }

    try {
      // Prepare data to send
      const dexFormData = {
        brokerName: brokerName.trim(),
        telegramLink: telegramLink.trim() || undefined,
        discordLink: discordLink.trim() || undefined,
        xLink: xLink.trim() || undefined,
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
        toast.success("DEX information updated successfully!");
      } else {
        // Create new DEX
        setForkingStatus("Creating repository from template...");
        savedData = await post<DexData>("api/dex", dexFormData, token);

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
    <div className="w-full max-w-3xl mx-auto px-4 py-4 md:py-6">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6">
        Create Your DEX
      </h1>

      <Card>
        <h2 className="text-lg md:text-xl font-medium mb-3 md:mb-4">
          Basic Information
        </h2>

        <Form
          onSubmit={handleSubmit}
          submitText={
            dexData && dexData.id ? "Update DEX Information" : "Create Your DEX"
          }
          isLoading={isSaving}
          loadingText="Saving"
          disabled={isForking}
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
                className="text-primary-light hover:underline break-all block mb-4"
              >
                {dexData.repoUrl}
              </a>
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
        </Form>
      </Card>
    </div>
  );
}
