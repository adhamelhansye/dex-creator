import { Link, useLocation } from "@remix-run/react";

export default function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="flex items-center">
      <div className="flex gap-2 md:gap-4">
        <Link
          to="/"
          className={`text-sm md:text-base font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all duration-200 
            ${
              isActive("/")
                ? "bg-light/10 text-white"
                : "text-gray-300 hover:bg-light/5 hover:text-white"
            }`}
        >
          Home
        </Link>

        <Link
          to="/dex"
          className={`text-sm md:text-base font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all duration-200 
            ${
              isActive("/dex")
                ? "bg-light/10 text-white"
                : "text-gray-300 hover:bg-light/5 hover:text-white"
            }`}
        >
          My DEX
        </Link>

        <Link
          to="/case-studies"
          className={`text-sm md:text-base font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all duration-200 
            ${
              isActive("/case-studies")
                ? "bg-light/10 text-white"
                : "text-gray-300 hover:bg-light/5 hover:text-white"
            }`}
        >
          Case Studies
        </Link>
      </div>
    </nav>
  );
}
