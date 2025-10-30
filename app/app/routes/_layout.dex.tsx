import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/useAuth";
import { useDex } from "../context/DexContext";
import { useModal } from "../context/ModalContext";
import {
  get,
  post,
  putFormData,
  del,
  createDexFormData,
} from "../utils/apiClient";
import WalletConnect from "../components/WalletConnect";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useNavigate } from "@remix-run/react";
import DexCreationStatus from "../components/DexCreationStatus";
import CustomDomainSection from "../components/CustomDomainSection";
import DexSetupAssistant from "../components/DexSetupAssistant";
import { useDexForm } from "../hooks/useDexForm";
import { DexData, defaultTheme } from "../types/dex";

export default function DexRoute() {
  const { isAuthenticated, token, isLoading } = useAuth();
  const {
    dexData,
    isLoading: isDexLoading,
    updateDexData,
    refreshDexData,
    clearDexData,
    isGraduationEligible,
    isGraduated,
    deploymentUrl: contextDeploymentUrl,
  } = useDex();
  const { openModal } = useModal();
  const navigate = useNavigate();
  const form = useDexForm();

  const [isSaving, setIsSaving] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localDeploymentUrl, setLocalDeploymentUrl] = useState<string | null>(
    null
  );
  const deploymentUrl = localDeploymentUrl || contextDeploymentUrl;
  const [deploymentConfirmed, setDeploymentConfirmed] = useState(false);

  const [upgradeStatus, setUpgradeStatus] = useState<{
    hasUpdates: boolean;
    behindBy: number;
    commits?: Array<{
      sha: string;
      message: string;
      author: string;
      date: string;
    }>;
  } | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const filteredUpgradeCommits = useMemo(() => {
    if (!upgradeStatus?.commits || upgradeStatus.commits.length === 0) {
      return [];
    }

    const featCommits = upgradeStatus.commits.filter(c =>
      c.message.toLowerCase().startsWith("feat:")
    );
    const fixCommits = upgradeStatus.commits.filter(c =>
      c.message.toLowerCase().startsWith("fix:")
    );

    let displayCommits = [...featCommits];

    if (displayCommits.length < 5) {
      displayCommits = [...displayCommits, ...fixCommits].slice(0, 5);
    }

    if (displayCommits.length < 5) {
      displayCommits = upgradeStatus.commits.slice(0, 5);
    }

    return displayCommits;
  }, [upgradeStatus]);

  useEffect(() => {
    if (dexData) {
      form.populateFromDexData({
        brokerName: dexData.brokerName,
        telegramLink: dexData.telegramLink || "",
        discordLink: dexData.discordLink || "",
        xLink: dexData.xLink || "",
        walletConnectProjectId: dexData.walletConnectProjectId || "",
        privyAppId: dexData.privyAppId || "",
        privyTermsOfUse: dexData.privyTermsOfUse || "",
        privyLoginMethods: dexData.privyLoginMethods,
        enabledMenus: dexData.enabledMenus || "",
        customMenus: dexData.customMenus || "",
        enableAbstractWallet: dexData.enableAbstractWallet || false,
        enableServiceDisclaimerDialog:
          dexData.enableServiceDisclaimerDialog || false,
        enableCampaigns: dexData.enableCampaigns || false,
        chainIds: dexData.chainIds || [],
        defaultChain: dexData.defaultChain || undefined,
        disableMainnet: dexData.disableMainnet || false,
        disableTestnet: dexData.disableTestnet || false,
        disableEvmWallets: dexData.disableEvmWallets || false,
        disableSolanaWallets: dexData.disableSolanaWallets || false,
        tradingViewColorConfig: dexData.tradingViewColorConfig ?? null,
        availableLanguages: dexData.availableLanguages || [],
        seoSiteName: dexData.seoSiteName || "",
        seoSiteDescription: dexData.seoSiteDescription || "",
        seoSiteLanguage: dexData.seoSiteLanguage || "",
        seoSiteLocale: dexData.seoSiteLocale || "",
        seoTwitterHandle: dexData.seoTwitterHandle || "",
        seoThemeColor: dexData.seoThemeColor || "",
        seoKeywords: dexData.seoKeywords || "",
        themeCSS: dexData.themeCSS,
      });

      form.setViewCssCode(false);

      if (!dexData.themeCSS) {
        form.setCurrentTheme(defaultTheme);
        form.setThemeApplied(true);
      }

      form.setActiveThemeTab("colors");
      setLocalDeploymentUrl(
        dexData.repoUrl
          ? `https://dex.orderly.network/${dexData.repoUrl.split("/").pop()}/`
          : null
      );
    }
  }, [dexData, form]);

  useEffect(() => {
    if (!form.currentTheme && !dexData?.themeCSS) {
      form.setCurrentTheme(defaultTheme);
      form.setThemeApplied(true);
    }
  }, [form, dexData?.themeCSS]);

  useEffect(() => {
    if (dexData) {
      form.loadImagesFromBase64({
        primaryLogo: dexData.primaryLogo,
        secondaryLogo: dexData.secondaryLogo,
        favicon: dexData.favicon,
        pnlPosters: dexData.pnlPosters,
      });
    }
  }, [dexData, form]);

  // Handle smooth scrolling to DEX Creation Status when navigating from config
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#dex-creation-status") {
      // Wait for the component to render, then scroll
      const timer = setTimeout(() => {
        const element = document.getElementById("dex-creation-status");
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
          // Clear the hash after scrolling
          window.history.replaceState(null, "", window.location.pathname);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dexData, isLoading, isDexLoading]);

  useEffect(() => {
    if (
      dexData &&
      dexData.customDomain &&
      !isGraduated &&
      isAuthenticated &&
      !isLoading &&
      !isDexLoading
    ) {
      const popupShownKey = `graduation-popup-shown-${dexData.id}`;
      const hasShownPopup = localStorage.getItem(popupShownKey);

      if (!hasShownPopup) {
        const timer = setTimeout(() => {
          openModal("graduationExplanation");
          localStorage.setItem(popupShownKey, "true");
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [
    dexData,
    isGraduated,
    isAuthenticated,
    isLoading,
    isDexLoading,
    openModal,
  ]);

  useEffect(() => {
    if (dexData && dexData.id && dexData.repoUrl && token) {
      const checkUpgradeStatus = async () => {
        try {
          const response = await get<{
            hasUpdates: boolean;
            behindBy: number;
            commits?: Array<{
              sha: string;
              message: string;
              author: string;
              date: string;
            }>;
          }>(`api/dex/${dexData.id}/upgrade-status`, token, {
            showToastOnError: false,
          });
          setUpgradeStatus(response);
        } catch (error) {
          console.error("Error checking upgrade status:", error);
        }
      };

      checkUpgradeStatus();
    }
  }, [dexData, token]);

  const handleRetryForking = async () => {
    if (!dexData || !dexData.id || !token) {
      toast.error("DEX information is not available");
      return;
    }

    setIsForking(true);

    try {
      const result = await post<{ dex: DexData }>(
        `api/dex/${dexData.id}/fork`,
        {},
        token
      );

      if (result && result.dex) {
        updateDexData(result.dex);

        if (result.dex.repoUrl) {
          toast.success("Repository forked successfully!");

          setLocalDeploymentUrl(
            `https://dex.orderly.network/${result.dex.repoUrl.split("/").pop()}/`
          );
        } else {
          toast.error("Repository creation failed. Please try again later.");
        }
      } else {
        toast.error(
          "Failed to get response from server. Please try again later."
        );
      }
    } catch (error) {
      console.error("Error forking repository:", error);
      toast.error("Failed to fork repository. Please try again later.");
    } finally {
      setIsForking(false);
    }
  };

  const handleSuccessfulDeployment = (
    url: string,
    isNewDeployment: boolean
  ) => {
    setLocalDeploymentUrl(url);
    setDeploymentConfirmed(true);

    if (isNewDeployment) {
      toast.success("Your DEX has been successfully deployed!");
    }
  };

  const handleDelete = async () => {
    if (!dexData || !dexData.id || !token) {
      toast.error("DEX information is not available");
      return;
    }

    setIsDeleting(true);

    try {
      await del<{ message: string }>(`api/dex/${dexData.id}`, null, token);
      toast.success("DEX deleted successfully!");

      form.resetForm();
      setLocalDeploymentUrl(null);

      clearDexData();

      navigate("/");
    } catch (error) {
      console.error("Error deleting DEX:", error);
      toast.error("Failed to delete the DEX. Please try again later.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShowDeleteConfirm = () => {
    openModal("deleteConfirm", {
      onConfirm: handleDelete,
      entityName: "DEX",
    });
  };

  const handleShowDomainRemoveConfirm = () => {
    if (!dexData || !dexData.id || !dexData.customDomain) return;

    openModal("deleteConfirm", {
      onConfirm: () => {
        setIsSaving(true);

        del(`api/dex/${dexData.id}/custom-domain`, null, token)
          .then(() => {
            updateDexData({
              customDomain: null,
            });
            toast.success("Custom domain removed successfully");
          })
          .catch(error => {
            console.error("Error removing custom domain:", error);
            toast.error("Failed to remove custom domain");
          })
          .finally(() => {
            setIsSaving(false);
          });
      },
      entityName: "custom domain",
      title: "Remove Custom Domain",
      message: `Are you sure you want to remove the custom domain "${dexData.customDomain}"? This action cannot be undone.`,
    });
  };

  const handleUpgrade = async () => {
    if (!dexData || !dexData.id) {
      toast.error("No DEX data available");
      return;
    }

    setIsUpgrading(true);

    try {
      const { formData: formValues } = await form.getFormDataWithBase64Images();

      const imageBlobs = {
        primaryLogo: form.primaryLogo,
        secondaryLogo: form.secondaryLogo,
        favicon: form.favicon,
        pnlPosters: form.pnlPosters,
      };

      const dexDataToSend = {
        brokerName: formValues.brokerName.trim(),
        telegramLink: formValues.telegramLink.trim(),
        discordLink: formValues.discordLink.trim(),
        xLink: formValues.xLink.trim(),
        walletConnectProjectId: formValues.walletConnectProjectId.trim(),
        privyAppId: formValues.privyAppId.trim(),
        privyTermsOfUse: formValues.privyTermsOfUse.trim(),
        privyLoginMethods: formValues.privyLoginMethods.join(","),
        themeCSS: formValues.themeApplied
          ? formValues.currentTheme
          : dexData?.themeCSS,
        enabledMenus: formValues.enabledMenus,
        customMenus: formValues.customMenus,
        enableAbstractWallet: formValues.enableAbstractWallet,
        enableServiceDisclaimerDialog: formValues.enableServiceDisclaimerDialog,
        enableCampaigns: formValues.enableCampaigns,
        chainIds: formValues.chainIds,
        defaultChain: formValues.defaultChain,
        disableMainnet: formValues.disableMainnet,
        disableTestnet: formValues.disableTestnet,
        disableEvmWallets: formValues.disableEvmWallets,
        disableSolanaWallets: formValues.disableSolanaWallets,
        tradingViewColorConfig: formValues.tradingViewColorConfig,
        availableLanguages: formValues.availableLanguages,
        seoSiteName: formValues.seoSiteName.trim(),
        seoSiteDescription: formValues.seoSiteDescription.trim(),
        seoSiteLanguage: formValues.seoSiteLanguage.trim(),
        seoSiteLocale: formValues.seoSiteLocale.trim(),
        seoTwitterHandle: formValues.seoTwitterHandle.trim(),
        seoThemeColor: formValues.seoThemeColor.trim(),
        seoKeywords: formValues.seoKeywords.trim(),
      };

      const formData = createDexFormData(dexDataToSend, imageBlobs);

      await putFormData<DexData>(`api/dex/${dexData.id}`, formData, token);

      toast.success(
        "DEX upgraded successfully! New features are being deployed."
      );

      setUpgradeStatus(null);
    } catch (error) {
      console.error("Error upgrading DEX:", error);
      toast.error("Failed to upgrade DEX. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  if (isLoading || isDexLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center px-4 mt-26 pb-52">
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

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10 mt-26 pb-52">
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

  if (!dexData && isAuthenticated && token) {
    return (
      <DexSetupAssistant
        token={token}
        updateDexData={updateDexData}
        refreshDexData={refreshDexData}
      />
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl mt-26 pb-52">
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
          {upgradeStatus && upgradeStatus.hasUpdates && dexData && (
            <Card className="my-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-blue-500/20 p-2 rounded-full">
                    <div className="i-mdi:arrow-up-circle text-blue-400 w-6 h-6"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                      DEX Upgrade Available
                      <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">
                        New
                      </span>
                    </h3>
                    <p className="text-gray-300 text-sm mb-2">
                      New features and improvements are ready for your DEX.
                      Click upgrade to get the latest updates.
                    </p>
                    {filteredUpgradeCommits.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-400 font-medium mb-1">
                          What's new:
                        </p>
                        {filteredUpgradeCommits.map((commit, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-gray-400 flex items-start gap-1"
                          >
                            <div className="i-mdi:check-circle h-4 w-4 flex-shrink-0 text-blue-400"></div>
                            <span className="line-clamp-1">
                              {commit.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="whitespace-nowrap flex-shrink-0"
                  variant="primary"
                >
                  {isUpgrading ? (
                    <>
                      <div className="i-svg-spinners:pulse-rings-multiple h-4 w-4 mr-2"></div>
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <div className="i-mdi:rocket-launch h-4 w-4 mr-2"></div>
                      Upgrade DEX
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {dexData && dexData.repoUrl && (
            <Card className="my-6 bg-gradient-to-r from-secondary/20 to-primary/20 border border-secondary/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-secondary/20 p-2 rounded-full">
                    <div className="i-mdi:cog text-secondary w-6 h-6"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Configure Your DEX
                    </h3>
                    <p className="text-gray-300">
                      Customize branding, themes, social links, wallets, and
                      advanced settings for your DEX.
                    </p>
                  </div>
                </div>
                <Button
                  as="a"
                  href="/dex/config"
                  className="whitespace-nowrap flex-shrink-0"
                >
                  Open Settings
                </Button>
              </div>
            </Card>
          )}

          {isGraduationEligible && !isGraduated && dexData && (
            <Card className="my-6 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-primary/20 p-2 rounded-full">
                    <div className="i-mdi:rocket-launch text-primary w-6 h-6"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Ready to Graduate?
                    </h3>
                    <p className="text-gray-300">
                      Graduate your DEX to earn fee splits.
                    </p>
                  </div>
                </div>
                <Button
                  as="a"
                  href="/dex/graduation"
                  className="whitespace-nowrap flex-shrink-0"
                >
                  Graduate Now
                </Button>
              </div>
            </Card>
          )}

          {dexData && (
            <Card className="my-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-purple-500/20 p-2 rounded-full">
                    <div className="i-mdi:share-variant text-purple-400 w-6 h-6"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      DEX Card Setup
                    </h3>
                    <p className="text-gray-300">
                      Configure how your DEX appears on the board page. Set up
                      description, banner, logo, and token information for
                      better visibility. Note: Your DEX card will only appear on
                      the board after graduation.
                    </p>
                  </div>
                </div>
                <Button
                  as="a"
                  href="/dex/card"
                  className="whitespace-nowrap flex-shrink-0"
                >
                  Setup DEX Card
                </Button>
              </div>
            </Card>
          )}

          {dexData && dexData.brokerId !== "demo" && (
            <Card
              className={`my-6 ${
                isGraduated
                  ? "bg-gradient-to-r from-success/20 to-primary/20 border border-success/30"
                  : "bg-gradient-to-r from-warning/20 to-primary/20 border border-warning/30"
              }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 p-2 rounded-full ${
                      isGraduated ? "bg-success/20" : "bg-warning/20"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 ${
                        isGraduated
                          ? "i-mdi:check-circle text-success"
                          : "i-mdi:account-key text-warning"
                      }`}
                    ></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {isGraduated ? "Graduated DEX" : "Broker ID Created"}
                    </h3>
                    <p className="text-gray-300">
                      {isGraduated ? (
                        <>
                          Your DEX is earning fee share revenue!{" "}
                          <a
                            href="/dex/graduation"
                            className="text-primary-light hover:underline"
                          >
                            Visit the graduation page
                          </a>{" "}
                          to access your earnings and manage your DEX settings.
                        </>
                      ) : (
                        <>
                          Your broker ID{" "}
                          <span className="font-mono text-primary-light">
                            {dexData.brokerId}
                          </span>{" "}
                          has been created. Complete the registration process to
                          start earning fees.
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  as="a"
                  href="/dex/graduation"
                  variant={isGraduated ? "success" : "primary"}
                  leftIcon={
                    <div
                      className={`h-4 w-4 ${
                        isGraduated
                          ? "i-mdi:cash-multiple"
                          : "i-mdi:account-plus"
                      }`}
                    ></div>
                  }
                >
                  {isGraduated ? "View Benefits" : "Complete Registration"}
                </Button>
              </div>
            </Card>
          )}

          {dexData && dexData.repoUrl && (
            <Card
              className={`my-6 ${
                isGraduated
                  ? "bg-gradient-to-r from-warning/20 to-primary/20 border border-warning/30"
                  : "bg-gradient-to-r from-gray-500/20 to-gray-400/20 border border-gray-400/30"
              }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 p-2 rounded-full ${
                      isGraduated ? "bg-warning/20" : "bg-gray-400/20"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 ${
                        isGraduated
                          ? "i-mdi:account-group text-warning"
                          : "i-mdi:lock text-gray-400"
                      }`}
                    ></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Referral Settings
                    </h3>
                    <p className="text-gray-300">
                      {isGraduated
                        ? "Set up and manage your auto referral program to incentivize traders and grow your DEX community."
                        : "Referral settings become available after graduating your DEX. Graduate first to start earning revenue and enable referrals."}
                    </p>
                  </div>
                </div>
                {isGraduated ? (
                  <Button
                    as="a"
                    href="/referral"
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    Manage Referrals
                  </Button>
                ) : (
                  <Button
                    as="a"
                    href="/dex/graduation"
                    variant="secondary"
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    Graduate DEX
                  </Button>
                )}
              </div>
            </Card>
          )}

          <DexCreationStatus
            dexData={dexData}
            deploymentUrl={deploymentUrl}
            deploymentConfirmed={deploymentConfirmed}
            isForking={isForking}
            handleRetryForking={handleRetryForking}
            handleSuccessfulDeployment={handleSuccessfulDeployment}
          />

          {dexData && dexData.repoUrl && (
            <Card>
              <CustomDomainSection
                dexData={dexData}
                token={token}
                isSaving={isSaving}
                onDexDataUpdate={updateDexData}
                onSavingChange={setIsSaving}
                onShowDomainRemoveConfirm={handleShowDomainRemoveConfirm}
              />
            </Card>
          )}

          {dexData && (
            <Card>
              <h3 className="text-lg font-bold mb-4 text-red-400">
                Danger Zone
              </h3>
              <div className="border border-red-500/20 rounded-lg p-4 bg-red-500/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="font-medium text-red-400 mb-1">
                      Delete DEX
                    </h4>
                    <p className="text-sm text-gray-400">
                      Permanently delete your DEX configuration and repository.
                      This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    onClick={handleShowDeleteConfirm}
                    disabled={isDeleting}
                    className="whitespace-nowrap"
                  >
                    {isDeleting ? "Deleting..." : "Delete DEX"}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
