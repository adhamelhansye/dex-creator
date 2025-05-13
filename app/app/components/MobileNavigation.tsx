import { useState } from "react";
import { Link, useLocation } from "@remix-run/react";
import { Icon } from "@iconify/react";

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Determine if a link is active
  const isActive = (path: string) => {
    // Special case for root path
    if (path === "/" && location.pathname === "/") return true;
    // For non-root paths
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative z-30">
      {/* Hamburger button */}
      <button
        className="flex items-center justify-center w-10 h-10 rounded-full bg-background-light/30 border border-light/10 text-white"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <Icon
          icon={isOpen ? "heroicons:x-mark" : "heroicons:bars-3"}
          width={24}
        />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background-dark/80 backdrop-blur-sm z-20"
          onClick={closeMenu}
        ></div>
      )}

      {/* Mobile menu */}
      <div
        className={`
          fixed right-0 top-0 h-[100vh] mobile-nav-height w-64 bg-background-light border-l border-light/10
          transform transition-transform duration-300 ease-in-out z-30 flex flex-col
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex justify-end p-4">
          <button
            className="p-1 rounded-full bg-background-dark/50 border border-light/10"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <Icon icon="heroicons:x-mark" width={20} />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          <h2 className="text-xl font-bold gradient-text mb-6">Menu</h2>
          <nav className="flex flex-col gap-4">
            <Link
              to="/"
              className={`
                py-3 px-4 rounded-lg font-medium text-base transition-all duration-200
                ${
                  isActive("/")
                    ? "bg-light/10 text-white"
                    : "text-gray-300 hover:bg-light/5 hover:text-white"
                }
              `}
              onClick={closeMenu}
            >
              Home
            </Link>
            <Link
              to="/dex"
              className={`
                py-3 px-4 rounded-lg font-medium text-base transition-all duration-200
                ${
                  isActive("/dex")
                    ? "bg-light/10 text-white"
                    : "text-gray-300 hover:bg-light/5 hover:text-white"
                }
              `}
              onClick={closeMenu}
            >
              My DEX
            </Link>
            <Link
              to="/graduation"
              className={`
                py-3 px-4 rounded-lg font-medium text-base transition-all duration-200
                ${
                  isActive("/graduation")
                    ? "bg-light/10 text-white"
                    : "text-gray-300 hover:bg-light/5 hover:text-white"
                }
              `}
              onClick={closeMenu}
            >
              Fee Sharing
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
