import React, { useState, useEffect, useRef } from "react";
import AccordionItem from "./AccordionItem";
import BrokerDetailsSection from "./BrokerDetailsSection";
import BrandingSection from "./BrandingSection";
import ThemeCustomizationSection from "./ThemeCustomizationSection";
import PnLPostersSection from "./PnLPostersSection";
import SocialLinksSection from "./SocialLinksSection";
import SEOConfigSection from "./SEOConfigSection";
import ReownConfigSection from "./ReownConfigSection";
import PrivyConfigSection from "./PrivyConfigSection";
import BlockchainConfigSection from "./BlockchainConfigSection";
import LanguageSupportSection from "./LanguageSupportSection";
import NavigationMenuSection from "./NavigationMenuSection";
import ProgressTracker from "./ProgressTracker";

export interface DexSectionConfig {
  id: number;
  key: string;
  title: string;
  description: string;
  isOptional: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProps: (allProps: DexSectionAllProps) => any;
  getValidationTest?: (allProps: DexSectionAllProps) => boolean;
}

export interface DexSectionAllProps {
  // Broker Details
  brokerName: string;
  handleInputChange: (
    field: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  brokerNameValidator: (value: string) => string | null;

  // Branding
  primaryLogo: Blob | null;
  secondaryLogo: Blob | null;
  favicon: Blob | null;
  handleImageChange: (field: string) => (blob: Blob | null) => void;

  // Theme
  currentTheme: string | null;
  defaultTheme: string;
  showThemeEditor: boolean;
  viewCssCode: boolean;
  activeThemeTab: "colors" | "rounded" | "spacing" | "tradingview";
  themePrompt: string;
  isGeneratingTheme: boolean;
  themeApplied: boolean;
  tradingViewColorConfig: string | null;
  toggleThemeEditor: () => void;
  handleResetTheme: () => void;
  handleResetToDefault: () => void;
  handleResetSelectedColors?: (selectedColors: string[]) => void;
  handleResetSelectedColorsToDefault?: (selectedColors: string[]) => void;
  handleThemeEditorChange: (value: string) => void;
  setViewCssCode: (value: boolean) => void;
  ThemeTabButton: React.FC<{
    tab: "colors" | "rounded" | "spacing" | "tradingview";
    label: string;
  }>;
  updateCssColor: (variableName: string, newColorHex: string) => void;
  updateCssValue: (variableName: string, newValue: string) => void;
  handleGenerateTheme: () => void;
  setTradingViewColorConfig: (config: string | null) => void;

  // PnL Posters
  pnlPosters: (Blob | null)[];
  handlePnLPosterChange: (posters: (Blob | null)[]) => void;

  // Social Links
  telegramLink: string;
  discordLink: string;
  xLink: string;
  urlValidator: (value: string) => string | null;

  // SEO
  seoSiteName: string;
  seoSiteDescription: string;
  seoSiteLanguage: string;
  seoSiteLocale: string;
  seoTwitterHandle: string;
  seoThemeColor: string;
  seoKeywords: string;

  // Reown
  walletConnectProjectId: string;

  // Privy
  privyAppId: string;
  privyTermsOfUse: string;
  enableAbstractWallet: boolean;
  onEnableAbstractWalletChange: (value: boolean) => void;
  disableEvmWallets: boolean;
  disableSolanaWallets: boolean;
  onDisableEvmWalletsChange: (value: boolean) => void;
  onDisableSolanaWalletsChange: (value: boolean) => void;
  privyLoginMethods: string[];
  onPrivyLoginMethodsChange: (methods: string[]) => void;

  // Blockchain
  chainIds: number[];
  onChainIdsChange: (chainIds: number[]) => void;
  defaultChain?: number;
  onDefaultChainChange?: (chainId: number | undefined) => void;
  disableMainnet: boolean;
  disableTestnet: boolean;
  onDisableMainnetChange: (value: boolean) => void;
  onDisableTestnetChange: (value: boolean) => void;

  // Language Support
  availableLanguages: string[];
  onAvailableLanguagesChange: (languages: string[]) => void;

  // Navigation Menus
  enabledMenus: string;
  setEnabledMenus: (menus: string) => void;
  customMenus: string;
  setCustomMenus: (menus: string) => void;
  enableCampaigns: boolean;
  setEnableCampaigns: (value: boolean) => void;
}

export const DEX_SECTIONS: DexSectionConfig[] = [
  {
    id: 1,
    key: "brokerDetails",
    title: "Broker Details",
    description:
      "Configure your DEX's basic information and trading broker details.",
    isOptional: false,
    component: BrokerDetailsSection,
    getProps: props => ({
      brokerName: props.brokerName,
      handleInputChange: props.handleInputChange,
      brokerNameValidator: props.brokerNameValidator,
    }),
    getValidationTest: props =>
      props.brokerNameValidator(props.brokerName.trim()) === null,
  },
  {
    id: 2,
    key: "branding",
    title: "Branding",
    description:
      "Customize your DEX with your own branding by pasting your logos below. Copy an image to your clipboard (from any image editor or browser), then click in the paste area and press Ctrl+V or ⌘+V. All branding fields are optional.",
    isOptional: true,
    component: BrandingSection,
    getProps: props => ({
      primaryLogo: props.primaryLogo,
      secondaryLogo: props.secondaryLogo,
      favicon: props.favicon,
      handleImageChange: props.handleImageChange,
    }),
  },
  {
    id: 3,
    key: "themeCustomization",
    title: "Theme Customization",
    description:
      "Customize your DEX's colors and theme by editing the CSS directly or describing how you want it to look for AI-assisted generation. Theme customization is completely optional - your DEX will work great with the default theme.",
    isOptional: true,
    component: ThemeCustomizationSection,
    getProps: props => ({
      currentTheme: props.currentTheme,
      defaultTheme: props.defaultTheme,
      showThemeEditor: props.showThemeEditor,
      viewCssCode: props.viewCssCode,
      activeThemeTab: props.activeThemeTab,
      themePrompt: props.themePrompt,
      isGeneratingTheme: props.isGeneratingTheme,
      brokerName: props.brokerName,
      primaryLogo: props.primaryLogo,
      secondaryLogo: props.secondaryLogo,
      themeApplied: props.themeApplied,
      tradingViewColorConfig: props.tradingViewColorConfig,
      toggleThemeEditor: props.toggleThemeEditor,
      handleResetTheme: props.handleResetTheme,
      handleResetToDefault: props.handleResetToDefault,
      handleResetSelectedColors: props.handleResetSelectedColors,
      handleResetSelectedColorsToDefault:
        props.handleResetSelectedColorsToDefault,
      handleThemeEditorChange: props.handleThemeEditorChange,
      setViewCssCode: props.setViewCssCode,
      ThemeTabButton: props.ThemeTabButton,
      updateCssColor: props.updateCssColor,
      updateCssValue: props.updateCssValue,
      handleInputChange: props.handleInputChange,
      handleGenerateTheme: props.handleGenerateTheme,
      setTradingViewColorConfig: props.setTradingViewColorConfig,
    }),
  },
  {
    id: 4,
    key: "pnlPosters",
    title: "PnL Posters",
    description:
      "Upload custom background images for PnL sharing posters. Users can share their trading performance with these backgrounds. You can upload up to 8 custom poster backgrounds. Leave empty to use default poster designs.",
    isOptional: true,
    component: PnLPostersSection,
    getProps: props => ({
      pnlPosters: props.pnlPosters,
      onChange: props.handlePnLPosterChange,
    }),
  },
  {
    id: 5,
    key: "socialLinks",
    title: "Social Media Links",
    description:
      "Add social media links that will appear in your DEX footer. All social media links are optional. Leave empty if not applicable.",
    isOptional: true,
    component: SocialLinksSection,
    getProps: props => ({
      telegramLink: props.telegramLink,
      discordLink: props.discordLink,
      xLink: props.xLink,
      handleInputChange: props.handleInputChange,
      urlValidator: props.urlValidator,
    }),
  },
  {
    id: 6,
    key: "seoConfiguration",
    title: "SEO Configuration",
    description:
      "Configure SEO settings to optimize how your DEX appears in search engines and social media sharing. All SEO fields are optional but recommended for better discoverability.",
    isOptional: true,
    component: SEOConfigSection,
    getProps: props => ({
      seoSiteName: props.seoSiteName,
      seoSiteDescription: props.seoSiteDescription,
      seoSiteLanguage: props.seoSiteLanguage,
      seoSiteLocale: props.seoSiteLocale,
      seoTwitterHandle: props.seoTwitterHandle,
      seoThemeColor: props.seoThemeColor,
      seoKeywords: props.seoKeywords,
      handleInputChange: props.handleInputChange,
      updateCssColor: props.updateCssColor,
    }),
  },
  {
    id: 7,
    key: "reownConfiguration",
    title: "Reown Configuration",
    description:
      "Add your Reown Project ID to enable enhanced wallet connectivity functionality in your DEX. This is completely optional - your DEX will work without it.",
    isOptional: true,
    component: ReownConfigSection,
    getProps: props => ({
      walletConnectProjectId: props.walletConnectProjectId,
      handleInputChange: props.handleInputChange,
    }),
  },
  {
    id: 8,
    key: "privyConfiguration",
    title: "Privy Configuration",
    description:
      "Add your Privy credentials to enable social login, email authentication, and other wallet connection options in your DEX. This is completely optional. Only the App ID is required if you want to use Privy.",
    isOptional: true,
    component: PrivyConfigSection,
    getProps: props => ({
      privyAppId: props.privyAppId,
      privyTermsOfUse: props.privyTermsOfUse,
      handleInputChange: props.handleInputChange,
      urlValidator: props.urlValidator,
      enableAbstractWallet: props.enableAbstractWallet,
      onEnableAbstractWalletChange: props.onEnableAbstractWalletChange,
      disableEvmWallets: props.disableEvmWallets,
      disableSolanaWallets: props.disableSolanaWallets,
      onDisableEvmWalletsChange: props.onDisableEvmWalletsChange,
      onDisableSolanaWalletsChange: props.onDisableSolanaWalletsChange,
      privyLoginMethods: props.privyLoginMethods,
      onPrivyLoginMethodsChange: props.onPrivyLoginMethodsChange,
    }),
    getValidationTest: props =>
      props.privyTermsOfUse.trim()
        ? props.urlValidator(props.privyTermsOfUse.trim()) === null
        : true,
  },
  {
    id: 9,
    key: "blockchainConfiguration",
    title: "Blockchain Configuration",
    description:
      "Choose which blockchains your DEX will support for trading. This is optional - your DEX will support all available blockchains by default.",
    isOptional: true,
    component: BlockchainConfigSection,
    getProps: props => ({
      chainIds: props.chainIds,
      onChainIdsChange: props.onChainIdsChange,
      defaultChain: props.defaultChain,
      onDefaultChainChange: props.onDefaultChainChange,
      disableMainnet: props.disableMainnet,
      disableTestnet: props.disableTestnet,
      onDisableMainnetChange: props.onDisableMainnetChange,
      onDisableTestnetChange: props.onDisableTestnetChange,
    }),
  },
  {
    id: 10,
    key: "languageSupport",
    title: "Language Support",
    description:
      "Select the languages you want to support in your DEX interface. This is optional - your DEX will default to English only.",
    isOptional: true,
    component: LanguageSupportSection,
    getProps: props => ({
      availableLanguages: props.availableLanguages,
      onAvailableLanguagesChange: props.onAvailableLanguagesChange,
    }),
  },
  {
    id: 11,
    key: "navigationMenus",
    title: "Navigation Menus",
    description:
      "Customize which navigation links appear in your DEX. This is optional - your DEX will include all navigation menus by default.",
    isOptional: true,
    component: NavigationMenuSection,
    getProps: props => ({
      enabledMenus: props.enabledMenus,
      setEnabledMenus: props.setEnabledMenus,
      customMenus: props.customMenus,
      setCustomMenus: props.setCustomMenus,
      enableCampaigns: props.enableCampaigns,
      setEnableCampaigns: props.setEnableCampaigns,
    }),
  },
];

interface DexSectionRendererProps {
  mode: "accordion" | "direct";
  sections: DexSectionConfig[];
  allProps: DexSectionAllProps;
  currentStep?: number;
  completedSteps?: Record<number, boolean>;
  setCurrentStep?: (step: number) => void;
  handleNextStep?: (step: number) => void;
  allRequiredPreviousStepsCompleted?: (stepNumber: number) => boolean;
  showSectionHeaders?: boolean;
  idPrefix?: string;
  showProgressTracker?: boolean;
}

const DexSectionRenderer: React.FC<DexSectionRendererProps> = ({
  mode,
  sections,
  allProps,
  currentStep,
  completedSteps,
  setCurrentStep,
  handleNextStep,
  allRequiredPreviousStepsCompleted,
  showSectionHeaders = true,
  idPrefix = "",
  showProgressTracker = false,
}) => {
  const [currentSection, setCurrentSection] = useState(1);
  const sectionRefsRef = useRef<Record<number, HTMLElement | null>>({});

  useEffect(() => {
    if (mode !== "direct" || !showProgressTracker) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = parseInt(
              entry.target.getAttribute("data-section-id") || "0"
            );
            setCurrentSection(sectionId);
          }
        });
      },
      {
        rootMargin: "-30% 0px -30% 0px",
        threshold: 0.1,
      }
    );

    const timeoutId = setTimeout(() => {
      Object.values(sectionRefsRef.current).forEach(ref => {
        if (ref) {
          observer.observe(ref);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [mode, showProgressTracker, sections.length]);

  const handleSectionClick = (sectionId: number) => {
    setCurrentSection(sectionId);
  };
  const renderSection = (section: DexSectionConfig, index: number) => {
    const Component = section.component;
    const componentProps = {
      ...section.getProps(allProps),
      idPrefix: mode === "accordion" ? "" : idPrefix,
    };

    if (mode === "accordion") {
      if (
        !setCurrentStep ||
        !allRequiredPreviousStepsCompleted ||
        !completedSteps ||
        !handleNextStep
      ) {
        throw new Error(
          "Accordion mode requires setCurrentStep, allRequiredPreviousStepsCompleted, completedSteps, and handleNextStep props"
        );
      }

      const areAllPreviousStepsCompleted = (stepNumber: number) => {
        if (stepNumber === 1) return true;
        for (let i = 1; i < stepNumber; i++) {
          if (!completedSteps[i]) {
            return false;
          }
        }
        return true;
      };

      if (!areAllPreviousStepsCompleted(section.id)) {
        return null;
      }

      return (
        <AccordionItem
          key={section.key}
          title={section.title}
          stepNumber={section.id}
          isOptional={section.isOptional}
          onNextInternal={() => handleNextStep(section.id)}
          isStepContentValidTest={
            section.getValidationTest
              ? section.getValidationTest(allProps)
              : true
          }
          isActive={currentStep === section.id}
          isCompleted={!!completedSteps[section.id]}
          canOpen={
            allRequiredPreviousStepsCompleted(section.id) ||
            !!completedSteps[section.id]
          }
          setCurrentStep={setCurrentStep}
          allRequiredPreviousStepsCompleted={allRequiredPreviousStepsCompleted}
        >
          <p className="text-xs text-gray-400 mb-4">{section.description}</p>
          <Component {...componentProps} />
        </AccordionItem>
      );
    } else {
      return (
        <div
          key={section.key}
          ref={el => {
            if (el) {
              sectionRefsRef.current[section.id] = el;
            }
          }}
          data-section-id={section.id}
          className={index > 0 ? "mt-6 pt-4 border-t border-light/10" : ""}
        >
          {showSectionHeaders && (
            <>
              <h3 className="text-lg font-bold mb-3">
                {section.title}{" "}
                {section.isOptional && (
                  <span className="text-gray-400 text-sm font-normal">
                    (optional)
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                {section.description}
              </p>
            </>
          )}
          <Component {...componentProps} />
        </div>
      );
    }
  };

  if (mode === "direct" && showProgressTracker) {
    return (
      <div className="flex gap-6">
        <ProgressTracker
          sections={sections}
          currentSection={currentSection}
          onSectionClick={handleSectionClick}
        />
        <div className="flex-1 min-w-0">
          {sections.map((section, index) => renderSection(section, index))}
        </div>
      </div>
    );
  }

  return <>{sections.map((section, index) => renderSection(section, index))}</>;
};

export default DexSectionRenderer;
