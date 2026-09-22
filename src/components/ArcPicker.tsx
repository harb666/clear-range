import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

export interface ArcPickerOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface Props {
  options: ArcPickerOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

const ITEM_GAP = 108;

/**
 * A dial/arc-style picker for a small set of categorical options: items fan
 * out from a centred, highlighted selection, draggable (mouse/touch),
 * keyboard-navigable, and click-to-select. Used where a plain <select>
 * would work but a more tactile control fits the brand better.
 *
 * Drag tracking deliberately does NOT use setPointerCapture: capturing the
 * pointer on the container retargets the browser's synthesized "click"
 * event to the capturing element too, which silently breaks click-to-select
 * on the chip buttons underneath. A window-level listener, live only while
 * actually dragging, tracks movement just as reliably without that side effect.
 */
export function ArcPicker({ options, value, onChange, ariaLabel }: Props) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const movedRef = useRef(false);
  const dragXRef = useRef(0);

  const goTo = (index: number) => {
    const clamped = Math.min(Math.max(index, 0), options.length - 1);
    onChange(options[clamped].value);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    startXRef.current = e.clientX;
    movedRef.current = false;
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => {
      const delta = e.clientX - startXRef.current;
      if (Math.abs(delta) > 4) movedRef.current = true;
      dragXRef.current = delta;
      setDragX(delta);
    };
    const onUp = () => {
      setDragging(false);
      const threshold = ITEM_GAP / 3;
      if (dragXRef.current > threshold) goTo(selectedIndex - 1);
      else if (dragXRef.current < -threshold) goTo(selectedIndex + 1);
      dragXRef.current = 0;
      setDragX(0);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, selectedIndex]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(selectedIndex - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(selectedIndex + 1);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Previous option"
          onClick={() => goTo(selectedIndex - 1)}
          disabled={selectedIndex === 0}
          className="arc-nav-btn"
        >
          ‹
        </button>

        <div
          className="relative h-36 flex-1 touch-pan-y select-none overflow-hidden outline-none"
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={0}
        >
          {options.map((opt, i) => {
            const offset = i - selectedIndex + dragX / ITEM_GAP;
            const abs = Math.abs(offset);
            const translateX = offset * ITEM_GAP;
            const scale = Math.max(0.6, 1 - abs * 0.18);
            const rotate = offset * 9;
            const translateY = abs * 16;
            const opacity = Math.max(0, 1 - abs * 0.4);
            const isSelected = i === selectedIndex && Math.abs(dragX) < 4;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  if (!movedRef.current) goTo(i);
                }}
                className={`arc-chip ${isSelected ? "arc-chip-selected" : ""}`}
                style={{
                  transform: `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                  opacity,
                  zIndex: 100 - Math.round(abs * 10),
                  transition: dragging ? "none" : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease, box-shadow 200ms ease",
                  pointerEvents: abs > 2.4 ? "none" : "auto",
                }}
              >
                <span className="block text-sm font-medium">{opt.label}</span>
                {opt.sublabel && <span className="mt-0.5 block text-[11px] opacity-80">{opt.sublabel}</span>}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Next option"
          onClick={() => goTo(selectedIndex + 1)}
          disabled={selectedIndex === options.length - 1}
          className="arc-nav-btn"
        >
          ›
        </button>
      </div>

      <div className="mt-2 flex justify-center gap-1.5">
        {options.map((opt, i) => (
          <button
            key={opt.value}
            type="button"
            aria-label={`Go to ${opt.label}`}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full ${i === selectedIndex ? "w-5 bg-[var(--brand)]" : "w-1.5 bg-[var(--border-strong)]"}`}
          />
        ))}
      </div>
    </div>
  );
}
