import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const ALLOWED_PATHS = ["/", "/pricing", "/help"];

export default function NavbarGate() {
  const location = useLocation();

  // exact match or sub-route (future-proof)
  const shouldShowNavbar = ALLOWED_PATHS.some(
    (path) =>
      location.pathname === path ||
      location.pathname.startsWith(path + "/")
  );

  if (!shouldShowNavbar) return null;

  return <Navbar />;
}
