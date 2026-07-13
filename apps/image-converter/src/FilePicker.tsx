import type { ChangeEvent, ReactNode } from "react";

type FilePickerProps = {
  label: string;
  accept?: string;
  multiple?: boolean;
  directory?: boolean;
  variant?: "primary" | "secondary";
  icon?: ReactNode;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function FilePicker({
  label,
  accept,
  multiple = false,
  directory = false,
  variant = "primary",
  icon = "＋",
  onChange,
}: FilePickerProps) {
  return <label className={`button file-picker ${variant}`}>
    <span className="file-picker-icon" aria-hidden="true">{icon}</span>
    <span>{label}</span>
    <input
      aria-label={label}
      type="file"
      accept={accept}
      multiple={multiple}
      {...(directory ? { webkitdirectory: "" } as Record<string, string> : {})}
      onChange={onChange}
    />
  </label>;
}
