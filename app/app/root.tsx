import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";
import { HelmetProvider } from "react-helmet-async";
import "react-toastify/dist/ReactToastify.css";
import "./styles/global.css";

export const meta: MetaFunction = () => {
  return [
    { title: "Orderly One - Create Your DEX" },
    {
      name: "description",
      content:
        "Create and manage your own perpetual decentralized exchange powered by Orderly Network. No coding required.",
    },
    {
      name: "keywords",
      content:
        "dex, crypto, trading, defi, orderly, perpetual, decentralized exchange, dex creator, white label",
    },

    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Orderly One" },
    { property: "og:title", content: "Orderly One - Create Your DEX" },
    {
      property: "og:description",
      content:
        "Create and manage your own perpetual decentralized exchange powered by Orderly Network. No coding required.",
    },
    { property: "og:url", content: "https://dex.orderly.network" },
    { property: "og:locale", content: "en_US" },

    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@OrderlyNetwork" },
    { name: "twitter:creator", content: "@OrderlyNetwork" },
    { name: "twitter:title", content: "Orderly One - Create Your DEX" },
    {
      name: "twitter:description",
      content:
        "Create and manage your own perpetual decentralized exchange powered by Orderly Network. No coding required.",
    },

    { name: "theme-color", content: "#595bff" },

    { name: "robots", content: "index, follow" },
    {
      name: "googlebot",
      content: "index, follow, max-snippet:-1, max-image-preview:large",
    },
  ];
};

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <ScrollRestoration />
        <Scripts />
        <HelmetProvider>
          <Outlet />
        </HelmetProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Orderly One",
              applicationCategory: "FinanceApplication",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Create and manage your own perpetual decentralized exchange powered by Orderly Network",
            }),
          }}
        />
      </body>
    </html>
  );
}
