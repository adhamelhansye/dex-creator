import { Link, useLocation } from "@remix-run/react";
import {
  navigationItems,
  isPathActive,
  getPathWithSearch,
} from "../utils/navigation";

export default function Navigation() {
  const location = useLocation();

  return (
    <nav className="flex items-center">
      <div className="flex lg:gap-4">
        {navigationItems.map(item => {
          const isActive = isPathActive(
            location.pathname,
            item.path,
            item.target
          );
          const fullPath = getPathWithSearch(item.path, location.search);

          return (
            <Link
              key={item.path}
              to={fullPath}
              target={item.target}
              className={`inline-flex items-center gap-1 text-sm md:text-base font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all duration-200 ${
                isActive
                  ? "bg-light/10 text-white"
                  : "text-gray-300 hover:bg-light/5 hover:text-white"
              }`}
            >
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
