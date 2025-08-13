import type { MetaFunction } from "@remix-run/node";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { Outlet, useNavigate } from "@remix-run/react";
import { useAppKit } from "@reown/appkit/react";
import { Icon } from "@iconify/react";

export const meta: MetaFunction = () => [
  { title: "Orderly One | No-Code Perp DEX Launcher" },
];

export function Layout() {
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
      appKit?.open();
    }
  };

  return (
    <div className="bg-black min-h-screen">
      <div className="relative z-10 mt-20 flex flex-col gap-20">
        {/* Hero Section */}
        <section className="section-container flex flex-col items-center text-center pt-20 pb-16 relative overflow-hidden">
          {/* Background Video */}
          <div className="absolute inset-0 w-full h-full">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ objectPosition: "center" }}
            >
              <source src="/banner.webm" type="video/webm" />
            </video>
            {/* Overlay to ensure text readability */}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 max-w-5xl leading-tight text-white">
              No-Code Perp Dex Launcher by Orderly
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mb-12 leading-relaxed">
              Unified liquidity, omnichain integration, 130+ assets and
              liquidity included. Launch your DEX in minutes.
            </p>

            <div className="flex gap-4 flex-wrap justify-center">
              <Button variant="primary" size="lg" onClick={handleStartBuilding}>
                Start Building
              </Button>
              <Button
                variant="secondary"
                size="lg"
                as="a"
                href="https://orderly.network/docs"
                target="_blank"
                rel="noopener noreferrer"
              >
                Explore Docs
              </Button>
            </div>
          </div>
        </section>

        {/* Video Section */}
        <section className="section-container text-center">
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video bg-black/50 rounded-2xl border border-white/20 flex items-center justify-center">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                <Icon
                  icon="heroicons:play"
                  className="w-8 h-8 text-white ml-1"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="section-container px-4 md:px-8">
          <div className="flex flex-col justify-around md:flex-row items-center justify-center gap-6 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="text-6xl md:text-7xl font-bold bg-gradient-to-t from-white to-purple-300 bg-clip-text text-transparent mb-2">
                700K+
              </div>
              <div className="text-xl text-white font-semibold">TRADERS</div>
            </div>

            <div className="w-full md:hidden min-h-px bg-gray-400"></div>
            <div className="hidden md:block min-w-px h-32 bg-gray-400"></div>

            <div className="text-center">
              <div className="text-6xl md:text-7xl font-bold bg-gradient-to-t from-white to-purple-300 bg-clip-text text-transparent mb-2">
                55+
              </div>
              <div className="text-xl text-white font-semibold">
                TRUSTED PARTNERS
              </div>
            </div>

            <div className="w-full md:hidden min-h-px bg-gray-400"></div>
            <div className="hidden md:block min-w-px h-32 bg-gray-400"></div>

            <div className="text-center">
              <div className="text-6xl md:text-7xl font-bold bg-gradient-to-t from-white to-purple-300 bg-clip-text text-transparent mb-2">
                $110B+
              </div>
              <div className="text-xl text-white font-semibold">
                CUMULATIVE TRADING VOLUME
              </div>
            </div>
          </div>
        </section>

        {/* The Orderly Advantage Section */}
        <section className="section-container mt-20 relative overflow-hidden">
          {/* Purple glow on the left */}
          <div className="absolute top-0 left--70 w-200 h-full bg-gradient-radial from-purple-600/50 via-purple-600/20 to-transparent pointer-events-none blur-sm"></div>

          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              The Orderly Advantage
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              Welcome to Orderly One, your no-code AI builder to launch a perp
              DEX in minutes. 15+ chains, 110+ assets, up to 100x leverage. Your
              brand, your community, your DEX.
            </p>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 md:px-8">
            <Card className="text-center p-8">
              <div className="w-32 h-32 mx-auto mb-6 rounded-2xl flex items-center justify-center">
                <img
                  src="/coin.webp"
                  alt="Scale Your Business"
                  className="size-32 object-cover"
                />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Scale Your Business with Perps
              </h3>
              <p className="text-white/80">
                For anyone looking to build out your perp DEX, widen your
                product offering, or provide a new revenue stream.
              </p>
            </Card>

            <Card className="text-center p-8">
              <div className="w-32 h-32 mx-auto mb-6 rounded-2xl flex items-center justify-center">
                <img
                  src="/assets.webp"
                  alt="Customize Assets"
                  className="size-32 object-cover"
                />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Customize Assets and Components
              </h3>
              <p className="text-white/80">
                AI agents generate a custom theme for you, use your own logos,
                fonts, and colour scheme.
              </p>
            </Card>

            <Card className="text-center p-8">
              <div className="w-32 h-32 mx-auto mb-6 rounded-2xl flex items-center justify-center">
                <img
                  src="/chart.webp"
                  alt="Best-in-Class Liquidity"
                  className="size-32 object-cover"
                />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Best-in-Class Omnichain Liquidity
              </h3>
              <p className="text-white/80">
                Omnichain orderbook. Unified liquidity across 15+ blockchains.
                Deep liquidity driven by top market makers.
              </p>
            </Card>
          </div>
        </section>

        {/* Launch a Perp DEX Section */}
        <section className="section-container px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Launch a Perp DEX in Just a Few Clicks
              </h2>
              <p className="text-lg text-white/80 mb-8 leading-relaxed">
                Choose logos, colour schemes, chains of choice, fee structure,
                and your custom URL. Let the agent deploy your DEX in minutes.
              </p>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleStartBuilding}
              >
                Start Building
              </Button>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="size-8 bg-black rounded-full flex items-center justify-center">
                  <img
                    src="/rocket.svg"
                    alt="Revenue Split"
                    className="min-w-6 min-h-6"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent mb-2 w-fit">
                    Revenue Split
                  </h3>
                  <p className="text-white/80">
                    No integration fees. Orderly charges 3bps taker, 0bps maker.
                    Anything you charge on top is 100% yours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-8 bg-black rounded-full flex items-center justify-center">
                  <img
                    src="/rocket.svg"
                    alt="Security"
                    className="min-w-6 min-h-6"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent mb-2 w-fit">
                    Security
                  </h3>
                  <p className="text-white/80">
                    Put security on auto-pilot as you inherit Orderly's secure
                    trading infrastructure, affirmed by renowned auditing firms.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-8 bg-black rounded-full flex items-center justify-center">
                  <img
                    src="/rocket.svg"
                    alt="CEX Level Performance"
                    className="min-w-6 min-h-6"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent mb-2 w-fit">
                    CEX Level Performance
                  </h3>
                  <p className="text-white/80">
                    &lt;200ms latency for high-frequency trading — with the
                    benefits of DeFi: self-custody, on-chain orders, and full
                    transparency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Orderly One is for... Section */}
        <section className="section-container relative">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">
            Orderly One is for...
          </h2>
          <div className="absolute bottom--50 right--70 w-200 h-full bg-gradient-radial from-purple-600/50 via-violet-300/20 to-transparent pointer-events-none blur-sm"></div>

          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <Card className="p-8 b-2 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-purple-500/20 pointer-events-none blur-sm"></div>
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <img
                    src="/coins.webp"
                    alt="Trading Communities"
                    className="size-32 object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Trading Communities
                  </h3>
                  <p className="text-white/80">
                    Stop giving your trading volume to CEXs for a small rebate.
                    It's time to monetize your community. Launch your own DEX,
                    keep 100% of the fees your traders generate, or offer near
                    zero-fee trading—you decide.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 b-2 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-purple-500/20 pointer-events-none blur-sm"></div>
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <img
                    src="/meme.webp"
                    alt="Meme Projects"
                    className="size-32 object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Meme Projects
                  </h3>
                  <p className="text-white/80">
                    Who said meme tokens can't have utility? Launch a Perp DEX
                    for your community, use fees to buy back your token, reward
                    loyal users, or offer better trading terms. Turn memes into
                    market makers.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 b-2 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-purple-500/20 pointer-events-none blur-sm"></div>
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <img
                    src="/infra.webp"
                    alt="DeFi Protocols"
                    className="size-32 object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    DeFi Protocols
                  </h3>
                  <p className="text-white/80">
                    Want to add Perps to your product? Skip the heavy
                    lifting—just set your branding, define fees, and go live in
                    minutes with the best trading experience for your users.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 b-2 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-purple-500/20 pointer-events-none blur-sm"></div>
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <img
                    src="/people.webp"
                    alt="Everyone"
                    className="size-32 object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Everyone
                  </h3>
                  <p className="text-white/80">
                    Even as a trader, you can create your own perp DEX.
                    Customize the UI, set your fees, and trade without limits. A
                    few clicks, and you own your own exchange.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
