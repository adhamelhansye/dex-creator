import { useState, FormEvent } from "react";
import { toast } from "react-toastify";
import { useModal } from "../context/ModalContext";
import { postFormData, createDexFormData } from "../utils/apiClient";
import { Button } from "./Button";
import Form from "./Form";
import DexSectionRenderer, { DEX_SECTIONS } from "./DexSectionRenderer";
import { useDexForm } from "../hooks/useDexForm";
import { DexData, ThemeTabType, defaultTheme } from "../types/dex";

const TOTAL_STEPS = DEX_SECTIONS.length;

interface DexSetupAssistantProps {
  token: string;
  updateDexData: (data: Partial<DexData>) => void;
  refreshDexData: () => Promise<void>;
}

export default function DexSetupAssistant({
  token,
  updateDexData,
  refreshDexData,
}: DexSetupAssistantProps) {
  const form = useDexForm();
  const { openModal } = useModal();

  const [isSaving, setIsSaving] = useState(false);
  const [isForking] = useState(false);
  const [forkingStatus, setForkingStatus] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>(
    {}
  );

  const handleApplyGeneratedTheme = (modifiedCss: string) => {
    form.setCurrentTheme(modifiedCss);
    form.setThemeApplied(true);
  };

  const handleCancelGeneratedTheme = () => {};

  const handleGenerateTheme = async () => {
    if (!token) return;

    form.setIsGeneratingTheme(true);
    await form.generateTheme(
      token,
      null,
      handleApplyGeneratedTheme,
      handleCancelGeneratedTheme,
      openModal
    );
    form.setIsGeneratingTheme(false);
  };

  const handleResetTheme = () => {
    form.resetTheme(null);
    form.setTradingViewColorConfig(null);
    form.setShowThemeEditor(false);
    form.setViewCssCode(false);
  };

  const handleResetToDefault = () => {
    form.resetThemeToDefault();
    form.setShowThemeEditor(false);
    form.setViewCssCode(false);
  };

  const ThemeTabButton = ({
    tab,
    label,
  }: {
    tab: ThemeTabType;
    label: string;
  }) => (
    <button
      className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
        form.activeThemeTab === tab
          ? "bg-background-dark/50 text-white border-t border-l border-r border-light/10"
          : "bg-transparent text-gray-400 hover:text-white"
      }`}
      onClick={() => form.setActiveThemeTab(tab)}
      type="button"
    >
      {label}
    </button>
  );

  const allRequiredPreviousStepsCompleted = (stepNumber: number) => {
    if (stepNumber === 1) return true;
    for (let i = 1; i < stepNumber; i++) {
      const stepConfig = DEX_SECTIONS.find(s => s.id === i);
      if (stepConfig && !stepConfig.isOptional && !completedSteps[i]) {
        return false;
      }
    }
    return true;
  };

  const handleNextStep = (step: number) => {
    const currentStepConfig = DEX_SECTIONS.find(s => s.id === step);
    if (currentStepConfig && !currentStepConfig.isOptional) {
      if (step === 1) {
        const validationError = form.brokerNameValidator(
          form.brokerName.trim()
        );
        if (validationError !== null) {
          toast.error(
            typeof validationError === "string"
              ? validationError
              : "Broker name is invalid. It must be between 3 and 50 characters."
          );
          return;
        }
      }
    }

    if (
      step === DEX_SECTIONS.find(s => s.title === "Privy Configuration")?.id
    ) {
      const privyTermsOfUseFilled =
        form.privyTermsOfUse && form.privyTermsOfUse.trim() !== "";

      if (
        privyTermsOfUseFilled &&
        form.urlValidator(form.privyTermsOfUse.trim()) !== null
      ) {
        toast.error("Privy Terms of Use URL is not a valid URL.");
        return;
      }
    }

    setCompletedSteps(prev => ({ ...prev, [step]: true }));
    if (step < TOTAL_STEPS) {
      setCurrentStep(step + 1);

      setTimeout(() => {
        const nextStepElement = document.getElementById(`step-${step + 1}`);
        if (nextStepElement) {
          nextStepElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }, 100);
    } else {
      setCurrentStep(TOTAL_STEPS + 1);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  const validateAllSections = () => {
    const sectionProps = form.getSectionProps({
      handleGenerateTheme,
      handleResetTheme,
      handleResetToDefault,
      ThemeTabButton,
    });

    const validationErrors: string[] = [];

    for (const section of DEX_SECTIONS) {
      if (section.getValidationTest) {
        const isValid = section.getValidationTest(sectionProps);
        if (!isValid) {
          if (section.key === "brokerDetails") {
            const error = form.brokerNameValidator(form.brokerName.trim());
            validationErrors.push(
              error || `${section.title}: validation failed`
            );
          } else if (section.key === "privyConfiguration") {
            validationErrors.push(
              `${section.title}: Please enter a valid Terms of Use URL`
            );
          } else {
            validationErrors.push(`${section.title}: validation failed`);
          }
        }
      }
    }

    return validationErrors;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const validationErrors = validateAllSections();
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    setIsSaving(true);
    setForkingStatus("Creating DEX and forking repository...");

    try {
      const { formData: formValues } = await form.getFormDataWithBase64Images();

      const imageBlobs = {
        primaryLogo: form.primaryLogo,
        secondaryLogo: form.secondaryLogo,
        favicon: form.favicon,
        pnlPosters: form.pnlPosters,
      };

      const dexData_ToSend = {
        brokerName: formValues.brokerName.trim(),
        telegramLink: formValues.telegramLink.trim(),
        discordLink: formValues.discordLink.trim(),
        xLink: formValues.xLink.trim(),
        walletConnectProjectId: formValues.walletConnectProjectId.trim(),
        privyAppId: formValues.privyAppId.trim(),
        privyTermsOfUse: formValues.privyTermsOfUse.trim(),
        privyLoginMethods: formValues.privyLoginMethods.join(","),
        themeCSS: formValues.themeApplied ? formValues.currentTheme : null,
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

      const formData = createDexFormData(dexData_ToSend, imageBlobs);

      const savedData = await postFormData<DexData>(
        "api/dex",
        formData,
        token,
        {
          showToastOnError: false,
        }
      );

      if (savedData.repoUrl) {
        toast.success("DEX created and repository forked successfully!");
      } else {
        toast.success("DEX information saved successfully!");
        toast.warning("Repository could not be forked. You can retry later.");
      }

      await refreshDexData();
    } catch (error) {
      console.error("Error in component:", error);
    } finally {
      setIsSaving(false);
      setForkingStatus("");
    }
  };

  const handleQuickSetup = async () => {
    const validationErrors = validateAllSections();
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    setIsSaving(true);
    setForkingStatus("Creating DEX with current settings...");

    try {
      const { formData: formValues } = await form.getFormDataWithBase64Images();

      const imageBlobs = {
        primaryLogo: form.primaryLogo,
        secondaryLogo: form.secondaryLogo,
        favicon: form.favicon,
        pnlPosters: form.pnlPosters,
      };

      const dexData_ToSend = {
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
          : defaultTheme,
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

      const formData = createDexFormData(dexData_ToSend, imageBlobs);
      const savedData = await postFormData<DexData>(
        "api/dex",
        formData,
        token,
        { showToastOnError: false }
      );

      if (savedData.repoUrl) {
        toast.success(
          "DEX created with current settings! Repository is being set up."
        );
      } else {
        toast.success("DEX created with current settings!");
        toast.warning("Repository could not be forked. You can retry later.");
      }
      updateDexData(savedData);
      await refreshDexData();
    } catch (error) {
      console.error("Error in quick setup:", error);
      toast.error(
        "Failed to create DEX with default settings. Please try again."
      );
    } finally {
      setIsSaving(false);
      setForkingStatus("");
    }
  };

  if ((isSaving || isForking) && forkingStatus) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center px-4 mt-26 pb-52">
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
    <div className="container mx-auto p-4 max-w-3xl mt-26 pb-52">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">
          Create Your DEX - Step-by-Step
        </h1>
      </div>

      <Form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
        submitText={
          currentStep > TOTAL_STEPS && completedSteps[TOTAL_STEPS]
            ? "Create Your DEX"
            : ""
        }
        isLoading={isSaving}
        loadingText="Creating DEX..."
        disabled={
          isForking ||
          isSaving ||
          !(currentStep > TOTAL_STEPS && completedSteps[TOTAL_STEPS])
        }
        enableRateLimit={false}
      >
        <DexSectionRenderer
          mode="accordion"
          sections={DEX_SECTIONS}
          sectionProps={form.getSectionProps({
            handleGenerateTheme,
            handleResetTheme,
            handleResetToDefault,
            ThemeTabButton,
          })}
          currentStep={currentStep}
          completedSteps={completedSteps}
          setCurrentStep={setCurrentStep}
          handleNextStep={handleNextStep}
          allRequiredPreviousStepsCompleted={allRequiredPreviousStepsCompleted}
        />
      </Form>

      {currentStep > TOTAL_STEPS &&
        completedSteps[TOTAL_STEPS] &&
        !isSaving && (
          <div className="mt-8 p-6 bg-success/10 border border-success/20 rounded-lg text-center slide-fade-in">
            <h3 className="text-lg font-semibold text-success mb-2">
              All steps completed!
            </h3>
            <p className="text-gray-300 mb-4">
              You're ready to create your DEX. Click the "Create Your DEX"
              button above to proceed.
            </p>
          </div>
        )}

      {form.brokerName.trim() &&
        !(currentStep > TOTAL_STEPS && completedSteps[TOTAL_STEPS]) && (
          <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-lg text-center slide-fade-in">
            <h3 className="text-lg font-semibold text-primary-light mb-2 flex items-center justify-center">
              <div className="i-mdi:lightning-bolt h-5 w-5 mr-2"></div>
              Quick Setup
            </h3>
            <p className="text-gray-300 mb-4">
              Create your DEX with current settings. You can customize it later.
            </p>
            <Button
              variant="primary"
              onClick={handleQuickSetup}
              disabled={isSaving || isForking}
              className="shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSaving || isForking ? (
                <>
                  <div className="i-svg-spinners:pulse-rings-multiple h-4 w-4 mr-2"></div>
                  Creating DEX...
                </>
              ) : (
                <>
                  <div className="i-mdi:rocket-launch h-4 w-4 mr-2"></div>
                  Create DEX Now
                </>
              )}
            </Button>
          </div>
        )}
    </div>
  );
}
