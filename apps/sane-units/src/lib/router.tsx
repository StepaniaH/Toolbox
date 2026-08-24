import { useEffect, useState } from "react";

export const APP_BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");

export function toAppPath(pathname: string): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (!APP_BASE_PATH) return normalized;
  return normalized === "/" ? `${APP_BASE_PATH}/` : `${APP_BASE_PATH}${normalized}`;
}

export function fromAppPath(pathname: string): string {
  if (!APP_BASE_PATH) return pathname;
  if (pathname === APP_BASE_PATH) return "/";
  if (pathname.startsWith(`${APP_BASE_PATH}/`)) {
    return pathname.slice(APP_BASE_PATH.length) || "/";
  }
  return pathname;
}


export function currentPath(): string {
  return normalizeRoute(fromAppPath(window.location.pathname));
}

export function normalizeRoute(pathname: string): string {
  const route = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (route === "/storage" || route === "/network" || route === "/video" || route === "/power" || route === "/about") {
    return route;
  }
  return "/";
}


export function NavLink({ to, active, onNavigate, children }: any) {
  return (
    <a
      className={`nav-link ${active ? "nav-link-active" : ""}`}
      href={toAppPath(to)}
      aria-current={active ? "page" : undefined}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(to);
      }}
    >
      {children}
    </a>
  );
}


export function useAppNavigation(): [string, (path: string) => void] {
  const [path, setPath] = useState(() => currentPath());

  useEffect(() => {
    const handlePopState = () => setPath(currentPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath) => {
    const route = normalizeRoute(nextPath);
    if (route === currentPath()) return;
    window.history.pushState({}, "", toAppPath(route));
    setPath(currentPath());
  };

  return [path, navigate];
}

