import { useEffect, useState, useCallback } from "react";
import { useMusic } from "../MusicContext";
import { useNavigate } from "react-router-dom";

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
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
const PrevIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
  </svg>
);
const NextIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
);
const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" width="100%" height="100%">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const SortIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />
  </svg>
);
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
  </svg>
);
const MusicNoteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40" opacity="0.4">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
  </svg>
);

// ─── Format time ─────────────────────────────────────────────────────────────
function fmt(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = ["newest", "oldest", "most liked"];

export default function MusicPlayer() {
  const {
    tracks, setTracks,
    currentIndex, currentTrack,
    isPlaying, togglePlay, next, prev, play,
    currentTime, duration, seek,
    getCoverUrl, setIsMiniPlayer,
    backendUrl,
  } = useMusic();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [showSort, setShowSort] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isLandscape, setIsLandscape] = useState(window.matchMedia("(orientation: landscape)").matches);

  // Show mini player only when navigating away from this page
  useEffect(() => {
    setIsMiniPlayer(false);
    return () => setIsMiniPlayer(true);
  }, []);

  // Orientation detection
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    const handler = (e) => setIsLandscape(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Fetch music tracks
  useEffect(() => {
    console.log("🎵 Fetching from:", `${backendUrl}/api/music?category=music`);
    fetch(`${backendUrl}/api/music?category=music`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        console.log("🎵 Music data received:", data);
        setTracks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("🎵 Fetch error:", err);
        setLoading(false);
      });
  }, []);

  // Sort tracks
  const sortedTracks = useCallback(() => {
    const t = [...tracks];
    if (sort === "newest") return t.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === "oldest") return t.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sort === "most liked") return t.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    return t;
  }, [tracks, sort]);

  const displayed = sortedTracks();

  const progress = duration ? (currentTime / duration) * 100 : 0;

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Loading music...</p>
      </div>
    );
  }

  if (!tracks.length) {
    return (
      <div style={styles.loadingScreen}>
        <MusicNoteIcon />
        <p style={styles.loadingText}>No music uploaded yet</p>
      </div>
    );
  }

  // ── LANDSCAPE LAYOUT ─────────────────────────────────────────────────────
  if (isLandscape) {
    return (
      <div style={styles.landscapeRoot}>
        {/* Left sidebar - track list */}
        <div style={styles.sidebar}>
          {/* Sort button */}
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>Tracks</span>
            <button style={styles.sortBtn} onClick={() => setShowSort((s) => !s)}>
              <SortIcon />
            </button>
          </div>
          {showSort && (
            <div style={styles.sortDropdown}>
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o}
                  style={{ ...styles.sortOption, ...(sort === o ? styles.sortOptionActive : {}) }}
                  onClick={() => { setSort(o); setShowSort(false); }}
                >
                  {o}
                </button>
              ))}
            </div>
          )}
          <div style={styles.trackList}>
            {displayed.map((track, i) => {
              const realIndex = tracks.indexOf(track);
              const active = realIndex === currentIndex;
              return (
                <button
                  key={track._id}
                  style={{ ...styles.trackItem, ...(active ? styles.trackItemActive : {}) }}
                  onClick={() => play(realIndex)}
                >
                  <div style={styles.trackThumb}>
                    {track.coverPhoto
                      ? <img src={getCoverUrl(track.coverPhoto)} alt="" style={styles.thumbImg} />
                      : <div style={styles.thumbPlaceholder}><MusicNoteIcon /></div>}
                  </div>
                  <div style={styles.trackMeta}>
                    <span style={styles.trackItemTitle}>{track.title}</span>
                    <span style={styles.trackItemArtist}>{track.artist || "Unknown Artist"}</span>
                  </div>
                  {active && isPlaying && <div style={styles.playingDot} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right - player */}
        <div style={styles.landscapePlayer}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            <BackIcon />
          </button>
          {currentTrack && (
            <>
              <div style={styles.lsCover}>
                {currentTrack.coverPhoto
                  ? <img src={getCoverUrl(currentTrack.coverPhoto)} alt="cover" style={styles.lsCoverImg} />
                  : <div style={styles.lsCoverPlaceholder}><MusicNoteIcon /></div>}
              </div>
              <div style={styles.lsInfo}>
                <h2 style={styles.lsTitle}>{currentTrack.title}</h2>
                <p style={styles.lsArtist}>{currentTrack.artist || "Unknown Artist"}</p>
              </div>
              {/* Progress */}
              <div style={styles.lsProgressWrap}>
                <span style={styles.timeLbl}>{fmt(currentTime)}</span>
                <input
                  type="range" min="0" max={duration || 0} value={currentTime}
                  onChange={(e) => seek(Number(e.target.value))}
                  style={styles.slider}
                />
                <span style={styles.timeLbl}>{fmt(duration)}</span>
              </div>
              {/* Controls */}
              <div style={styles.controls}>
                <button style={styles.ctrlBtn} onClick={prev}><PrevIcon /></button>
                <button style={styles.playBtn} onClick={togglePlay}>
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button style={styles.ctrlBtn} onClick={next}><NextIcon /></button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── PORTRAIT LAYOUT (Full-screen Spotify style) ───────────────────────────
  return (
    <div style={styles.portraitRoot}>
      {/* Background blurred cover */}
      {currentTrack?.coverPhoto && (
        <div
          style={{
            ...styles.bgBlur,
            backgroundImage: `url(${getCoverUrl(currentTrack.coverPhoto)})`,
          }}
        />
      )}
      <div style={styles.bgOverlay} />

      {/* Header */}
      <div style={styles.portraitHeader}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <BackIcon />
        </button>
        <span style={styles.headerLabel}>NOW PLAYING</span>
        <button style={styles.likeHeaderBtn} onClick={() => setLiked((l) => !l)}>
          <div style={{ width: 24, height: 24, color: liked ? "#f59e0b" : "rgba(255,255,255,0.5)" }}>
            <HeartIcon filled={liked} />
          </div>
        </button>
      </div>

      {/* Cover art */}
      <div style={styles.coverWrap}>
        {currentTrack?.coverPhoto
          ? <img src={getCoverUrl(currentTrack.coverPhoto)} alt="cover" style={styles.coverImg} />
          : <div style={styles.coverPlaceholder}><MusicNoteIcon /></div>}
      </div>

      {/* Track info */}
      <div style={styles.infoRow}>
        <div>
          <h1 style={styles.trackTitle}>{currentTrack?.title || "—"}</h1>
          <p style={styles.trackArtist}>{currentTrack?.artist || "Unknown Artist"}</p>
        </div>
        <span style={styles.likesCount}>♥ {currentTrack?.likes?.length || 0}</span>
      </div>

      {/* Progress bar */}
      <div style={styles.progressWrap}>
        <div style={styles.progressBg}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          <input
            type="range" min="0" max={duration || 0} value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            style={styles.progressInput}
          />
        </div>
        <div style={styles.timeRow}>
          <span style={styles.timeLbl}>{fmt(currentTime)}</span>
          <span style={styles.timeLbl}>{fmt(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <button style={styles.ctrlBtn} onClick={prev}><PrevIcon /></button>
        <button style={styles.playBtn} onClick={togglePlay}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button style={styles.ctrlBtn} onClick={next}><NextIcon /></button>
      </div>

      {/* Track list at bottom */}
      <div style={styles.portraitList}>
        <div style={styles.portraitListHeader}>
          <span style={styles.sidebarTitle}>Up Next</span>
          <div style={{ position: "relative" }}>
            <button style={styles.sortBtn} onClick={() => setShowSort((s) => !s)}>
              <SortIcon />
            </button>
            {showSort && (
              <div style={{ ...styles.sortDropdown, right: 0, left: "auto" }}>
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o}
                    style={{ ...styles.sortOption, ...(sort === o ? styles.sortOptionActive : {}) }}
                    onClick={() => { setSort(o); setShowSort(false); }}
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {displayed.map((track) => {
          const realIndex = tracks.indexOf(track);
          const active = realIndex === currentIndex;
          return (
            <button
              key={track._id}
              style={{ ...styles.trackItem, ...(active ? styles.trackItemActive : {}) }}
              onClick={() => play(realIndex)}
            >
              <div style={styles.trackThumb}>
                {track.coverPhoto
                  ? <img src={getCoverUrl(track.coverPhoto)} alt="" style={styles.thumbImg} />
                  : <div style={styles.thumbPlaceholder}><MusicNoteIcon /></div>}
              </div>
              <div style={styles.trackMeta}>
                <span style={styles.trackItemTitle}>{track.title}</span>
                <span style={styles.trackItemArtist}>{track.artist || "Unknown Artist"}</span>
              </div>
              {active && isPlaying && <div style={styles.playingDot} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const GOLD = "#f59e0b";
const GOLD_DIM = "rgba(245,158,11,0.15)";
const DARK = "#0d0d0f";
const DARK2 = "#161618";
const DARK3 = "#1e1e21";
const TEXT = "#f0ede6";
const TEXT_DIM = "rgba(240,237,230,0.5)";

const styles = {
  // Loading
  loadingScreen: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", height: "100vh", background: DARK,
    gap: 16,
  },
  loadingSpinner: {
    width: 40, height: 40, borderRadius: "50%",
    border: `3px solid ${GOLD_DIM}`, borderTopColor: GOLD,
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { color: TEXT_DIM, fontFamily: "'Nunito', sans-serif", fontSize: 15 },

  // ── Portrait root
  portraitRoot: {
    minHeight: "100vh", background: DARK, display: "flex",
    flexDirection: "column", overflowY: "auto", overflowX: "hidden",
    position: "relative", paddingBottom: 80,
  },
  bgBlur: {
    position: "fixed", inset: 0, backgroundSize: "cover", backgroundPosition: "center",
    filter: "blur(60px) saturate(1.4)", opacity: 0.25, zIndex: 0, transform: "scale(1.2)",
  },
  bgOverlay: {
    position: "fixed", inset: 0, zIndex: 1,
    background: "linear-gradient(to bottom, rgba(13,13,15,0.5) 0%, rgba(13,13,15,0.85) 60%, rgba(13,13,15,1) 100%)",
  },
  portraitHeader: {
    position: "relative", zIndex: 10,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "52px 20px 12px",
  },
  headerLabel: {
    fontFamily: "'Nunito', sans-serif", fontSize: 11, letterSpacing: 3,
    color: TEXT_DIM, fontWeight: 700, textTransform: "uppercase",
  },
  likeHeaderBtn: { background: "none", border: "none", cursor: "pointer", padding: 4 },
  backBtn: {
    background: "none", border: "none", color: TEXT, cursor: "pointer",
    padding: 4, display: "flex", alignItems: "center",
  },
  coverWrap: {
    position: "relative", zIndex: 10,
    margin: "20px auto", width: "72vw", maxWidth: 300,
    aspectRatio: "1/1", borderRadius: 20,
    boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,158,11,0.1)",
    overflow: "hidden",
  },
  coverImg: { width: "100%", height: "100%", objectFit: "cover" },
  coverPlaceholder: {
    width: "100%", height: "100%", background: DARK3,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  infoRow: {
    position: "relative", zIndex: 10,
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    padding: "0 24px", marginTop: 8,
  },
  trackTitle: {
    fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 22,
    color: TEXT, margin: 0, lineHeight: 1.2,
  },
  trackArtist: {
    fontFamily: "'Nunito', sans-serif", fontSize: 14, color: TEXT_DIM, margin: "4px 0 0",
  },
  likesCount: {
    fontFamily: "'Nunito', sans-serif", fontSize: 13, color: GOLD, marginTop: 4,
  },
  progressWrap: {
    position: "relative", zIndex: 10, padding: "20px 24px 4px",
  },
  progressBg: {
    position: "relative", height: 4, borderRadius: 4,
    background: "rgba(255,255,255,0.1)", overflow: "visible",
  },
  progressFill: {
    position: "absolute", left: 0, top: 0, height: "100%",
    background: `linear-gradient(90deg, ${GOLD}, #fbbf24)`,
    borderRadius: 4, transition: "width 0.1s linear", pointerEvents: "none",
  },
  progressInput: {
    position: "absolute", inset: "-8px 0", width: "100%", height: 20,
    opacity: 0, cursor: "pointer", margin: 0,
  },
  timeRow: {
    display: "flex", justifyContent: "space-between", marginTop: 8,
  },
  timeLbl: {
    fontFamily: "'Nunito', sans-serif", fontSize: 11, color: TEXT_DIM,
  },
  // Controls
  controls: {
    position: "relative", zIndex: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 28, padding: "16px 24px",
  },
  ctrlBtn: {
    width: 44, height: 44, background: "none", border: "none",
    color: TEXT, cursor: "pointer", padding: 10,
    borderRadius: "50%", transition: "background 0.2s",
  },
  playBtn: {
    width: 64, height: 64, borderRadius: "50%", border: "none", cursor: "pointer",
    background: `linear-gradient(135deg, ${GOLD}, #d97706)`,
    color: DARK, padding: 16,
    boxShadow: `0 8px 24px rgba(245,158,11,0.4)`,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "transform 0.1s, box-shadow 0.1s",
  },

  // Portrait track list
  portraitList: {
    position: "relative", zIndex: 10, padding: "8px 0 16px",
  },
  portraitListHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 20px 8px", position: "relative",
  },

  // ── Landscape root
  landscapeRoot: {
    display: "flex", height: "100vh", background: DARK, overflow: "hidden",
  },
  sidebar: {
    width: "38%", maxWidth: 220, background: DARK2, display: "flex",
    flexDirection: "column", borderRight: `1px solid rgba(245,158,11,0.08)`,
    overflow: "hidden",
  },
  sidebarHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "48px 16px 12px",
    borderBottom: `1px solid rgba(245,158,11,0.08)`,
  },
  sidebarTitle: {
    fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13,
    letterSpacing: 2, color: GOLD, textTransform: "uppercase",
  },
  sortBtn: {
    background: "none", border: "none", color: TEXT_DIM, cursor: "pointer",
    padding: 6, borderRadius: 8, display: "flex", alignItems: "center",
    transition: "color 0.2s",
  },
  sortDropdown: {
    position: "absolute", top: "100%", left: 12, zIndex: 50,
    background: DARK3, borderRadius: 10, overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)", border: `1px solid rgba(245,158,11,0.12)`,
    minWidth: 140,
  },
  sortOption: {
    display: "block", width: "100%", padding: "10px 14px", textAlign: "left",
    background: "none", border: "none", color: TEXT_DIM, cursor: "pointer",
    fontFamily: "'Nunito', sans-serif", fontSize: 13, textTransform: "capitalize",
    transition: "background 0.15s, color 0.15s",
  },
  sortOptionActive: { color: GOLD, background: GOLD_DIM },
  trackList: { flex: 1, overflowY: "auto", padding: "8px 0" },
  trackItem: {
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", background: "none", border: "none",
    padding: "10px 14px", cursor: "pointer", textAlign: "left",
    transition: "background 0.15s", borderRadius: 0,
  },
  trackItemActive: { background: GOLD_DIM },
  trackThumb: {
    width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0,
    background: DARK3,
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  thumbPlaceholder: {
    width: "100%", height: "100%", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
  trackMeta: { flex: 1, overflow: "hidden" },
  trackItemTitle: {
    display: "block", fontFamily: "'Nunito', sans-serif", fontWeight: 700,
    fontSize: 13, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  trackItemArtist: {
    display: "block", fontFamily: "'Nunito', sans-serif", fontSize: 11,
    color: TEXT_DIM, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  playingDot: {
    width: 6, height: 6, borderRadius: "50%", background: GOLD, flexShrink: 0,
    animation: "pulse 1s ease-in-out infinite",
  },

  // Landscape player right side
  landscapePlayer: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "16px 24px", position: "relative",
    gap: 10,
  },
  lsCover: {
    width: "min(30vh, 160px)", height: "min(30vh, 160px)",
    borderRadius: 16, overflow: "hidden",
    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
    background: DARK3, flexShrink: 0,
  },
  lsCoverImg: { width: "100%", height: "100%", objectFit: "cover" },
  lsCoverPlaceholder: {
    width: "100%", height: "100%", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
  lsInfo: { textAlign: "center" },
  lsTitle: {
    fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 18,
    color: TEXT, margin: 0,
  },
  lsArtist: {
    fontFamily: "'Nunito', sans-serif", fontSize: 13, color: TEXT_DIM, margin: "4px 0 0",
  },
  lsProgressWrap: {
    display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 360,
  },
  slider: { flex: 1, accentColor: GOLD, cursor: "pointer", height: 4 },
};
