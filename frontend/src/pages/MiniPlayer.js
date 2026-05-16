import { useRef, useState } from "react";
import { useMusic } from "../MusicContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const PlayIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M8 5v14l11-7z"/></svg>;
const PauseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const NextIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>;
const CloseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;

const GOLD     = "#f59e0b";
const DARK2    = "#161618";
const DARK3    = "#1e1e21";
const TEXT     = "#f0ede6";
const TEXT_DIM = "rgba(240,237,230,0.5)";

export default function MiniPlayer() {
  const {
    currentTrack, isPlaying, togglePlay, next,
    currentTime, duration, isMiniPlayer, hasStarted,
    setHasStarted, setIsPlaying, getCoverUrl,
  } = useMusic();

  const navigate = useNavigate();

  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [visible, setVisible]       = useState(true);

  const touchStartY  = useRef(null);
  const touchStartTime = useRef(null);
  const currentY     = useRef(0);
  const isDraggingRef = useRef(false);

  if (!hasStarted || !isMiniPlayer || !currentTrack || !visible) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  // ── Touch handlers ────────────────────────────────────────────────────────
  const onTouchStart = (e) => {
    // don't drag if touching controls
    if (e.target.closest("[data-controls]")) return;
    touchStartY.current   = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    currentY.current      = 0;
    isDraggingRef.current = true;
    setIsDragging(true);
  };

  const onTouchMove = (e) => {
    if (!isDraggingRef.current || touchStartY.current === null) return;
    e.preventDefault(); // ← this is the key — stops browser scroll/navigation
    const delta = e.touches[0].clientY - touchStartY.current;
    currentY.current = delta;
    // resist extremes with rubber band effect
    const clamped = delta < 0
      ? Math.max(delta, -100)
      : Math.min(delta, 100);
    setTranslateY(clamped * 0.6); // dampen the movement
  };

  const onTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    const delta    = currentY.current;
    const elapsed  = Date.now() - touchStartTime.current;
    const velocity = Math.abs(delta) / elapsed; // px/ms

    if (delta < -40 || velocity > 0.5 && delta < 0) {
      // swiped UP → open full player
      setTranslateY(-120);
      setTimeout(() => {
        setTranslateY(0);
        navigate("/music");
      }, 200);
    } else if (delta > 50 || velocity > 0.5 && delta > 0) {
      // swiped DOWN → dismiss
      setTranslateY(120);
      setTimeout(() => {
        setVisible(false);
        setTranslateY(0);
        setIsPlaying(false);
        setHasStarted(false);
      }, 220);
    } else {
      // snap back
      setTranslateY(0);
    }
    touchStartY.current = null;
  };

  const opacity = Math.max(0, 1 - Math.abs(translateY) / 120);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        position: "fixed",
        bottom: 60,
        left: 0, right: 0,
        zIndex: 999,
        transform: `translateY(${translateY}px)`,
        opacity,
        transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.3s ease",
        background: DARK2,
        borderTop: "1px solid rgba(245,158,11,0.12)",
        borderBottom: "1px solid rgba(245,158,11,0.06)",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Drag handle */}
      <div style={styles.dragHandle}>
        <div style={{
          ...styles.dragPill,
          background: isDragging
            ? "rgba(245,158,11,0.6)"
            : "rgba(245,158,11,0.25)",
          transition: "background 0.2s",
        }} />
      </div>

      {/* Progress line */}
      <div style={styles.progressLine}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* Main row */}
      <div style={styles.inner}>

        {/* Cover */}
        <div style={styles.thumb} onClick={() => navigate("/music")}>
          {currentTrack.coverPhoto
            ? <img
                src={getCoverUrl(currentTrack.coverPhoto)}
                alt=""
                style={styles.thumbImg}
                draggable={false}
              />
            : <div style={styles.thumbPlaceholder} />}
        </div>

        {/* Info */}
        <div style={styles.info} onClick={() => navigate("/music")}>
          <span style={styles.title}>{currentTrack.title}</span>
          <span style={styles.artist}>
            {currentTrack.artist || "Unknown Artist"}
          </span>
        </div>

        {/* Controls */}
        <div data-controls="true" style={styles.controls}>
          <button
            style={styles.btn}
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          >
            <div style={styles.playIcon}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </div>
          </button>

          <button
            style={styles.btn}
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <div style={styles.nextIcon}><NextIcon /></div>
          </button>

          <button
            style={styles.closeBtn}
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(false);
              setHasStarted(false);
            }}
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Hint */}
      <div style={styles.swipeHint}>
        {translateY < -10 ? "↑ release to open" :
         translateY > 10  ? "↓ release to close" :
         "↕ drag to open or close"}
      </div>
    </div>
  );
}

const styles = {
  dragHandle: {
    display: "flex", justifyContent: "center",
    paddingTop: 6, paddingBottom: 2,
  },
  dragPill: {
    width: 38, height: 4, borderRadius: 2,
  },
  progressLine: {
    height: 2, background: "rgba(245,158,11,0.1)",
    position: "relative",
  },
  progressFill: {
    position: "absolute", left: 0, top: 0, height: "100%",
    background: `linear-gradient(90deg, ${GOLD}, #fbbf24)`,
    transition: "width 0.1s linear",
  },
  inner: {
    display: "flex", alignItems: "center",
    padding: "8px 12px", gap: 10,
  },
  thumb: {
    width: 44, height: 44, borderRadius: 8,
    overflow: "hidden", background: DARK3,
    flexShrink: 0, cursor: "pointer",
  },
  thumbImg: {
    width: "100%", height: "100%",
    objectFit: "cover", pointerEvents: "none",
  },
  thumbPlaceholder: { width: "100%", height: "100%", background: DARK3 },
  info: { flex: 1, overflow: "hidden", cursor: "pointer" },
  title: {
    display: "block",
    fontFamily: "'Nunito', sans-serif", fontWeight: 700,
    fontSize: 13, color: TEXT,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  artist: {
    display: "block",
    fontFamily: "'Nunito', sans-serif", fontSize: 11, color: TEXT_DIM,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  controls: {
    display: "flex", alignItems: "center",
    gap: 4, flexShrink: 0,
  },
  btn: {
    background: "none", border: "none",
    cursor: "pointer", padding: 8,
    borderRadius: "50%", display: "flex",
  },
  playIcon: { width: 24, height: 24, color: GOLD },
  nextIcon: { width: 20, height: 20, color: TEXT_DIM },
  closeBtn: {
    background: "none", border: "none",
    cursor: "pointer", padding: 8,
    color: TEXT_DIM, display: "flex", alignItems: "center",
  },
  swipeHint: {
    textAlign: "center",
    fontFamily: "'Nunito', sans-serif",
    fontSize: 10,
    color: "rgba(245,158,11,0.35)",
    paddingBottom: 5,
    letterSpacing: 0.8,
    transition: "color 0.2s",
  },
};
