import { useState, useEffect, FormEvent } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { get, post, put } from "../utils/apiClient";
import WalletConnect from "../components/WalletConnect";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

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

          // If DEX exists, populate the broker name
          if (data.brokerName) {
            setBrokerName(data.brokerName);
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

  // Handle saving the broker name
  const handleSaveBrokerName = async (e: FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please connect your wallet and login first");
      return;
    }

    if (!brokerName.trim()) {
      toast.error("Please enter a broker name");
      return;
    }

    setIsSaving(true);

    // For new DEX, show forking status
    if (!dexData || !dexData.id) {
      setForkingStatus("Saving DEX information...");
    }

    try {
      // If DEX already exists, update it; otherwise create a new one
      let savedData: DexData;

      if (dexData && dexData.id) {
        // Update existing DEX
        savedData = await put<DexData>(
          `api/dex/${dexData.id}`,
          { brokerName: brokerName.trim() },
          token
        );
        toast.success("DEX information updated successfully!");
      } else {
        // Create new DEX
        setForkingStatus("Creating repository from template...");
        savedData = await post<DexData>(
          "api/dex",
          { brokerName: brokerName.trim() },
          token
        );

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

        <form onSubmit={handleSaveBrokerName}>
          <div className="mb-4 md:mb-6">
            <label
              htmlFor="brokerName"
              className="block text-sm font-medium mb-1 md:mb-2"
            >
              Broker Name
            </label>
            <input
              id="brokerName"
              type="text"
              value={brokerName}
              onChange={e => setBrokerName(e.target.value)}
              placeholder="Enter your broker name"
              className="w-full px-3 md:px-4 py-2 bg-dark/50 border border-light/10 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm md:text-base"
              maxLength={50}
              minLength={3}
            />
            <p className="mt-1 text-xs text-gray-400">
              This name will be used in the HTML metadata, environment
              configuration, and other places throughout your DEX
            </p>
          </div>

          {dexData?.repoUrl ? (
            <div className="mb-6">
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
            </div>
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

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSaving || isForking}
            isLoading={isSaving}
            loadingText="Saving"
          >
            {dexData && dexData.id
              ? "Update DEX Information"
              : "Create Your DEX"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
