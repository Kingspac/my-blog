import { useMusic } from "../MusicContext";
import { useNavigate } from "react-router-dom";

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);
const NextIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

const GOLD = "#f59e0b";
const DARK2 = "#161618";
const DARK3 = "#1e1e21";
const TEXT = "#f0ede6";
const TEXT_DIM = "rgba(240,237,230,0.5)";

export default function MiniPlayer() {
  const {
    currentTrack, isPlaying, togglePlay, next,
    currentTime, duration, isMiniPlayer, hasStarted,
    setHasStarted, setIsPlaying, getCoverUrl,
  } = useMusic();

  const navigate = useNavigate();

  // Only show when: user has started playing AND is navigated away from /music
  if (!hasStarted || !isMiniPlayer || !currentTrack) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div style={styles.root}>
      {/* thin progress line at top */}
      <div style={styles.progressLine}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      <div style={styles.inner}>
        {/* Cover */}
        <div style={styles.thumb} onClick={() => navigate("/music")}>
          {currentTrack.coverPhoto
            ? <img src={getCoverUrl(currentTrack.coverPhoto)} alt="" style={styles.thumbImg} />
            : <div style={styles.thumbPlaceholder} />}
        </div>

        {/* Info */}
        <div style={styles.info} onClick={() => navigate("/music")}>
          <span style={styles.title}>{currentTrack.title}</span>
          <span style={styles.artist}>{currentTrack.artist || "Unknown Artist"}</span>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <button style={styles.btn} onClick={togglePlay}>
            <div style={styles.playIcon}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </div>
          </button>
          <button style={styles.btn} onClick={next}>
            <div style={styles.nextIcon}>
              <NextIcon />
            </div>
          </button>
          <button
            style={styles.closeBtn}
            onClick={() => {
              setIsPlaying(false);
              setHasStarted(false);
            }}
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    position: "fixed",
    bottom: 60, // above the nav bar
    left: 0, right: 0, zIndex: 999,
    background: DARK2,
    borderTop: "1px solid rgba(245,158,11,0.12)",
    borderBottom: "1px solid rgba(245,158,11,0.06)",
    boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
  },
  progressLine: {
    height: 2, background: "rgba(245,158,11,0.15)", position: "relative",
  },
  progressFill: {
    position: "absolute", left: 0, top: 0, height: "100%",
    background: `linear-gradient(90deg, ${GOLD}, #fbbf24)`,
    transition: "width 0.1s linear",
  },
  inner: {
    display: "flex", alignItems: "center", padding: "8px 12px", gap: 10,
  },
  thumb: {
    width: 44, height: 44, borderRadius: 8, overflow: "hidden",
    background: DARK3, flexShrink: 0, cursor: "pointer",
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  thumbPlaceholder: { width: "100%", height: "100%", background: DARK3 },
  info: {
    flex: 1, overflow: "hidden", cursor: "pointer",
  },
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
    display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
  },
  btn: {
    background: "none", border: "none", cursor: "pointer",
    padding: 8, borderRadius: "50%", display: "flex",
  },
  playIcon: { width: 24, height: 24, color: GOLD },
  nextIcon: { width: 20, height: 20, color: TEXT_DIM },
  closeBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: 8, color: TEXT_DIM, display: "flex", alignItems: "center",
  },
};
