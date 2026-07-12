import { getAppById } from "@toolbox/app-manifest";

export type AppIconProps = {
  appId: string;
  className?: string;
};

/** Decorative application mark sourced from the canonical app manifest. */
export function AppIcon({ appId, className }: AppIconProps) {
  const app = getAppById(appId);
  if (!app) throw new Error(`Unknown Toolbox app icon: ${appId}`);

  return (
    <svg
      className={["toolbox-app-icon", className].filter(Boolean).join(" ")}
      viewBox={app.icon.viewBox}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: app.icon.svg }}
    />
  );
}

export default AppIcon;
