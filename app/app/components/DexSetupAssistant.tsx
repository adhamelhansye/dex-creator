import { useState, FormEvent, useMemo, useEffect } from "react";
import { useAccount } from "wagmi";
import { useTranslation } from "~/i18n";
import { toast } from "react-toastify";
import { postFormData, createDexFormData } from "../utils/apiClient";
import { buildDexDataToSend } from "../utils/dexDataBuilder";
import { Button } from "./Button";
import Form from "./Form";
import DexSectionRenderer, {
  DEX_SECTION_KEYS,
  getDexSections,
} from "./DexSectionRenderer";
import { useDexForm } from "../hooks/useDexForm";
import { DexData, ThemeTabType } from "../types/dex";
import { useBindDistrubutorCode } from "../hooks/useBindDistrubutorCode";
import { verifyDistributorCodeMessage } from "../service/distrubutorCode";
import { useDistributorCode } from "../hooks/useDistrubutorInfo";
import { useDistributor } from "../context/DistributorContext";
import { trackEvent } from "~/analytics/tracking";
import { useThemeHandlers } from "../hooks/useThemeHandlers";
import { setBuildPathSelectCallback } from "./BuildPathSection";
import type { IntegrationType } from "./BuildPathSection";

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
  const { t } = useTranslation();
  const form = useDexForm();
  const { bindDistributorCode } = useBindDistrubutorCode();

  const [isSaving, setIsSaving] = useState(false);
  const [isForking] = useState(false);
  const [forkingStatus, setForkingStatus] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>(
    {}
  );
  const [isValidating, setIsValidating] = useState(false);
  const [selectedBuildPath, setSelectedBuildPath] =
    useState<IntegrationType | null>(null);

  const { address } = useAccount();

  const { distributorInfo } = useDistributor();
  const urlDistributorCode = useDistributorCode();

  const allSections = useMemo(() => {
    return getDexSections().filter(section => {
      return section.key !== DEX_SECTION_KEYS.AnalyticsConfiguration;
    });
  }, [t]);

  const effectiveSections = useMemo(() => {
    if (selectedBuildPath === "custom") {
      return allSections.slice(0, 3);
    }
    return allSections;
  }, [allSections, selectedBuildPath]);

  useEffect(() => {
    trackEvent("dex_form_start", {
      wallet_address: address || "",
    });
  }, []);

  const totalSteps = useMemo(() => {
    return effectiveSections.length;
  }, [effectiveSections]);

  const { handleGenerateTheme, handleResetTheme, handleResetToDefault } =
    useThemeHandlers({
      token,
      form,
      originalThemeCSS: null,
    });

  const ThemeTabButton = ({
    tab: _tab,
    label,
  }: {
    tab: ThemeTabType;
    label: string;
  }) => (
    <button
      className="px-4 py-2 text-sm font-medium rounded-t-lg bg-transparent text-gray-400 hover:text-white"
      type="button"
      disabled
    >
      {label}
    </button>
  );

  const allRequiredPreviousStepsCompleted = (stepNumber: number) => {
    if (stepNumber === 1) return true;
    for (let i = 1; i < stepNumber; i++) {
      const stepConfig = effectiveSections.find(s => s.id === i);
      if (stepConfig && !stepConfig.isOptional && !completedSteps[i]) {
        return false;
      }
    }
    return true;
  };

  const handleBuildPathSelect = (pathType: IntegrationType) => {
    setSelectedBuildPath(pathType);
  };

  useEffect(() => {
    setBuildPathSelectCallback(handleBuildPathSelect);
    return () => setBuildPathSelectCallback(null);
  });

  const handleNextStep = async (step: number, skip?: boolean) => {
    const currentStepConfig = effectiveSections.find(s => s.id === step);

    if (currentStepConfig?.key === DEX_SECTION_KEYS.BuildPath) {
      if (!selectedBuildPath) {
        toast.error(t("dex.buildPath.selectRequired"));
        return;
      }

      setCompletedSteps(prev => ({ ...prev, [step]: true }));

      if (selectedBuildPath === "custom") {
        const remainingSteps = effectiveSections
          .filter(s => s.id > step)
          .map(s => s.id);
        const newCompleted: Record<number, boolean> = {
          ...completedSteps,
          [step]: true,
        };
        remainingSteps.forEach(id => {
          newCompleted[id] = true;
        });
        setCompletedSteps(newCompleted);
        setCurrentStep(effectiveSections.length + 1);
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      } else {
        setCurrentStep(step + 1);
        setTimeout(() => {
          const nextStepElement = document.getElementById(`step-${step + 1}`);
          if (nextStepElement) {
            nextStepElement.scrollIntoView({
              behavior: "smooth",
              block: "start",
              inline: "start",
            });
          }
        }, 100);
      }
      return;
    }

    if (
      currentStepConfig &&
      currentStepConfig.key === DEX_SECTION_KEYS.DistributorCode &&
      !distributorInfo?.exist
    ) {
      if (skip) {
        form.setDistributorCode("");
      } else {
        // only validate distributor code if it is filled
        const distributorCode = form.distributorCode.trim();

        if (!distributorCode) {
          toast.error(t("dex.setupAssistant.pleaseInputDistributorCode"));
          return;
        }

        let validationError = form.distributorCodeValidator(distributorCode);

        if (!validationError) {
          setIsValidating(true);
          validationError = await verifyDistributorCodeMessage(distributorCode);
          setIsValidating(false);
        }

        if (validationError !== null) {
          toast.error(
            typeof validationError === "string"
              ? validationError
              : t("dex.setupAssistant.distributorCodeInvalid")
          );
          return;
        }
      }
    }

    if (
      currentStepConfig &&
      !currentStepConfig.isOptional &&
      !skip &&
      currentStepConfig.key === DEX_SECTION_KEYS.BrokerDetails
    ) {
      const validationError = form.brokerNameValidator(form.brokerName.trim());
      if (validationError !== null) {
        toast.error(
          typeof validationError === "string"
            ? validationError
            : t("dex.setupAssistant.brokerNameInvalid")
        );
        return;
      }
    }

    if (
      step ===
      effectiveSections.find(s => s.title === "Privy Configuration")?.id
    ) {
      const privyTermsOfUseFilled =
        form.privyTermsOfUse && form.privyTermsOfUse.trim() !== "";

      if (
        privyTermsOfUseFilled &&
        form.urlValidator(form.privyTermsOfUse.trim()) !== null
      ) {
        toast.error(t("dex.setupAssistant.privyTermsInvalid"));
        return;
      }
    }

    setCompletedSteps(prev => ({ ...prev, [step]: true }));

    trackEvent("dex_form_step_complete", {
      step_number: step,
      step_name: currentStepConfig?.key || "",
      step_title: currentStepConfig?.title || "",
      is_skipped: !!skip,
      wallet_address: address || "",
      broker_name: form.brokerName.trim() || undefined,
    });

    if (step < totalSteps) {
      setCurrentStep(step + 1);

      setTimeout(() => {
        const id =
          currentStepConfig?.key === DEX_SECTION_KEYS.BrokerDetails
            ? `step-${step}`
            : `step-${step + 1}`;

        const nextStepElement = document.getElementById(id);
        if (nextStepElement) {
          nextStepElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "start",
          });
        }
      }, 100);
    } else {
      setCurrentStep(totalSteps + 1);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  const validateAllSections = async () => {
    const sectionProps = form.getSectionProps({
      handleResetTheme,
      handleResetToDefault,
      ThemeTabButton,
    });

    const validationErrors: string[] = [];

    for (const section of effectiveSections) {
      if (section.key === DEX_SECTION_KEYS.DistributorCode) {
        const code = form.distributorCode.trim();
        if (code && !distributorInfo?.exist) {
          const error =
            form.distributorCodeValidator(code) ||
            (await verifyDistributorCodeMessage(code));
          error && validationErrors.push(error);
        }
      } else if (section.getValidationTest) {
        const isValid = section.getValidationTest(sectionProps);
        if (!isValid) {
          const commonErrorMessage = `${section.title}: validation failed`;
          if (section.key === DEX_SECTION_KEYS.BrokerDetails) {
            const error = form.brokerNameValidator(form.brokerName.trim());
            validationErrors.push(error || commonErrorMessage);
          } else if (section.key === DEX_SECTION_KEYS.PrivyConfiguration) {
            validationErrors.push(
              `${section.title}: Please enter a valid Terms of Use URL`
            );
          } else {
            validationErrors.push(commonErrorMessage);
          }
        }
      }
    }

    const isSwapEnabled = form.enabledMenus.split(",").includes("Swap");
    if (
      selectedBuildPath !== "custom" &&
      isSwapEnabled &&
      form.swapFeeBps === null
    ) {
      validationErrors.push(t("dex.setupAssistant.navMenusSwapFeeRequired"));
    }

    return validationErrors;
  };

  const createDex = async (options: {
    forkingStatus: string;
    successMessageWithRepo: string;
    successMessageWithoutRepo: string;
    onSuccess?: (savedData: DexData) => void | Promise<void>;
    isQuickSetup?: boolean;
  }) => {
    const validationErrors = await validateAllSections();
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    try {
      setIsSaving(true);

      // only if it is not bound yet
      if (!distributorInfo?.exist && form.distributorCode.trim()) {
        const binded = await bindDistributorCode(form.distributorCode.trim());
        if (!binded) {
          setIsSaving(false);
          return;
        }
      }

      setForkingStatus(options.forkingStatus);
      const { formData: formValues } = await form.getFormDataWithBase64Images();

      const imageBlobs = {
        primaryLogo: form.primaryLogo,
        secondaryLogo: form.secondaryLogo,
        favicon: form.favicon,
        pnlPosters: form.pnlPosters,
      };

      const dexDataToSend = buildDexDataToSend(formValues);
      const formData = createDexFormData(dexDataToSend, imageBlobs);
      formData.append("integrationType", selectedBuildPath || "low_code");

      const savedData = await postFormData<DexData>(
        "api/dex",
        formData,
        token,
        {
          showToastOnError: false,
        }
      );

      if (savedData.repoUrl) {
        toast.success(options.successMessageWithRepo);
      } else if (selectedBuildPath !== "custom") {
        toast.success(options.successMessageWithoutRepo);
        toast.warning(t("dex.setupAssistant.repoCouldNotFork"));
      } else {
        toast.success(options.successMessageWithoutRepo);
      }

      trackEvent("create_dex_success", {
        broker_name: form.brokerName.trim(),
        wallet_address: address || "",
        is_quick_setup: !!options.isQuickSetup,
        sections_completed: Object.keys(completedSteps).length,
        total_sections: totalSteps,
      });

      if (options.onSuccess) {
        await options.onSuccess(savedData);
      }

      await refreshDexData();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error creating DEX:", error);
      toast.error(errorMessage || t("dex.setupAssistant.failedToCreate"));
    } finally {
      setIsSaving(false);
      setForkingStatus("");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    await createDex({
      forkingStatus:
        selectedBuildPath === "custom"
          ? t("dex.custom.creating")
          : t("dex.setupAssistant.creatingDex"),
      successMessageWithRepo: t("dex.setupAssistant.successWithRepo"),
      successMessageWithoutRepo:
        selectedBuildPath === "custom"
          ? t("dex.custom.successMessage")
          : t("dex.setupAssistant.successWithoutRepo"),
    });
  };

  const handleQuickSetup = async () => {
    trackEvent("click_quick_setup", {
      wallet_address: address || "",
      broker_name: form.brokerName.trim(),
    });
    await createDex({
      forkingStatus:
        selectedBuildPath === "custom"
          ? t("dex.custom.creating")
          : t("dex.setupAssistant.quickSetupForking"),
      successMessageWithRepo: t("dex.setupAssistant.quickSetupSuccessWithRepo"),
      successMessageWithoutRepo:
        selectedBuildPath === "custom"
          ? t("dex.custom.successMessage")
          : t("dex.setupAssistant.quickSetupSuccessWithoutRepo"),
      isQuickSetup: true,
      onSuccess: savedData => {
        updateDexData(savedData);
      },
    });
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
            {selectedBuildPath === "custom"
              ? t("dex.custom.settingUp")
              : t("dex.setupAssistant.settingUpDex")}
          </div>
        </div>
      </div>
    );
  }

  const quickSetup = form.brokerName.trim() &&
    !(currentStep > totalSteps && completedSteps[totalSteps]) && (
      <div
        id="quick-setup"
        className="mb-4 p-6 bg-primary/5 border border-primary/20 rounded-lg slide-fade-in flex flex-col items-center justify-center"
      >
        <h3 className="text-lg font-semibold text-primary-light mb-2 flex items-center justify-center">
          <div className="i-mdi:lightning-bolt h-5 w-5 mr-2"></div>
          {t("dex.setupAssistant.quickSetup")}
        </h3>
        <p className="text-gray-300 mb-4">
          {selectedBuildPath === "custom"
            ? t("dex.custom.quickSetupDesc")
            : t("dex.setupAssistant.quickSetupDesc")}
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
              {t("dex.setupAssistant.creatingDexShort")}
            </>
          ) : (
            <>
              <div className="i-mdi:rocket-launch h-4 w-4 mr-2"></div>
              {selectedBuildPath === "custom"
                ? t("dex.custom.createNow")
                : t("dex.setupAssistant.createDexNow")}
            </>
          )}
        </Button>
      </div>
    );

  return (
    <div className="container mx-auto p-4 max-w-3xl mt-26 pb-52">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">
          {selectedBuildPath === "custom"
            ? t("dex.custom.title")
            : t("dex.setupAssistant.title")}
        </h1>
      </div>

      <Form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
        submitText={
          currentStep > totalSteps && completedSteps[totalSteps]
            ? selectedBuildPath === "custom"
              ? t("dex.custom.createButton")
              : t("dex.setupAssistant.createYourDex")
            : ""
        }
        isLoading={isSaving}
        loadingText={t("dex.setupAssistant.creatingDexShort")}
        disabled={
          isForking ||
          isSaving ||
          !(currentStep > totalSteps && completedSteps[totalSteps])
        }
        enableRateLimit={false}
      >
        <DexSectionRenderer
          mode="accordion"
          sections={effectiveSections}
          sectionProps={form.getSectionProps({
            handleResetTheme: () => handleResetTheme(false),
            handleResetToDefault,
            ThemeTabButton,
          })}
          handleGenerateTheme={handleGenerateTheme}
          currentStep={currentStep}
          completedSteps={completedSteps}
          setCurrentStep={setCurrentStep}
          handleNextStep={handleNextStep}
          allRequiredPreviousStepsCompleted={allRequiredPreviousStepsCompleted}
          customRender={(children, section) => {
            if (section.key === DEX_SECTION_KEYS.Branding) {
              return (
                <div>
                  {quickSetup}
                  {children}
                </div>
              );
            }
            return children;
          }}
          shouldShowSkip={section => {
            if (section.key === DEX_SECTION_KEYS.DistributorCode) {
              const hideSkip =
                !!distributorInfo?.exist ||
                (!!urlDistributorCode &&
                  urlDistributorCode ===
                    form.distributorCode.trim().toUpperCase());

              return !hideSkip;
            }
            return false;
          }}
          customDescription={section => {
            if (section.key === DEX_SECTION_KEYS.DistributorCode) {
              return distributorInfo?.exist
                ? t("dex.setupAssistant.invitedByDistributor")
                : section.descriptionKey
                  ? t(section.descriptionKey)
                  : section.description;
            }
            return section.descriptionKey
              ? t(section.descriptionKey)
              : section.description;
          }}
          isValidating={isValidating}
        />
      </Form>

      {currentStep > totalSteps && completedSteps[totalSteps] && !isSaving && (
        <div className="mt-8 p-6 bg-success/10 border border-success/20 rounded-lg text-center slide-fade-in">
          <h3 className="text-lg font-semibold text-success mb-2">
            {selectedBuildPath === "custom"
              ? t("dex.custom.allStepsCompleted")
              : t("dex.setupAssistant.allStepsCompleted")}
          </h3>
          <p className="text-gray-300 mb-4">
            {selectedBuildPath === "custom"
              ? t("dex.custom.readyToCreate")
              : t("dex.setupAssistant.readyToCreate")}
          </p>
        </div>
      )}
    </div>
  );
}
