import type { MetaFunction } from "@remix-run/node";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { Outlet, useNavigate } from "@remix-run/react";
import { useAppKit } from "@reown/appkit/react";

export const meta: MetaFunction = () => [
  { title: "DEX Creator | Orderly Network" },
];

export function Layout() {
  console.log("INDEX Layout");
  return <Outlet />;
}

export default function Index() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const appKit = useAppKit();

  const handleStartBuilding = () => {
    if (isAuthenticated) {
      navigate("/dex");
    } else {
      // If not authenticated, open the AppKit modal directly
      appKit?.open();
    }
  };

  return (
    <div className="page-container relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary-light/5 filter blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary-light/5 filter blur-3xl"></div>

      {/* Hero section */}
      <div className="section-container flex flex-col items-center text-center mb-12 pt-16 relative z-1">
        <h2 className="text-5xl md:text-6xl font-bold mb-8 max-w-4xl leading-tight">
          Create your own <span className="gradient-text">perpetual DEX</span>{" "}
          with Orderly
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mb-12">
          Powerful SDK, seamless integration for builders. Unified liquidity,
          superior performance for traders.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <Button variant="primary" size="md" onClick={handleStartBuilding}>
            Start Building Now
          </Button>
          <Button
            variant="secondary"
            size="md"
            as="a"
            href="https://orderly.network/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore Docs
          </Button>
        </div>
      </div>

      {/* Features section */}
      <div className="section-container mt-24">
        <h3 className="text-2xl font-bold mb-8 gradient-text text-center">
          Features
        </h3>

        <Card className="max-w-5xl mx-auto">
          <ul className="space-y-6">
            <li className="flex items-start gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-light mt-2.5"></div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">
                  Custom Branding
                </h4>
                <p className="text-gray-300">
                  Create DEXes with your own branding and design to match your
                  project's identity
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-light mt-2.5"></div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">
                  One-Click Deployment
                </h4>
                <p className="text-gray-300">
                  Deploy your DEX with just a few clicks - no complex setup or
                  coding required
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-light mt-2.5"></div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">
                  Orderly Infrastructure
                </h4>
                <p className="text-gray-300">
                  Leverage Orderly's powerful infrastructure for deep liquidity
                  and high performance
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-light mt-2.5"></div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">
                  No Coding Required
                </h4>
                <p className="text-gray-300">
                  Intuitive interface lets you configure and launch your DEX
                  without technical expertise
                </p>
              </div>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
