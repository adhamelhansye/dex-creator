import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "./Button";
import { post } from "../utils/apiClient";
import { useModal } from "../context/ModalContext";

interface DexData {
  id: string;
  brokerName: string;
  brokerId: string;
  themeCSS?: string | null;
  primaryLogo?: string | null;
  secondaryLogo?: string | null;
  favicon?: string | null;
  pnlPosters?: string[] | null;
  telegramLink?: string | null;
  discordLink?: string | null;
  xLink?: string | null;
  walletConnectProjectId?: string | null;
  privyAppId?: string | null;
  privyTermsOfUse?: string | null;
  enabledMenus?: string | null;
  customMenus?: string | null;
  enableAbstractWallet?: boolean;
  chainIds?: number[] | null;
  repoUrl?: string | null;
  customDomain?: string | null;
  disableMainnet?: boolean;
  disableTestnet?: boolean;
  disableEvmWallets?: boolean;
  disableSolanaWallets?: boolean;
  tradingViewColorConfig?: string | null;
  availableLanguages?: string[] | null;
  seoSiteName?: string | null;
  seoSiteDescription?: string | null;
  seoSiteLanguage?: string | null;
  seoSiteLocale?: string | null;
  seoTwitterHandle?: string | null;
  seoThemeColor?: string | null;
  seoKeywords?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CustomDomainSectionProps {
  dexData: DexData;
  token: string | null;
  isSaving: boolean;
  onDexDataUpdate: (updatedData: DexData) => void;
  onSavingChange: (saving: boolean) => void;
  onShowDomainRemoveConfirm: () => void;
}

export default function CustomDomainSection({
  dexData,
  token,
  isSaving,
  onDexDataUpdate,
  onSavingChange,
  onShowDomainRemoveConfirm,
}: CustomDomainSectionProps) {
  const [customDomain, setCustomDomain] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { openModal } = useModal();

  const handleSetDomain = async () => {
    const normalizedDomain = customDomain.trim().toLowerCase();

    const domainRegex =
      /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/;

    if (!normalizedDomain) {
      toast.error("Domain name cannot be empty");
      return;
    }

    if (normalizedDomain !== customDomain) {
      toast.error("Domain must be lowercase with no leading/trailing spaces");
      return;
    }

    if (!domainRegex.test(normalizedDomain)) {
      toast.error("Please enter a valid domain name (e.g., example.com)");
      return;
    }

    if (
      normalizedDomain.includes("..") ||
      normalizedDomain.startsWith(".") ||
      normalizedDomain.endsWith(".")
    ) {
      toast.error(
        "Domain cannot have consecutive dots or start/end with a dot"
      );
      return;
    }

    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipRegex.test(normalizedDomain)) {
      toast.error("IP addresses are not allowed. Please use a domain name");
      return;
    }

    onSavingChange(true);

    try {
      await post(
        `api/dex/${dexData.id}/custom-domain`,
        { domain: normalizedDomain },
        token
      );

      onDexDataUpdate({
        ...dexData,
        customDomain: normalizedDomain,
      });

      toast.success(
        isEditing
          ? "Custom domain updated successfully"
          : "Custom domain configured successfully"
      );
      setIsEditing(false);
      setCustomDomain("");
    } catch (error) {
      console.error("Error setting custom domain:", error);
      toast.error(
        isEditing
          ? "Failed to update custom domain"
          : "Failed to set custom domain"
      );
    } finally {
      onSavingChange(false);
    }
  };

  const handleEditDomain = () => {
    setCustomDomain(dexData.customDomain || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCustomDomain("");
  };

  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text);
    toast.success(successMessage);
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Custom Domain Setup</h3>
      <p className="text-sm text-gray-300 mb-4">
        Deploy your DEX to your own domain instead of using the default GitHub
        Pages URL. You'll need to configure your domain's DNS settings to point
        to GitHub Pages.
      </p>

      {!dexData.customDomain && (
        <div className="mb-4 p-3 bg-warning/10 rounded-lg border border-warning/30">
          <h5 className="text-sm font-bold mb-2 flex items-center">
            <div className="i-mdi:alert-circle h-4 w-4 mr-2 text-warning"></div>
            Limited Mobile Functionality
          </h5>
          <p className="text-xs text-gray-300 mb-2">
            Your DEX is currently using the default deployment domain. This
            means a special mobile feature that allows users to connect to their
            mobile device without requiring a mobile wallet will not work.
          </p>
          <p className="text-xs text-gray-300">
            Configure a custom domain below to enable this mobile connection
            feature for your users.
          </p>
        </div>
      )}

      <div className="mb-4 p-3 bg-red-900/30 rounded-lg border border-red-500/30">
        <h5 className="text-sm font-bold mb-2 flex items-center">
          <div className="i-mdi:alert h-4 w-4 mr-2 text-red-400"></div>
          Important License Requirement
        </h5>
        <p className="text-xs text-gray-300 mb-3">
          When using your own custom domain, you are required to apply for your
          own
          <strong> TradingView Advanced Charts license</strong>. The default
          license only covers the default domain.
        </p>
        <div className="flex flex-col gap-2">
          <a
            href="https://www.tradingview.com/advanced-charts/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-light hover:underline flex items-center"
          >
            Apply for TradingView Advanced Charts license
            <div className="i-mdi:open-in-new h-3.5 w-3.5 ml-1"></div>
          </a>
          <button
            onClick={() => openModal("tradingViewLicense")}
            className="text-xs text-secondary-light hover:underline flex items-center"
          >
            Need help? Read our guide
            <div className="i-mdi:help-circle-outline h-3.5 w-3.5 ml-1"></div>
          </button>
        </div>
      </div>

      {dexData.customDomain ? (
        <div className="mb-4">
          {!isEditing ? (
            <>
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center mb-4">
                <div className="bg-success/10 text-success px-3 py-1 rounded-full text-sm flex items-center">
                  <div className="i-mdi:check-circle h-4 w-4 mr-1"></div>
                  Domain Configured
                </div>
                <div className="text-sm">
                  Your DEX is available at{" "}
                  <a
                    href={`https://${dexData.customDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-light hover:underline inline-flex items-center"
                  >
                    {dexData.customDomain}
                    <div className="i-mdi:open-in-new h-3.5 w-3.5 ml-1"></div>
                  </a>
                </div>
              </div>

              <div className="bg-info/10 rounded-lg border border-info/20 p-4 mb-4">
                <h5 className="text-sm font-bold mb-2 flex items-center">
                  <div className="i-mdi:information-outline text-info mr-2 h-4 w-4"></div>
                  DNS Configuration Status
                </h5>
                <p className="text-sm text-gray-300 mb-3">
                  It may take up to 24 hours for DNS changes to propagate. If
                  your domain is not working yet, please check back later.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleEditDomain}
                    variant="secondary"
                    size="sm"
                    disabled={isSaving}
                  >
                    <span className="flex items-center gap-1">
                      <div className="i-mdi:pencil h-4 w-4"></div>
                      Edit Domain
                    </span>
                  </Button>
                  <Button
                    onClick={onShowDomainRemoveConfirm}
                    variant="danger"
                    size="sm"
                    isLoading={isSaving}
                    loadingText="Removing..."
                    disabled={isSaving}
                  >
                    <span className="flex items-center gap-1">
                      <div className="i-mdi:delete h-4 w-4"></div>
                      Remove Custom Domain
                    </span>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="mb-4">
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center mb-4">
                <div className="bg-warning/10 text-warning px-3 py-1 rounded-full text-sm flex items-center">
                  <div className="i-mdi:pencil h-4 w-4 mr-1"></div>
                  Editing Domain
                </div>
                <div className="text-sm text-gray-300">
                  Current domain: {dexData.customDomain}
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="editCustomDomain"
                  className="block text-sm font-bold mb-1"
                >
                  Domain Name
                </label>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                  <input
                    id="editCustomDomain"
                    type="text"
                    value={customDomain}
                    onChange={e => setCustomDomain(e.target.value)}
                    placeholder="example.com"
                    className="flex-1 bg-background-dark/80 border border-light/10 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary-light focus:border-primary-light"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSetDomain}
                      variant="primary"
                      size="sm"
                      isLoading={isSaving}
                      loadingText="Saving..."
                      disabled={!customDomain || isSaving}
                    >
                      <span className="flex items-center gap-1">
                        <div className="i-mdi:check h-4 w-4"></div>
                        Update
                      </span>
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="secondary"
                      size="sm"
                      disabled={isSaving}
                    >
                      <span className="flex items-center gap-1">
                        <div className="i-mdi:close h-4 w-4"></div>
                        Cancel
                      </span>
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Enter your domain without 'http://' or 'https://' (e.g.,
                  example.com)
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4">
          <div className="mb-4">
            <label
              htmlFor="customDomain"
              className="block text-sm font-bold mb-1"
            >
              Domain Name
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <input
                id="customDomain"
                type="text"
                value={customDomain}
                onChange={e => setCustomDomain(e.target.value)}
                placeholder="example.com"
                className="flex-1 bg-background-dark/80 border border-light/10 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary-light focus:border-primary-light"
              />
              <Button
                onClick={handleSetDomain}
                variant="primary"
                size="sm"
                isLoading={isSaving}
                loadingText="Saving..."
                disabled={!customDomain || isSaving}
                className="w-full sm:w-auto"
              >
                <span className="flex items-center gap-1 justify-center sm:justify-start">
                  <div className="i-mdi:link h-4 w-4"></div>
                  Set Domain
                </span>
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Enter your domain without 'http://' or 'https://' (e.g.,
              example.com)
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 p-4 bg-primary-light/5 rounded-lg border border-primary-light/20">
        <h5 className="text-sm font-bold mb-2 flex items-center">
          <div className="i-mdi:shopping-cart h-4 w-4 mr-2 text-primary-light"></div>
          Need to Purchase a Domain?
        </h5>
        <p className="text-sm text-gray-300 mb-3">
          Don't have a domain yet? We've created step-by-step guides to help you
          purchase and configure your domain with popular providers.
        </p>
        <Button
          onClick={() =>
            openModal("domainSetupGuide", {
              customDomain: dexData.customDomain,
            })
          }
          variant="primary"
          size="sm"
        >
          <span className="flex items-center gap-1">
            <div className="i-mdi:book-open-variant h-4 w-4"></div>
            Show Step-by-Step Guide
          </span>
        </Button>
      </div>

      <div className="rounded-lg border border-light/10 p-4 bg-base-8/50">
        <h5 className="text-sm font-bold mb-3 flex items-center">
          <div className="i-mdi:dns h-4 w-4 mr-2 text-primary-light"></div>
          DNS Configuration Instructions
        </h5>
        <p className="text-sm text-gray-300 mb-3">
          To use a custom domain, you'll need to configure your domain's DNS
          settings:
        </p>

        {/* Check if it's an apex domain or subdomain */}
        {dexData.customDomain &&
        dexData.customDomain.split(".").length === 2 ? (
          // Apex domain - show A records and www CNAME
          <div className="space-y-3">
            <div className="bg-base-9/70 rounded p-3 font-mono text-xs overflow-x-auto">
              <div className="mb-2 text-gray-400">
                <span className="text-primary-light">Step 1:</span> Add{" "}
                <span className="text-primary-light">A records</span> for your
                apex domain:
              </div>
              <div className="space-y-1">
                <div className="flex items-center">
                  <span className="text-gray-400">Type:</span>{" "}
                  <div className="flex items-center">
                    <span className="text-white">A</span>
                    <button
                      className="ml-1.5 text-gray-400 hover:text-primary-light transition-colors"
                      onClick={() =>
                        copyToClipboard("A", "Copied to clipboard")
                      }
                      aria-label="Copy record type to clipboard"
                    >
                      <div className="i-mdi:content-copy h-3.5 w-3.5"></div>
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400">Name:</span>{" "}
                  <div className="flex items-center">
                    <span className="text-white">@</span>
                    <button
                      className="ml-1.5 text-gray-400 hover:text-primary-light transition-colors"
                      onClick={() =>
                        copyToClipboard("@", "Copied to clipboard")
                      }
                      aria-label="Copy @ symbol to clipboard"
                    >
                      <div className="i-mdi:content-copy h-3.5 w-3.5"></div>
                    </button>
                  </div>
                </div>
                <div className="text-gray-400">
                  Values (create 4 separate A records):
                </div>
                {[
                  "185.199.108.153",
                  "185.199.109.153",
                  "185.199.110.153",
                  "185.199.111.153",
                ].map(ip => (
                  <div key={ip} className="flex items-center ml-2">
                    <span className="text-white">{ip}</span>
                    <button
                      className="ml-1.5 text-gray-400 hover:text-primary-light transition-colors"
                      onClick={() => copyToClipboard(ip, "Copied to clipboard")}
                      aria-label={`Copy IP address ${ip} to clipboard`}
                    >
                      <div className="i-mdi:content-copy h-3.5 w-3.5"></div>
                    </button>
                  </div>
                ))}
                <div className="flex items-center">
                  <span className="text-gray-400">TTL:</span>{" "}
                  <div className="flex items-center">
                    <span className="text-white">3600</span>
                    <button
                      className="ml-1.5 text-gray-400 hover:text-primary-light transition-colors"
                      onClick={() =>
                        copyToClipboard("3600", "Copied to clipboard")
                      }
                      aria-label="Copy TTL value to clipboard"
                    >
                      <div className="i-mdi:content-copy h-3.5 w-3.5"></div>
                    </button>{" "}
                    (or automatic)
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-base-9/70 rounded p-3 font-mono text-xs overflow-x-auto">
              <div className="mb-2 text-gray-400">
                <span className="text-primary-light">Step 2:</span> Add a{" "}
                <span className="text-primary-light">CNAME record</span> for www
                subdomain{" "}
                <span className="text-warning">
                  (required for SSL certificate)
                </span>
                :
              </div>
              <div className="space-y-1">
                <div className="flex items-center">
                  <span className="text-gray-400">Type:</span>{" "}
                  <div className="flex items-center">
                    <span className="text-white">CNAME</span>
                    <button
                      className="ml-1.5 text-gray-400 hover:text-primary-light transition-colors"
                      onClick={() =>
                        copyToClipboard("CNAME", "Copied to clipboard")
                      }
                      aria-label="Copy record type to clipboard"
                    >
                      <div className="i-mdi:content-copy h-3.5 w-3.5"></div>
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400">Name:</span>{" "}
                  <div className="flex items-center">
                    <span className="text-white">www</span>
                    <button
                      className="ml-1.5 text-gray-400 hover:text-primary-light transition-colors"
                      onClick={() =>
                        copyToClipboard("www", "Copied to clipboard")
                      }
                      aria-label="Copy www to clipboard"
                    >
                      <div className="i-mdi:content-copy h-3.5 w-3.5"></div>
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400">Value:</span>{" "}
                  <div className="flex items-center">
                    <span className="text-white">
                      orderlynetworkdexcreator.github.io
                    </span>
                    <button
                      className="ml-1.5 text-gray-400 hover:text-primary-light transition-colors"
                      onClick={() =>
                        copyToClipboard(
                          "orderlynetworkdexcreator.github.io",
                          "Copied to clipboard"
                        )
                      }
                      aria-label="Copy domain value to clipboard"
                    >
                      <div className="i-mdi:content-copy h-3.5 w-3.5"></div>
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400">TTL:</span>{" "}
                  <div className="flex items-center">
                    <span className="text-white">3600</span>
                    <button
                      className="ml-1.5 text-gray-400 hover:text-primary-light transition-colors"
                      onClick={() =>
                        copyToClipboard("3600", "Copied to clipboard")
                      }
                      aria-label="Copy TTL value to clipboard"
                    >
                      <div className="i-mdi:content-copy h-3.5 w-3.5"></div>
                    </button>{" "}
                    (or automatic)
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : dexData.customDomain &&
          dexData.customDomain.split(".").length > 2 ? (
          // Subdomain - show CNAME record
          <div className="bg-base-9/70 rounded p-3 font-mono text-xs overflow-x-auto mb-3">
            <div className="mb-1 text-gray-400">
              Add a <span className="text-primary-light">CNAME record</span>{" "}
              with the following values:
            </div>
            <div className="flex items-center">
              <span className="text-gray-400">Name:</span>{" "}
              <div className="flex items-center">
                <span className="text-white">
                  {dexData.customDomain.split(".")[0]}
                </span>
                <button
                  className="ml-1.5 text-gray-400 hover:text-primary-light transition-colors"
                  onClick={() =>
                    copyToClipboard(
                      dexData.customDomain?.split(".")[0] || "",
                      "Copied to clipboard"
                    )
                  }
                  aria-label="Copy subdomain name to clipboard"
                >
                  <div className="i-mdi:content-copy h-3.5 w-3.5"></div>
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400">Value:</span>{" "}
              <div className="flex items-center">
                <span className="text-white">
                  orderlynetworkdexcreator.github.io
                </span>
                <button
                  className="ml-1.5 text-gray-400 hover:text-primary-light transition-colors"
                  onClick={() =>
                    copyToClipboard(
                      "orderlynetworkdexcreator.github.io",
                      "Copied to clipboard"
                    )
                  }
                  aria-label="Copy domain value to clipboard"
                >
                  <div className="i-mdi:content-copy h-3.5 w-3.5"></div>
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400">TTL:</span>{" "}
              <div className="flex items-center">
                <span className="text-white">3600</span>
                <button
                  className="ml-1.5 text-gray-400 hover:text-primary-light transition-colors"
                  onClick={() => copyToClipboard("3600", "Copied to clipboard")}
                  aria-label="Copy TTL value to clipboard"
                >
                  <div className="i-mdi:content-copy h-3.5 w-3.5"></div>
                </button>{" "}
                (or automatic)
              </div>
            </div>
          </div>
        ) : (
          // No domain configured yet - show generic instructions
          <div className="bg-base-9/70 rounded p-3 font-mono text-xs overflow-x-auto mb-3">
            <div className="mb-2 text-gray-400">
              DNS configuration depends on your domain type:
            </div>
            <div className="mb-3">
              <div className="text-primary-light mb-1">
                For apex domains (example.com):
              </div>
              <div className="ml-2 space-y-1">
                <div className="mb-2">
                  <div className="text-warning text-xs mb-1">
                    Step 1: A Records
                  </div>
                  <div>
                    Type: <span className="text-white">A</span>
                  </div>
                  <div>
                    Name: <span className="text-white">@</span>
                  </div>
                  <div>
                    Values:{" "}
                    <span className="text-white">
                      185.199.108.153, 185.199.109.153, 185.199.110.153,
                      185.199.111.153
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-warning text-xs mb-1">
                    Step 2: www CNAME (required for SSL)
                  </div>
                  <div>
                    Type: <span className="text-white">CNAME</span>
                  </div>
                  <div>
                    Name: <span className="text-white">www</span>
                  </div>
                  <div>
                    Value:{" "}
                    <span className="text-white">
                      orderlynetworkdexcreator.github.io
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-primary-light mb-1">
                For subdomains (dex.example.com):
              </div>
              <div className="ml-2 space-y-1">
                <div>
                  Type: <span className="text-white">CNAME</span>
                </div>
                <div>
                  Name: <span className="text-white">dex</span> (your subdomain)
                </div>
                <div>
                  Value:{" "}
                  <span className="text-white">
                    orderlynetworkdexcreator.github.io
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deployment info card */}
        <div className="mb-3 p-3 bg-info/10 rounded-lg border border-info/20">
          <h6 className="text-xs font-medium mb-2 flex items-center">
            <div className="i-mdi:information-outline h-3.5 w-3.5 mr-1.5 text-info"></div>
            Important: About Domain Updates
          </h6>
          <p className="text-xs text-gray-300">
            After adding or removing a custom domain, a deployment process must
            complete for the changes to take effect. Your domain will not work
            correctly until this process finishes (usually 2-5 minutes).
          </p>
          <p className="text-xs text-gray-300 mt-1">
            You can monitor the deployment status in the "Updates & Deployment
            Status" section below.
          </p>
        </div>

        <div className="text-xs text-gray-400">
          {dexData.customDomain &&
          dexData.customDomain.split(".").length === 2 ? (
            <div className="flex items-start gap-1 mb-1">
              <div className="i-mdi:information-outline h-3.5 w-3.5 mt-0.5 flex-shrink-0"></div>
              <span>
                You've configured an apex domain ({dexData.customDomain}). You
                must create 4 separate A records with the IP addresses shown
                above.
              </span>
            </div>
          ) : dexData.customDomain &&
            dexData.customDomain.split(".").length > 2 ? (
            <div className="flex items-start gap-1 mb-1">
              <div className="i-mdi:information-outline h-3.5 w-3.5 mt-0.5 flex-shrink-0"></div>
              <span>
                You've configured a subdomain (
                {dexData.customDomain.split(".")[0]}.
                {dexData.customDomain.split(".").slice(1).join(".")}). Use the
                exact subdomain name shown above in the Name field.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-1 mb-1">
              <div className="i-mdi:information-outline h-3.5 w-3.5 mt-0.5 flex-shrink-0"></div>
              <span>
                Choose between an apex domain (example.com) using A records or a
                subdomain (dex.example.com) using a CNAME record.
              </span>
            </div>
          )}
          <div className="flex items-start gap-1">
            <div className="i-mdi:clock-outline h-3.5 w-3.5 mt-0.5 flex-shrink-0"></div>
            <span>
              DNS changes can take up to 24 hours to propagate globally, though
              they often complete within a few hours.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
