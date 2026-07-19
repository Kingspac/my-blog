import styles from "./styles/Spinner.module.css";

// ===== SPINNER VARIANTS =====
// <Spinner />                  → full page centered spinner (for page loads)
// <Spinner inline />           → small inline spinner (for buttons)
// <Spinner text="Uploading..." /> → spinner with custom message
// <Spinner overlay />          → dark overlay spinner (for uploads)

export default function Spinner({ inline, overlay, text }) {

  // Inline — tiny spinner inside a button
  if (inline) {
    return <span className={styles.inlineSpinner} aria-label="Loading..." />;
  }

  // Overlay — covers full screen with dark bg (for uploads)
  if (overlay) {
    return (
      <div className={styles.overlayWrapper}>
        <div className={styles.overlayBox}>
          <div className={styles.ring}>
            <div /><div /><div /><div />
          </div>
          {text && <p className={styles.overlayText}>{text}</p>}
        </div>
      </div>
    );
  }

  // Default — full page centered (for page fetches)
  return (
    <div className={styles.pageSpinner}>
      <div className={styles.ring}>
        <div /><div /><div /><div />
      </div>
      {text && <p className={styles.spinnerText}>{text}</p>}
    </div>
  );
}
