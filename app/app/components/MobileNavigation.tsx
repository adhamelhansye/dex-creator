// Removed unused useState import
import { Link, useLocation } from "@remix-run/react";
import { Icon } from "@iconify/react";
import { CampaignIcon } from "../icons/CampaignIcon";

interface MobileNavigationProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function MobileNavigation({
  isOpen,
  setIsOpen,
}: MobileNavigationProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
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

      {/* Mobile menu */}
      <div
        className={`
          fixed right-0 top-0 h-[100vh] mobile-nav-height w-64 bg-background-light border-l border-light/10
          transform transition-transform duration-300 ease-in-out z-[200] flex flex-col
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex justify-between items-center p-4">
          <img src="/orderly-one.min.svg" alt="Orderly One" className="h-8" />
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
              to="https://app.orderly.network/campaigns"
              target="_blank"
              className={`inline-flex items-center gap-1
                py-3 px-4 rounded-lg font-medium text-base transition-all duration-200
                ${
                  isActive("https://app.orderly.network/campaigns")
                    ? "bg-light/10 text-white"
                    : "text-gray-300 hover:bg-light/5 hover:text-white"
                }
              `}
              onClick={closeMenu}
            >
              UCC
              <CampaignIcon />
            </Link>
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
              to="/board"
              className={`
                py-3 px-4 rounded-lg font-medium text-base transition-all duration-200
                ${
                  isActive("/board")
                    ? "bg-light/10 text-white"
                    : "text-gray-300 hover:bg-light/5 hover:text-white"
                }
              `}
              onClick={closeMenu}
            >
              Board
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
              to="/case-studies"
              className={`
                py-3 px-4 rounded-lg font-medium text-base transition-all duration-200
                ${
                  isActive("/case-studies")
                    ? "bg-light/10 text-white"
                    : "text-gray-300 hover:bg-light/5 hover:text-white"
                }
              `}
              onClick={closeMenu}
            >
              Case Studies
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
