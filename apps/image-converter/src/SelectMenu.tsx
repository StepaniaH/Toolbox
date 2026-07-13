import { useEffect, useId, useRef, useState } from "react";

export type SelectOption<T extends string> = { value: T; label: string; description?: string };

export function SelectMenu<T extends string>({
  value, options, onChange, ariaLabel, align = "left",
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const move = (offset: number) => {
    const index = Math.max(0, options.findIndex((option) => option.value === value));
    const next = options[(index + offset + options.length) % options.length];
    onChange(next.value);
  };

  return <div className={`select-menu align-${align} ${open ? "is-open" : ""}`} ref={rootRef}>
    <button
      type="button"
      className="select-trigger"
      aria-label={ariaLabel}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={listId}
      onClick={() => setOpen((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault(); move(event.key === "ArrowDown" ? 1 : -1); setOpen(true);
        }
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <span><strong>{selected.label}</strong>{selected.description && <small>{selected.description}</small>}</span>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5"/></svg>
    </button>
    {open && <div className="select-popover" id={listId} role="listbox" aria-label={ariaLabel}>
      {options.map((option) => <button
        type="button"
        role="option"
        aria-selected={option.value === value}
        key={option.value}
        onClick={() => { onChange(option.value); setOpen(false); }}
      >
        <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
        {option.value === value && <span className="select-check" aria-hidden="true">✓</span>}
      </button>)}
    </div>}
  </div>;
}
