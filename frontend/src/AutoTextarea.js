import { useRef, useLayoutEffect } from "react";

// Grows with its text up to maxHeight, then scrolls inside.
// Extra props (placeholder, onChange, onKeyDown, className...) pass straight through.
export default function AutoTextarea({ value, maxHeight = 120, style, ...props }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const border = el.offsetHeight - el.clientHeight;
    const full = el.scrollHeight + border;
    el.style.height = Math.min(full, maxHeight) + "px";
    el.style.overflowY = full > maxHeight ? "auto" : "hidden";
  }, [value, maxHeight]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      {...props}
      style={{
        flex: 1,
        minWidth: 0,
        margin: 0,
        boxSizing: "border-box",
        resize: "none",
        lineHeight: 1.4,
        fontFamily: "inherit",
        fontSize: "inherit",
        padding: "8px 12px",
        border: "1px solid #ddd",
        borderRadius: 10,
        maxHeight,
        ...style,
      }}
    />
  );
}
