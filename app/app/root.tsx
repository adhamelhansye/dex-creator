import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { AuthProvider } from "./context/AuthContext";
import { AppKitProvider } from "./components/AppKitProvider";
import { ModalProvider } from "./context/ModalContext";
import { ToastContainer } from "react-toastify";
import Navigation from "./components/Navigation";
import WalletConnect from "./components/WalletConnect";
import MobileNavigation from "./components/MobileNavigation";
import "react-toastify/dist/ReactToastify.css";
import "./styles/global.css";
import { useState, useEffect } from "react";

export default function App() {
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/webp" href="/favicon.webp" />
        <title>Orderly DEX Creator</title>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <ScrollRestoration />
        <Scripts />
        <AppKitProvider>
          <AuthProvider>
            <ModalProvider>
              <div className="flex flex-col h-full">
                {/* Fixed header - uses the header styles from global.css */}
                <header>
                  <div className="flex justify-between items-center py-4 px-4 md:py-6 md:px-8">
                    <div className="flex items-center">
                      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold gradient-text">
                        Orderly DEX Creator
                      </h1>
                      {/* Desktop navigation - hidden on mobile */}
                      <div className="hidden md:block ml-8">
                        <Navigation />
                      </div>
                    </div>
                    {/* Wallet connect and mobile navigation */}
                    <div className="flex items-center gap-3">
                      <WalletConnect />
                      {/* Mobile navigation - visible only on mobile */}
                      {isMobile && <MobileNavigation />}
                    </div>
                  </div>
                </header>

                {/* Scrollable content area */}
                <main>
                  <Outlet />
                </main>
              </div>

              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </ModalProvider>
          </AuthProvider>
        </AppKitProvider>
      </body>
    </html>
  );
}
