import type { MetaFunction } from "@remix-run/node";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/useAuth";
import { Outlet, useNavigate } from "@remix-run/react";
import { useAppKit } from "@reown/appkit/react";

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
      appKit?.open({
        namespace: "eip155",
        view: "Connect",
      });
    }
  };

  return (
    <div className="bg-black min-h-screen pb-52">
      {/* Hero Section */}
      <section className="section-container flex flex-col items-center text-center pt-20 pb-16 relative overflow-hidden mt-20">
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
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 max-w-5xl leading-tight text-white">
            The First No-Code Perp DEX Launcher
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mb-12 leading-relaxed mxa">
            Launch a fully-featured Omnichain perpetuals exchange in minutes.
            Deep liquidity, 140+ assets, and support for 17+ major chains in
            minutes.
          </p>

          <div className="flex gap-4 flex-wrap justify-center">
            <Button variant="primary" size="lg" onClick={handleStartBuilding}>
              Start Building
            </Button>
            <Button variant="secondary" size="lg" as="a" href="/board">
              View Board
            </Button>
            <Button
              variant="secondary"
              size="lg"
              as="a"
              href="https://orderly.network/docs/introduction/getting-started/what-is-orderly"
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore Docs
            </Button>
          </div>
        </div>
      </section>

      <div className="relative z-10 flex flex-col gap-50">
        {/* Video Section */}
        <section className="section-container text-center">
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video rounded-2xl border border-white/20 overflow-hidden">
              <video
                controls
                className="w-full h-full object-cover"
                preload="metadata"
              >
                <source src="/promo.webm" type="video/webm" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="section-container px-4 md:px-8">
          <div className="flex flex-col justify-around md:flex-row items-center justify-center gap-6 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="text-6xl md:text-7xl font-semibold bg-gradient-to-t from-white to-purple-300 bg-clip-text text-transparent mb-2">
                700K+
              </div>
              <div className="text-xl text-white font-semibold">TRADERS</div>
            </div>

            <div className="w-full md:hidden min-h-px bg-gray-400"></div>
            <div className="hidden md:block min-w-px h-32 bg-gray-400"></div>

            <div className="text-center">
              <div className="text-6xl md:text-7xl font-semibold bg-gradient-to-t from-white to-purple-300 bg-clip-text text-transparent mb-2">
                55+
              </div>
              <div className="text-xl text-white font-semibold">
                TRUSTED PARTNERS
              </div>
            </div>

            <div className="w-full md:hidden min-h-px bg-gray-400"></div>
            <div className="hidden md:block min-w-px h-32 bg-gray-400"></div>

            <div className="text-center">
              <div className="text-6xl md:text-7xl font-semibold bg-gradient-to-t from-white to-purple-300 bg-clip-text text-transparent mb-2">
                $110B+
              </div>
              <div className="text-xl text-white font-semibold">
                CUMULATIVE TRADING VOLUME
              </div>
            </div>
          </div>
        </section>

        <section className="section-container mt-20 relative overflow-hidden">
          {/* Purple glow on the left */}
          <div className="absolute top-0 left--70 w-200 h-full bg-gradient-radial from-purple-600/50 via-purple-600/20 to-transparent pointer-events-none blur-sm"></div>

          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-white">
              Own the exchange
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
                New Revenue Streams
              </h3>
              <p className="text-white/80">
                Trading fees can be earned or shared with your community,
                instead of making the exchanges rich.
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
                Showcase Your Brand
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
                Any Wallet, Any Chain
              </h3>
              <p className="text-white/80">
                An omnichain shared order book lets users access the way your
                community prefers.
              </p>
            </Card>
          </div>
        </section>

        <section className="section-container px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-white">
                Built on Battle-Tested Infra
              </h2>
              <p className="text-lg text-white/80 mb-8 leading-relaxed">
                Orderly’s SDK powers the DEXes deployed by WOO, Raydium,
                Quickswap, and other established DeFi powerhouses.
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
                    src="/currency.svg"
                    alt="Revenue Split"
                    className="min-w-6 min-h-6"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent mb-2 w-fit">
                    Best-In-Class Liquidity
                  </h3>
                  <p className="text-white/80">
                    Shared orderbooks are maintained by top institutional market
                    makers, traders, and retail users all over the globe.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-8 bg-black rounded-full flex items-center justify-center">
                  <img
                    src="/security.svg"
                    alt="Security"
                    className="min-w-6 min-h-6"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent mb-2 w-fit">
                    Professional-Grade Security
                  </h3>
                  <p className="text-white/80">
                    We work with renowned auditing and cybersecurity firms to
                    protect smart contracts with 24/7 monitoring.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-8 bg-black rounded-full flex items-center justify-center">
                  <img
                    src="/finance.svg"
                    alt="CEX Level Performance"
                    className="min-w-6 min-h-6"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent mb-2 w-fit">
                    CeFi-Grade Performance
                  </h3>
                  <p className="text-white/80">
                    &lt;200ms latency for high-frequency trading, with
                    self-custody, onchain orders, full transparency, and all the
                    other benefits of DeFi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Orderly One is for... Section */}
        <section className="section-container relative">
          <h2 className="text-4xl md:text-5xl font-semibold text-center mb-16 text-white">
            Orderly One is for...
          </h2>
          <div
            className="absolute w-200 h-230 top--2 right-0 pointer-events-none blur-sm"
            style={{
              backgroundImage: "url(/bg-gradient.svg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>

          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <Card className="p-8 b-2 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-72 h-32 bg-gradient-to-br from-transparent via-transparent to-purple-500/20 pointer-events-none"></div>
              <div className="flex flex-wrap items-start justify-center gap-6 relative z-10">
                <div className="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <img
                    src="/coins.webp"
                    alt="Trading Communities"
                    className="size-32 object-cover"
                  />
                </div>
                <div className="flex-1 min-w-64">
                  <h3 className="text-2xl font-semibold text-white mb-4 leading-tight break-words">
                    Trading Communities
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    Stop shilling ref-links: Launch your own DEX and capture
                    100% of your community's trading fees. Set your own fee
                    structure—premium rates for profit or zero fees for loyalty.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 b-2 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-72 h-32 bg-gradient-to-br from-transparent via-transparent to-purple-500/20 pointer-events-none"></div>
              <div className="flex flex-wrap items-start justify-center gap-6 relative z-10">
                <div className="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <img
                    src="/meme.webp"
                    alt="Meme Projects"
                    className="size-32 object-cover"
                  />
                </div>
                <div className="flex-1 min-w-64">
                  <h3 className="text-2xl font-semibold text-white mb-4 leading-tight break-words">
                    Meme Projects
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    Give your meme token real utility. Launch a community perp
                    dex, use trading fees for token buybacks, and reward your
                    holders with better trading terms. Turn hype into revenue.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 b-2 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-72 h-32 bg-gradient-to-br from-transparent via-transparent to-purple-500/20 pointer-events-none"></div>
              <div className="flex flex-wrap items-start justify-center gap-6 relative z-10">
                <div className="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <img
                    src="/infra.webp"
                    alt="DeFi Protocols"
                    className="size-32 object-cover"
                  />
                </div>
                <div className="flex-1 min-w-64">
                  <h3 className="text-2xl font-semibold text-white mb-4 leading-tight break-words">
                    DeFi Protocols
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    Add perpetuals to your protocol without months of
                    development. White-label deployment in minutes—your brand,
                    your fees, institutional-grade trading infrastructure.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 b-2 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-72 h-32 bg-gradient-to-br from-transparent via-transparent to-purple-500/20 pointer-events-none"></div>
              <div className="flex flex-wrap items-start justify-center gap-6 relative z-10">
                <div className="w-32 h-32 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <img
                    src="/people.webp"
                    alt="Everyone"
                    className="size-32 object-cover"
                  />
                </div>
                <div className="flex-1 min-w-64">
                  <h3 className="text-2xl font-semibold text-white mb-4 leading-tight break-words">
                    Everyone
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    Why trade on someone else's exchange? Launch your own DEX in
                    minutes. Set your fees, customize the experience, trade
                    without limits. Your exchange, your rules.
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
