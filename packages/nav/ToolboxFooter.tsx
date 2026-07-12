import { useEffect, useState } from "react";
import { getLang, onChange } from "@toolbox/i18n";
import { getAppById, TOOLBOX_RELEASE } from "@toolbox/app-manifest";

export type ToolboxFooterProps = {
  appId: string;
  className?: string;
};

export function ToolboxFooter({ appId, className }: ToolboxFooterProps) {
  const app = getAppById(appId);
  const [lang, setResolvedLang] = useState<"zh" | "en">(getLang);

  useEffect(() => onChange(setResolvedLang), []);
  if (!app) throw new Error(`Unknown Toolbox footer app: ${appId}`);

  return (
    <footer className={["toolbox-footer", className].filter(Boolean).join(" ")}>
      <p className="toolbox-footer-description">
        {lang === "zh" ? app.description.zh : app.description.en}
      </p>
      <div className="toolbox-footer-meta">
        <a
          href="https://github.com/StepaniaH/Toolbox"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/StepaniaH/Toolbox/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
        >
          MIT
        </a>
        <span aria-hidden="true">·</span>
        <span>{TOOLBOX_RELEASE}</span>
      </div>
    </footer>
  );
}

export default ToolboxFooter;
