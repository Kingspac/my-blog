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

const BUBBLE_SIZE  = 56;
const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 10;
const DOUBLE_TAP_MS = 280;

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export default function MiniPlayer() {
  const {
    currentTrack, isPlaying, togglePlay, next,
    currentTime, duration, isMiniPlayer, hasStarted,
    setHasStarted, setIsPlaying, getCoverUrl,
  } = useMusic();

  const navigate = useNavigate();

  // ── Bar (swipe) state ───────────────────────────────────────────────────
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [visible, setVisible]       = useState(true);

  const touchStartX  = useRef(null);
  const touchStartY  = useRef(null);
  const touchStartTime = useRef(null);
  const currentY     = useRef(0);
  const isDraggingRef = useRef(false);

  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);

  // ── Bubble (move) mode state ────────────────────────────────────────────
  const [mode, setMode] = useState("bar"); // 'bar' | 'bubble'
  const [bubblePos, setBubblePos] = useState(() => ({
    x: typeof window !== "undefined" ? window.innerWidth - BUBBLE_SIZE - 16 : 16,
    y: typeof window !== "undefined" ? window.innerHeight - BUBBLE_SIZE - 140 : 140,
  }));
  const [isBubbleDragging, setIsBubbleDragging] = useState(false);

  const bubbleTouchStart = useRef({ x: 0, y: 0 });
  const bubbleDragStart  = useRef({ x: 0, y: 0 });
  const bubbleMoved      = useRef(false);
  const tapTimerRef      = useRef(null);

  if (!hasStarted || !isMiniPlayer || !currentTrack || !visible) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  // ── Bar touch handlers (swipe + long-press to enter bubble mode) ───────
  const onTouchStart = (e) => {
    if (e.target.closest("[data-controls]")) return;
    const t = e.touches[0];
    touchStartY.current    = t.clientY;
    touchStartX.current    = t.clientX;
    touchStartTime.current = Date.now();
    currentY.current       = 0;
    isDraggingRef.current  = true;
    longPressTriggeredRef.current = false;
    setIsDragging(true);

    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      longPressTriggeredRef.current = true;
      isDraggingRef.current = false;
      setIsDragging(false);
      setTranslateY(0);
      if (navigator.vibrate) navigator.vibrate(15);

      const cx = touchStartX.current;
      const cy = touchStartY.current;
      setBubblePos({
        x: clamp(cx - BUBBLE_SIZE / 2, 8, window.innerWidth - BUBBLE_SIZE - 8),
        y: clamp(cy - BUBBLE_SIZE / 2, 8, window.innerHeight - BUBBLE_SIZE - 8),
      });
      setMode("bubble");
    }, LONG_PRESS_MS);
  };

  const onTouchMove = (e) => {
    if (longPressTriggeredRef.current) return;
    if (!isDraggingRef.current || touchStartY.current === null) return;
    e.preventDefault(); // stops browser scroll/navigation

    const t = e.touches[0];
    const delta  = t.clientY - touchStartY.current;
    const deltaX = t.clientX - touchStartX.current;

    // cancel the long-press if this turns into a real swipe
    if (longPressTimerRef.current && (Math.abs(delta) > MOVE_CANCEL_PX || Math.abs(deltaX) > MOVE_CANCEL_PX)) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    currentY.current = delta;
    const clamped = delta < 0
      ? Math.max(delta, -100)
      : Math.min(delta, 100);
    setTranslateY(clamped * 0.6);
  };

  const onTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressTriggeredRef.current) {
      // bubble mode already engaged by the timer — nothing more to do
      longPressTriggeredRef.current = false;
      touchStartY.current = null;
      return;
    }
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

  // ── Bubble touch handlers (free drag + tap / double-tap) ───────────────
  const onBubbleTouchStart = (e) => {
    const t = e.touches[0];
    bubbleTouchStart.current = { x: t.clientX, y: t.clientY };
    bubbleDragStart.current  = { x: bubblePos.x, y: bubblePos.y };
    bubbleMoved.current = false;
    setIsBubbleDragging(true);
  };

  const onBubbleTouchMove = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - bubbleTouchStart.current.x;
    const dy = t.clientY - bubbleTouchStart.current.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) bubbleMoved.current = true;

    setBubblePos({
      x: clamp(bubbleDragStart.current.x + dx, 8, window.innerWidth - BUBBLE_SIZE - 8),
      y: clamp(bubbleDragStart.current.y + dy, 8, window.innerHeight - BUBBLE_SIZE - 8),
    });
  };

  const onBubbleTouchEnd = () => {
    setIsBubbleDragging(false);
    if (bubbleMoved.current) return; // was a drag, not a tap

    if (tapTimerRef.current) {
      // second tap within the window → double-tap: back to bar
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
      setMode("bar");
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapTimerRef.current = null;
        navigate("/music");
      }, DOUBLE_TAP_MS);
    }
  };

  // ── Bubble mode render ───────────────────────────────────────────────────
  if (mode === "bubble") {
    return (
      <AnimatePresence>
        <motion.div
          key="mini-player-bubble"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.18 }}
          onTouchStart={onBubbleTouchStart}
          onTouchMove={onBubbleTouchMove}
          onTouchEnd={onBubbleTouchEnd}
          style={{
            position: "fixed",
            left: bubblePos.x,
            top: bubblePos.y,
            width: BUBBLE_SIZE,
            height: BUBBLE_SIZE,
            borderRadius: "50%",
            overflow: "hidden",
            zIndex: 1000,
            background: DARK2,
            border: `2px solid ${GOLD}`,
            boxShadow: isBubbleDragging
              ? "0 8px 28px rgba(0,0,0,0.6)"
              : "0 4px 16px rgba(0,0,0,0.45)",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {currentTrack.coverPhoto
            ? <img
                src={getCoverUrl(currentTrack.coverPhoto)}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
                draggable={false}
              />
            : <div style={{ width: "100%", height: "100%", background: DARK3 }} />}

          {/* play/pause indicator overlay */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.28)", pointerEvents: "none",
          }}>
            <div style={{ width: 18, height: 18, color: "#fff" }}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </div>
          </div>

          {/* thin progress ring at the bottom */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
            background: "rgba(245,158,11,0.2)", pointerEvents: "none",
          }}>
            <div style={{ height: "100%", width: `${progress}%`, background: GOLD }} />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Bar mode render (unchanged behavior, plus long-press) ──────────────
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
        opacity: Math.max(0, 1 - Math.abs(translateY) / 120),
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
         "↕ drag to open/close · hold to move"}
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