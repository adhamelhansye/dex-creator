import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

export const meta: MetaFunction = () => [
  { title: "Case Studies | Orderly One" },
];

const caseStudies = [
  {
    id: "aden",
    name: "ADEN",
    description:
      "Aden, created by INBUM, the biggest Korean streamer with thousands of followers, saw a huge opportunity to keep his trading community’s activity within his own ecosystem. His community already generates over $50B in monthly trading volume on Gate and Bitget, so instead of directing that volume to third-party platforms, INBUM launched Aden, a fully branded perp DEX built with Orderly One’s no-code solution.",
    image: "/aden.webp",
    dexUrl: "https://aden.io",
    socialUrl: "https://x.com/aden",
    stats: [
      { value: "$6.5B+", label: "TOTAL TRADING VOLUME" },
      { value: "2K+", label: "DAILY ACTIVE USERS" },
      { value: "#2", label: "RANKING ON CMC" },
    ],
    treasuryFeatures: [
      {
        type: "paragraph",
        title: "How Aden Turns Trading into Community Value",
        description:
          "With Aden, INBUM set his own fees, branding, and user experience while eliminating the middleman. This move also gave his BGSC token new utility, as revenue from the DEX will be used for buybacks and burns, directly benefiting token holders.",
        description2:
          "Through this DEX, Aden is building a self-sustaining ecosystem while giving his community a familiar trading environment they can trust, all under his own brand, Aden. Aden currently plays a key role within the Orderly ecosystem, responsible for the highest trading volume.",
      },
    ],
  },
  {
    id: "noot",
    name: "NOOT",
    description:
      "NOOT, the first CTO memecoin on Abstract, quickly identified the need to bring real utility beyond just memes. They launched Nootrade.xyz, a custom perp DEX built using Orderly One's no-code solution, providing their community with a platform to trade perps within their own ecosystem.",
    image: "/noot.webp",
    dexUrl: "https://nootrade.xyz",
    socialUrl: "https://x.com/nootonabstract",
    stats: [
      { value: "$10M+", label: "TOTAL TRADING VOLUME" },
      { value: "$4K+", label: "REVENUE GENERATED FOR NOOT TREASURY" },
      { value: "815+", label: "UNIQUE TRADERS" },
    ],
    treasuryFeatures: [
      {
        icon: "mdi:fire",
        title: "Token Buybacks & Burns",
        description:
          "Regularly repurchasing $NOOT tokens from the market and permanently removing them from circulation to create scarcity and strengthen long-term value.",
      },
      {
        icon: "mdi:account-group",
        title: "Community Growth Campaigns",
        description:
          "Running targeted marketing campaigns and hosting engaging trading competitions to attract new users, boost participation, and increase brand visibility.",
      },
      {
        icon: "mdi:currency-usd",
        title: "Funding for Future CEX Listings",
        description:
          "Allocating resources to secure listings on major centralized exchanges, expanding market access and improving token liquidity.",
      },
    ],
  },
  {
    id: "lol",
    name: "LOL",
    description:
      "LOL DEX was built to give tangible utility to the LOL token, a CTO meme on Solana. Using Orderly One’s no-code solution, the team spun up a branded perps DEX so their community can trade perps inside the LOL ecosystem while the project captures a share of fees for its own growth.",
    image: "/lol.webp",
    dexUrl: "https://www.loldex.lol/",
    socialUrl: "https://x.com/lolctolol",
    stats: [
      { value: "$30M+", label: "TOTAL TRADING VOLUME" },
      { value: "$9K+", label: "REVENUE USED TO LOL BUYBACKS" },
    ],
    treasuryFeatures: [
      {
        icon: "mdi:fire",
        title: "Token Buybacks & Burns",
        description:
          "Regularly repurchasing $LOL tokens from the market and permanently removing them from circulation to create scarcity and strengthen long-term value.",
      },
      {
        icon: "mdi:account-group",
        title: "Community Growth Campaigns",
        description:
          "Running targeted marketing campaigns and hosting engaging trading competitions to attract new users, boost participation, and increase brand visibility.",
      },
      {
        icon: "mdi:currency-usd",
        title: "Funding for Future CEX Listings",
        description:
          "Allocating resources to secure listings on major centralized exchanges, expanding market access and improving token liquidity.",
      },
    ],
  },
];

export default function CaseStudies() {
  const [activeTab, setActiveTab] = useState("aden");

  const activeCaseStudy = caseStudies.find(study => study.id === activeTab);

  return (
    <div className="bg-black min-h-screen pb-52">
      <div className="relative z-10 mt-20 flex flex-col gap-8">
        {/* Header Section */}
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
              Case Studies
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mb-12 leading-relaxed mx-auto">
              See how communities and creators use Orderly One's no-code
              solution to build branded perp DEXs and turn trading fees into
              growth and utility.
            </p>

            <div className="flex justify-center">
              <div className="flex flex-wrap justify-center gap-2">
                {caseStudies.map(study => (
                  <button
                    key={study.id}
                    onClick={() => setActiveTab(study.id)}
                    className={`px-10 py-3 rounded-full font-semibold transition-all duration-200 ${
                      activeTab === study.id
                        ? "bg-purple-400 text-black"
                        : "bg-gray-800/50 text-white"
                    }`}
                  >
                    {study.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Case Study Content */}
        {activeCaseStudy && (
          <section className="section-container">
            <div className="max-w-6xl mx-auto space-y-32">
              {/* Main Case Study Card */}
              <Card className="p-8 md:p-12 bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/30">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                  <div className="space-y-6">
                    <h2 className="text-4xl md:text-5xl font-bold text-white">
                      {activeCaseStudy.name}
                    </h2>

                    <div className="flex gap-4 flex-wrap">
                      <Button
                        variant="primary"
                        as="a"
                        href={activeCaseStudy.dexUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit DEX
                      </Button>
                      <Button
                        variant="secondary"
                        as="a"
                        href={activeCaseStudy.socialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Discover Their X
                      </Button>
                    </div>

                    <p className="text-lg text-white/80 leading-relaxed">
                      {activeCaseStudy.description}
                    </p>
                  </div>

                  <div className="relative ma max-w-xl">
                    <div className="bg-gradient-to-br rounded-2xl flex items-center justify-center overflow-hidden">
                      <img
                        src={activeCaseStudy.image}
                        alt={`${activeCaseStudy.name} DEX interface`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Stats Section */}
              <div className="text-center space-y-8">
                <div
                  className={`grid gap-8 ${
                    activeCaseStudy.stats.length === 2
                      ? "md:grid-cols-2"
                      : "md:grid-cols-3"
                  }`}
                >
                  {activeCaseStudy.stats.map((stat, index) => (
                    <div
                      key={index}
                      className="space-y-4 [&:not(:last-child)]:border-r border-white/10"
                    >
                      <div className="text-5xl md:text-6xl font-bold bg-gradient-to-t from-white to-purple-300 bg-clip-text text-transparent">
                        {stat.value}
                      </div>
                      <div className="text-lg text-white/80 font-medium">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-white/60">
                  *All figures are based on the first{" "}
                  {activeCaseStudy.id === "aden" ? "twenty days" : "two months"}{" "}
                  following the DEX's launch.
                </p>
              </div>

              {/* Treasury Features */}
              {activeCaseStudy.id === "aden" ? (
                // ADEN has a different layout
                <div className="grid lg:grid-cols-2 gap-16 items-start">
                  <div>
                    <h3 className="text-4xl md:text-5xl font-bold text-white mb-8">
                      {activeCaseStudy.treasuryFeatures[0].title}
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <p className="text-white/80 leading-relaxed text-lg">
                      {activeCaseStudy.treasuryFeatures[0].description}
                    </p>
                    <p className="text-white/80 leading-relaxed text-lg">
                      {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (activeCaseStudy.treasuryFeatures[0] as any)
                          .description2
                      }
                    </p>
                  </div>
                </div>
              ) : (
                // NOOT and LOL have the standard layout with icons
                <div className="grid lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
                  <div>
                    <h3 className="text-4xl md:text-5xl font-bold text-white mb-8">
                      Trading fees fund a self-sustaining treasury for:
                    </h3>
                  </div>

                  <div>
                    {activeCaseStudy.treasuryFeatures.map((feature, index) => (
                      <div
                        key={index}
                        className="py-6 [&:not(:last-child)]:border-b border-white/10"
                      >
                        <div className="flex items-start gap-4">
                          <div className="size-8 bg-black rounded-full flex items-center justify-center">
                            <img
                              src={
                                feature.title.includes("Buybacks") ||
                                feature.title.includes("Burns")
                                  ? "/fire.svg"
                                  : feature.title.includes("Community") ||
                                      feature.title.includes("Growth")
                                    ? "/partner.svg"
                                    : "/money.svg"
                              }
                              alt={feature.title}
                              className="min-w-6 min-h-6"
                            />
                          </div>
                          <div>
                            <h4 className="text-2xl font-semibold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent mb-2 w-fit">
                              {feature.title}
                            </h4>
                            <p className="text-white/80">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
