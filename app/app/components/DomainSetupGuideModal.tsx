import { useState } from "react";
import { Button } from "./Button";

interface DomainSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  customDomain?: string | null;
}

type Provider = "cloudflare" | "namecheap";
type Step = {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
  link?: string;
  linkText?: string;
};

const cloudflareSteps: Step[] = [
  {
    id: 1,
    title: "Create CloudFlare Account",
    description:
      "Visit the CloudFlare signup page to create a new account. Use your email address and create a strong password.",
    imageUrl: "/cloudflare-signup.webp",
    imageAlt: "CloudFlare sign up page",
    link: "https://dash.cloudflare.com/sign-up",
    linkText: "CloudFlare Sign Up",
  },
  {
    id: 2,
    title: "Search and Select Domain",
    description:
      "Visit the CloudFlare registrar to search for your desired domain name. Choose your domain and TLD, review pricing, and select registration period.",
    imageUrl: "/cloudflare-registrar.webp",
    imageAlt: "Domain search and selection",
    link: "https://domains.cloudflare.com/",
    linkText: "CloudFlare Domain Registration",
  },
  {
    id: 3,
    title: "Complete Registration and Payment",
    description:
      "Fill in your contact information, complete the registration form, and proceed to payment. CloudFlare accepts major credit cards and PayPal.",
    imageUrl: "/cloudflare-registration.webp",
    imageAlt: "Domain registration and payment",
  },
  {
    id: 4,
    title: "Access DNS Management",
    description:
      "After purchase, your domain will appear in your CloudFlare dashboard. Click on your domain, then select 'DNS' > 'Records' in the sidebar to access DNS management.",
    imageUrl: "/cloudflare-domain.webp",
    imageAlt: "CloudFlare DNS management navigation",
    link: "https://dash.cloudflare.com",
    linkText: "CloudFlare Dashboard",
  },
  {
    id: 5,
    title: "Configure DNS Records",
    description:
      "In the DNS tab, add the required A records and CNAME record. Most importantly, ensure the 'Proxy status' (orange cloud icon) is enabled for all records. This provides instant SSL/TLS encryption and better performance than waiting for GitHub Pages certificates.",
    imageUrl: "/cloudflare-dns.webp",
    imageAlt: "DNS configuration interface in CloudFlare",
    link: "https://dash.cloudflare.com",
    linkText: "CloudFlare DNS Management",
  },
];

const namecheapSteps: Step[] = [
  {
    id: 1,
    title: "Create Namecheap Account",
    description:
      "Visit the Namecheap signup page to create a new account. You can also sign up using your Google or Facebook account for faster registration.",
    imageUrl: "/namecheap-signup.webp",
    imageAlt: "Namecheap sign up page",
    link: "https://www.namecheap.com/myaccount/signup",
    linkText: "Namecheap Sign Up",
  },
  {
    id: 2,
    title: "Search and Select Domain",
    description:
      "Use the domain search bar to find your desired domain name. Choose your domain and TLD, review pricing, and add to cart.",
    imageUrl: "/namecheap-registrar.webp",
    imageAlt: "Namecheap domain search and selection",
    link: "https://namecheap.com",
    linkText: "Namecheap Homepage",
  },
  {
    id: 3,
    title: "Configure Settings and Complete Purchase",
    description:
      "Configure additional services like WHOIS privacy protection, auto-renewal, and domain locking. Fill in your contact information, complete the registration form, and proceed to payment.",
    imageUrl: "/namecheap-registration.webp",
    imageAlt: "Domain configuration and payment",
  },
  {
    id: 4,
    title: "Access Domain Management",
    description:
      "Log into your Namecheap account and go to 'Domain List'. Click 'Manage' next to your domain to access DNS settings, contact information, and other domain management options.",
    imageUrl: "/namecheap-domain.webp",
    imageAlt: "Namecheap domain management dashboard",
    link: "https://ap.www.namecheap.com/domains/",
    linkText: "Namecheap Domain Management",
  },
  {
    id: 5,
    title: "Configure DNS Records",
    description:
      "In the 'Advanced DNS' tab, first remove the default DNS setup (one redirect and a CNAME www record). Then add the required A records and CNAME record for your DEX.",
    imageUrl: "/namecheap-dns.webp",
    imageAlt: "Namecheap DNS management interface",
    link: "https://ap.www.namecheap.com/domains/",
    linkText: "Namecheap DNS Management",
  },
];

export default function DomainSetupGuideModal({
  isOpen,
  onClose,
  customDomain,
}: DomainSetupGuideModalProps) {
  const [selectedProvider, setSelectedProvider] =
    useState<Provider>("cloudflare");
  const [currentStep, setCurrentStep] = useState(1);
  const [showSidebar, setShowSidebar] = useState(false);

  if (!isOpen) return null;

  const steps =
    selectedProvider === "cloudflare" ? cloudflareSteps : namecheapSteps;
  const currentStepData = steps.find(step => step.id === currentStep);
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProviderChange = (provider: Provider) => {
    setSelectedProvider(provider);
    setCurrentStep(1);
    setShowSidebar(false);
  };

  const handleClose = () => {
    setCurrentStep(1);
    setSelectedProvider("cloudflare");
    setShowSidebar(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-0 sm:p-4">
      <div className="bg-background-dark rounded-none sm:rounded-lg border-0 sm:border border-light/10 w-full h-full sm:w-full sm:max-w-4xl lg:max-w-6xl xl:max-w-7xl sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-light/10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold">
              Domain Purchase & Setup Guide
            </h2>
            <p className="text-sm text-gray-300 mt-1 hidden sm:block">
              Step-by-step instructions for purchasing and configuring your
              custom domain
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2"
          >
            <div className="i-mdi:close h-6 w-6"></div>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 relative">
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-light/10">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <div className="i-mdi:menu h-4 w-4"></div>
              {selectedProvider === "cloudflare" ? "CloudFlare" : "Namecheap"} -
              Step {currentStep} of {steps.length}
            </button>
          </div>

          <div
            className={`lg:w-80 border-r border-light/10 p-4 lg:p-6 overflow-y-auto ${
              showSidebar
                ? "absolute inset-0 z-20 bg-background-dark lg:relative lg:inset-auto lg:z-auto lg:block"
                : "hidden lg:block"
            }`}
          >
            <h3 className="text-lg font-bold mb-4">Choose Your Provider</h3>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleProviderChange("cloudflare")}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  selectedProvider === "cloudflare"
                    ? "border-primary-light bg-primary-light/10 text-primary-light"
                    : "border-light/20 hover:border-light/40"
                }`}
              >
                <div className="font-bold mb-1">CloudFlare</div>
                <div className="text-sm text-gray-300">
                  Integrated DNS management, competitive pricing, fast setup
                </div>
              </button>
              <button
                onClick={() => handleProviderChange("namecheap")}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  selectedProvider === "namecheap"
                    ? "border-primary-light bg-primary-light/10 text-primary-light"
                    : "border-light/20 hover:border-light/40"
                }`}
              >
                <div className="font-bold mb-1">Namecheap</div>
                <div className="text-sm text-gray-300">
                  Affordable domains, excellent support, user-friendly interface
                </div>
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold mb-2">
                Steps ({currentStep}/{steps.length})
              </h4>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {steps.map(step => (
                  <button
                    key={step.id}
                    onClick={() => {
                      setCurrentStep(step.id);
                      setShowSidebar(false);
                    }}
                    className={`w-full text-left p-1.5 rounded text-xs transition-colors ${
                      currentStep === step.id
                        ? "bg-primary-light/20 text-primary-light"
                        : "hover:bg-light/5"
                    }`}
                  >
                    <div className="font-medium leading-tight">
                      {step.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 p-4 lg:p-6 overflow-y-auto min-h-0">
              {currentStepData && (
                <div>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-primary-light/20 text-primary-light px-2 py-1 rounded text-sm font-bold">
                        Step {currentStepData.id}
                      </span>
                      <span className="text-sm text-gray-400">
                        {selectedProvider === "cloudflare"
                          ? "CloudFlare"
                          : "Namecheap"}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {currentStepData.title}
                    </h3>
                  </div>

                  <div className="mb-6">
                    {currentStepData.imageUrl ? (
                      <div className="bg-base-8/50 border border-light/10 rounded-lg overflow-hidden">
                        <img
                          src={currentStepData.imageUrl}
                          alt={currentStepData.imageAlt || "Step illustration"}
                          className="w-full h-auto object-contain max-h-96"
                        />
                      </div>
                    ) : (
                      <div className="bg-base-8/50 border border-light/10 rounded-lg p-8 text-center">
                        <div className="i-mdi:image-outline h-16 w-16 mx-auto text-gray-400 mb-4"></div>
                        <div className="text-sm text-gray-400 mb-2">
                          {currentStepData.imageAlt || "Step illustration"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Image will be added here (16:9 aspect ratio)
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed">
                      {currentStepData.description}
                    </p>
                  </div>

                  {currentStepData.link && (
                    <div className="mt-4">
                      <a
                        href={currentStepData.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary-light hover:text-primary-light/80 transition-colors font-medium"
                      >
                        <span>{currentStepData.linkText}</span>
                        <div className="i-mdi:open-in-new h-4 w-4"></div>
                      </a>
                    </div>
                  )}

                  {(currentStepData.title.includes("Configure DNS Records") ||
                    currentStepData.title.includes("DNS")) && (
                    <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/20">
                      <h4 className="text-sm font-bold mb-3 flex items-center">
                        <div className="i-mdi:dns h-4 w-4 mr-2 text-success"></div>
                        {customDomain
                          ? `Required DNS Records for ${customDomain}`
                          : "Required DNS Records"}
                      </h4>

                      {customDomain ? (
                        customDomain.split(".").length === 2 ? (
                          <div className="space-y-4">
                            <div>
                              <h5 className="text-xs font-bold mb-2 text-success">
                                A Records (4 required):
                              </h5>
                              <div className="bg-base-9/70 rounded p-3 font-mono text-xs">
                                <div className="space-y-1">
                                  <div>
                                    Type: A | Name: @ | Value: 185.199.108.153
                                  </div>
                                  <div>
                                    Type: A | Name: @ | Value: 185.199.109.153
                                  </div>
                                  <div>
                                    Type: A | Name: @ | Value: 185.199.110.153
                                  </div>
                                  <div>
                                    Type: A | Name: @ | Value: 185.199.111.153
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h5 className="text-xs font-bold mb-2 text-success">
                                CNAME Record (required for SSL):
                              </h5>
                              <div className="bg-base-9/70 rounded p-3 font-mono text-xs">
                                <div>
                                  Type: CNAME | Name: www | Value:
                                  orderlynetworkdexcreator.github.io
                                </div>
                              </div>
                            </div>

                            {selectedProvider === "cloudflare" && (
                              <div className="mt-4 p-3 bg-primary-light/10 rounded-lg border border-primary-light/20">
                                <h6 className="text-xs font-bold mb-2 flex items-center">
                                  <div className="i-mdi:shield-check h-3.5 w-3.5 mr-1.5 text-primary-light"></div>
                                  CloudFlare Proxy Setup (Important!)
                                </h6>
                                <div className="text-xs text-gray-300 space-y-1">
                                  <div>
                                    • Enable the orange cloud icon (Proxy
                                    status) for ALL records
                                  </div>
                                  <div>
                                    • This provides instant SSL/TLS encryption
                                  </div>
                                  <div>
                                    • Much faster than waiting for GitHub Pages
                                    certificates
                                  </div>
                                  <div>• Better performance and security</div>
                                </div>
                              </div>
                            )}

                            <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
                              <h6 className="text-xs font-bold mb-2 flex items-center">
                                <div className="i-mdi:security h-3.5 w-3.5 mr-1.5 text-warning"></div>
                                Recommended: Email Security Records
                              </h6>
                              <p className="text-xs text-gray-300 mb-3">
                                Add these TXT records to protect your domain
                                from email spoofing attacks. Without these,
                                attackers could send phishing emails appearing
                                to come from your domain, which may cause your
                                site to be flagged by Google Safe Browsing.
                              </p>
                              <div className="space-y-3">
                                <div>
                                  <div className="text-xs font-semibold mb-1 text-warning">
                                    SPF Record:
                                  </div>
                                  <div className="bg-base-9/70 rounded p-2 font-mono text-xs">
                                    <div>
                                      Type: TXT | Name: @ | Value: v=spf1 -all
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-semibold mb-1 text-warning">
                                    DMARC Record:
                                  </div>
                                  <div className="bg-base-9/70 rounded p-2 font-mono text-xs">
                                    <div>
                                      Type: TXT | Name: _dmarc | Value:
                                      v=DMARC1; p=reject; sp=reject; aspf=s;
                                      adkim=s
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                These records tell email servers that your
                                domain doesn't send emails and to reject any
                                emails claiming to be from your domain.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <h5 className="text-xs font-bold mb-2 text-success">
                                CNAME Record:
                              </h5>
                              <div className="bg-base-9/70 rounded p-3 font-mono text-xs">
                                <div>
                                  Type: CNAME | Name:{" "}
                                  {customDomain.split(".")[0]} | Value:
                                  orderlynetworkdexcreator.github.io
                                </div>
                              </div>
                            </div>

                            {selectedProvider === "cloudflare" && (
                              <div className="p-3 bg-primary-light/10 rounded-lg border border-primary-light/20">
                                <h6 className="text-xs font-bold mb-2 flex items-center">
                                  <div className="i-mdi:shield-check h-3.5 w-3.5 mr-1.5 text-primary-light"></div>
                                  CloudFlare Proxy Setup (Important!)
                                </h6>
                                <div className="text-xs text-gray-300 space-y-1">
                                  <div>
                                    • Enable the orange cloud icon (Proxy
                                    status) for the CNAME record
                                  </div>
                                  <div>
                                    • This provides instant SSL/TLS encryption
                                  </div>
                                  <div>
                                    • Much faster than waiting for GitHub Pages
                                    certificates
                                  </div>
                                  <div>• Better performance and security</div>
                                </div>
                              </div>
                            )}

                            <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
                              <h6 className="text-xs font-bold mb-2 flex items-center">
                                <div className="i-mdi:security h-3.5 w-3.5 mr-1.5 text-warning"></div>
                                Recommended: Email Security Records
                              </h6>
                              <p className="text-xs text-gray-300 mb-3">
                                Add these TXT records to your root domain to
                                protect it from email spoofing attacks. Without
                                these, attackers could send phishing emails
                                appearing to come from your domain, which may
                                cause your site to be flagged by Google Safe
                                Browsing.
                              </p>
                              <div className="space-y-3">
                                <div>
                                  <div className="text-xs font-semibold mb-1 text-warning">
                                    SPF Record:
                                  </div>
                                  <div className="bg-base-9/70 rounded p-2 font-mono text-xs">
                                    <div>
                                      Type: TXT | Name: @ | Value: v=spf1 -all
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-semibold mb-1 text-warning">
                                    DMARC Record:
                                  </div>
                                  <div className="bg-base-9/70 rounded p-2 font-mono text-xs">
                                    <div>
                                      Type: TXT | Name: _dmarc | Value:
                                      v=DMARC1; p=reject; sp=reject; aspf=s;
                                      adkim=s
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                These records tell email servers that your
                                domain doesn't send emails and to reject any
                                emails claiming to be from your domain.
                              </p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-xs font-bold mb-2 text-success">
                              For Apex Domains (example.com):
                            </h5>
                            <div className="bg-base-9/70 rounded p-3 font-mono text-xs">
                              <div className="space-y-1">
                                <div>
                                  Type: A | Name: @ | Value: 185.199.108.153
                                </div>
                                <div>
                                  Type: A | Name: @ | Value: 185.199.109.153
                                </div>
                                <div>
                                  Type: A | Name: @ | Value: 185.199.110.153
                                </div>
                                <div>
                                  Type: A | Name: @ | Value: 185.199.111.153
                                </div>
                                <div className="mt-2">
                                  Type: CNAME | Name: www | Value:
                                  orderlynetworkdexcreator.github.io
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h5 className="text-xs font-bold mb-2 text-success">
                              For Subdomains (dex.example.com):
                            </h5>
                            <div className="bg-base-9/70 rounded p-3 font-mono text-xs">
                              <div>
                                Type: CNAME | Name: dex | Value:
                                orderlynetworkdexcreator.github.io
                              </div>
                            </div>
                          </div>

                          {selectedProvider === "cloudflare" && (
                            <div className="mt-4 p-3 bg-primary-light/10 rounded-lg border border-primary-light/20">
                              <h6 className="text-xs font-bold mb-2 flex items-center">
                                <div className="i-mdi:shield-check h-3.5 w-3.5 mr-1.5 text-primary-light"></div>
                                CloudFlare Proxy Setup (Important!)
                              </h6>
                              <div className="text-xs text-gray-300 space-y-1">
                                <div>
                                  • Enable the orange cloud icon (Proxy status)
                                  for ALL records
                                </div>
                                <div>
                                  • This provides instant SSL/TLS encryption
                                </div>
                                <div>
                                  • Much faster than waiting for GitHub Pages
                                  certificates
                                </div>
                                <div>• Better performance and security</div>
                              </div>
                            </div>
                          )}

                          <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
                            <h6 className="text-xs font-bold mb-2 flex items-center">
                              <div className="i-mdi:security h-3.5 w-3.5 mr-1.5 text-warning"></div>
                              Recommended: Email Security Records
                            </h6>
                            <p className="text-xs text-gray-300 mb-3">
                              Add these TXT records to protect your domain from
                              email spoofing attacks. Without these, attackers
                              could send phishing emails appearing to come from
                              your domain, which may cause your site to be
                              flagged by Google Safe Browsing.
                            </p>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs font-semibold mb-1 text-warning">
                                  SPF Record:
                                </div>
                                <div className="bg-base-9/70 rounded p-2 font-mono text-xs">
                                  <div>
                                    Type: TXT | Name: @ | Value: v=spf1 -all
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold mb-1 text-warning">
                                  DMARC Record:
                                </div>
                                <div className="bg-base-9/70 rounded p-2 font-mono text-xs">
                                  <div>
                                    Type: TXT | Name: _dmarc | Value: v=DMARC1;
                                    p=reject; sp=reject; aspf=s; adkim=s
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              These records tell email servers that your domain
                              doesn't send emails and to reject any emails
                              claiming to be from your domain.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-300">
                        <div className="flex items-start gap-1">
                          <div className="i-mdi:information-outline h-3.5 w-3.5 mt-0.5 flex-shrink-0"></div>
                          <span>
                            Copy these exact values to your DNS provider.
                            Changes may take up to 24 hours to propagate.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-light/10 p-3 sm:p-4 lg:p-6 flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <Button
                  onClick={handlePrevious}
                  variant="secondary"
                  disabled={isFirstStep}
                  className="flex-1 sm:flex-none"
                >
                  <span className="flex items-center gap-1">
                    <div className="i-mdi:chevron-left h-4 w-4"></div>
                    Previous
                  </span>
                </Button>

                {isLastStep ? (
                  <Button
                    onClick={handleClose}
                    variant="primary"
                    className="flex-1 sm:flex-none"
                  >
                    <span className="flex items-center gap-1">
                      <div className="i-mdi:check h-4 w-4"></div>
                      Complete Guide
                    </span>
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    className="flex-1 sm:flex-none"
                  >
                    <span className="flex items-center gap-1">
                      Next
                      <div className="i-mdi:chevron-right h-4 w-4"></div>
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
