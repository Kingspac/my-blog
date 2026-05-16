import { useEffect, useState, useCallback, useRef, useContext } from "react";
import { useMusic } from "../MusicContext";
import { UserContext } from "../UserContext";
import { useNavigate } from "react-router-dom";
import s from "../styles/MusicPlayer.module.css";

// ─── Icons ────────────────────────────────────────────────────────────────────
const PlayIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M8 5v14l11-7z"/></svg>;
const PauseIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const PrevIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>;
const NextIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>;
const BackIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;
const ListIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>;
const CloseIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;
const SortIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/></svg>;
const NoteIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40" opacity="0.35"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>;
const PlayedIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M8 5v14l11-7z"/></svg>;

// Heart icon — fill controlled by prop
const HeartSVG = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

// Small filled heart for stats chip
const HeartChip = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

function fmt(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const ss = Math.floor(sec % 60);
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

const SORT_OPTIONS = ["newest", "oldest", "most liked", "most played"];

export default function MusicPlayer() {
  const {
    tracks, setTracks,
    currentIndex, currentTrack,
    isPlaying, togglePlay, next, prev, play,
    currentTime, duration, seek,
    getCoverUrl, setIsMiniPlayer,
    backendUrl,
  } = useMusic();

  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();

  const [loading, setLoading]               = useState(true);
  const [sort, setSort]                     = useState("newest");
  const [showSort, setShowSort]             = useState(false);
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [sidebarClosing, setSidebarClosing] = useState(false);
  const [isLandscape, setIsLandscape]       = useState(
    window.matchMedia("(orientation: landscape)").matches
  );
  const [liking, setLiking]   = useState(false);
  const [toast, setToast]     = useState("");
  const playCountedRef        = useRef(null);

  const isLoggedIn  = !!userInfo?.id;
  const isLikedByMe = currentTrack?.likes?.includes(userInfo?.id);

  // ── Show toast ──────────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // ── Handle like ─────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (!isLoggedIn) {
      showToast("Please log in or register to like music 🎵");
      return;
    }
    if (liking || !currentTrack) return;
    setLiking(true);
    try {
      const res = await fetch(`${backendUrl}/api/music/${currentTrack._id}/like`, {
        method: "PUT",
        credentials: "include",
      });
      const data = await res.json();
      setTracks((prev) =>
        prev.map((t) =>
          t._id === currentTrack._id
            ? {
                ...t,
                likes: data.liked
                  ? [...(t.likes || []), userInfo.id]
                  : (t.likes || []).filter((id) => id !== userInfo.id),
              }
            : t
        )
      );
    } catch {
      showToast("Something went wrong. Try again.");
    } finally {
      setLiking(false);
    }
  };

  useEffect(() => {
    setIsMiniPlayer(false);
    return () => setIsMiniPlayer(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    const h = (e) => setIsLandscape(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    fetch(`${backendUrl}/api/music?category=music`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { setTracks(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Increment play count once per track per session
  useEffect(() => {
    if (!currentTrack) return;
    if (playCountedRef.current === currentTrack._id) return;
    playCountedRef.current = currentTrack._id;
    fetch(`${backendUrl}/api/music/${currentTrack._id}/play`, {
      method: "PUT",
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        setTracks((prev) =>
          prev.map((t) =>
            t._id === currentTrack._id ? { ...t, playCount: data.playCount } : t
          )
        );
      })
      .catch(() => {});
  }, [currentTrack?._id]);

  const closeSidebar = () => {
    setSidebarClosing(true);
    setTimeout(() => { setSidebarOpen(false); setSidebarClosing(false); }, 240);
  };

  const displayed = useCallback(() => {
    const t = [...tracks];
    if (sort === "newest")      return t.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === "oldest")      return t.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sort === "most liked")  return t.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    if (sort === "most played") return t.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    return t;
  }, [tracks, sort])();

  const progress = duration ? (currentTime / duration) * 100 : 0;

  // ── Track list ────────────────────────────────────────────────────────────
  const TrackList = () => (
    <div className={s.trackList}>
      {displayed.map((track) => {
        const realIndex = tracks.indexOf(track);
        const active = realIndex === currentIndex;
        return (
          <button
            key={track._id}
            className={`${s.trackItem} ${active ? s.trackItemActive : ""}`}
            onClick={() => { play(realIndex); if (!isLandscape) closeSidebar(); }}
          >
            <div className={s.trackThumb}>
              {track.coverPhoto
                ? <img src={getCoverUrl(track.coverPhoto)} alt="" className={s.thumbImg} />
                : <div className={s.thumbPlaceholder}><NoteIcon /></div>}
            </div>
            <div className={s.trackMeta}>
              <span className={s.trackItemTitle}>{track.title}</span>
              <span className={s.trackItemArtist}>{track.artist || "Unknown Artist"}</span>
            </div>
            <div className={s.trackItemStats}>
              <span className={s.trackStatChip}>♥ {track.likes?.length || 0}</span>
              <span className={s.trackStatChip}>▶ {track.playCount || 0}</span>
            </div>
            {active && isPlaying && <div className={s.playingDot} />}
          </button>
        );
      })}
    </div>
  );

  // ── Sidebar header ────────────────────────────────────────────────────────
  const SidebarHeader = ({ onClose }) => (
    <div className={s.sidebarHeader}>
      <span className={s.sidebarTitle}>All Tracks</span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <button className={s.sortBtn} onClick={() => setShowSort((v) => !v)}>
            <SortIcon />
          </button>
          {showSort && (
            <div className={s.sortDropdown}>
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o}
                  className={`${s.sortOption} ${sort === o ? s.sortOptionActive : ""}`}
                  onClick={() => { setSort(o); setShowSort(false); }}
                >
                  {o}
                </button>
              ))}
            </div>
          )}
        </div>
        {onClose && (
          <button className={s.sortBtn} onClick={onClose}><CloseIcon /></button>
        )}
      </div>
    </div>
  );

  if (loading) return (
    <div className={s.loadingScreen}>
      <div className={s.loadingSpinner} />
      <p className={s.loadingText}>Loading music...</p>
    </div>
  );

  if (!tracks.length) return (
    <div className={s.loadingScreen}>
      <NoteIcon />
      <p className={s.loadingText}>No music uploaded yet</p>
    </div>
  );

  // ── LANDSCAPE ─────────────────────────────────────────────────────────────
  if (isLandscape) {
    return (
      <div className={s.landscapeRoot}>
        <div className={s.lsSidebar}>
          <SidebarHeader />
          <TrackList />
        </div>
        <div className={s.landscapePlayer}>
          <button className={s.backBtn} onClick={() => navigate(-1)}><BackIcon /></button>
          {currentTrack && (
            <>
              <div className={s.lsCover}>
                {currentTrack.coverPhoto
                  ? <img src={getCoverUrl(currentTrack.coverPhoto)} alt="cover" className={s.lsCoverImg} />
                  : <div className={s.lsCoverPlaceholder}><NoteIcon /></div>}
              </div>
              <div className={s.lsInfo}>
                <h2 className={s.lsTitle}>{currentTrack.title}</h2>
                <p className={s.lsArtist}>{currentTrack.artist || "Unknown Artist"}</p>
              </div>
              {/* Stats + like button */}
              {toast && <div className={s.toast}>{toast}</div>}
              <div className={s.lsStats}>
                <button
                  className={`${s.likeBtn} ${isLikedByMe ? s.likeBtnActive : ""}`}
                  onClick={handleLike}
                  disabled={liking}
                >
                  <HeartSVG filled={isLikedByMe} />
                  {currentTrack.likes?.length || 0}
                </button>
                <span className={`${s.statBadge} ${s.statPlays}`}>
                  <PlayedIcon /> {currentTrack.playCount || 0} plays
                </span>
              </div>
              <div className={s.lsProgressWrap}>
                <span className={s.timeLbl}>{fmt(currentTime)}</span>
                <input type="range" min="0" max={duration || 0} value={currentTime}
                  onChange={(e) => seek(Number(e.target.value))} className={s.slider} />
                <span className={s.timeLbl}>{fmt(duration)}</span>
              </div>
              <div className={s.controls}>
                <button className={s.ctrlBtn} onClick={prev}><PrevIcon /></button>
                <button className={s.playBtn} onClick={togglePlay}>
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button className={s.ctrlBtn} onClick={next}><NextIcon /></button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── PORTRAIT ──────────────────────────────────────────────────────────────
  return (
    <div className={s.portraitRoot}>
      {currentTrack?.coverPhoto && (
        <div className={s.bgBlur}
          style={{ backgroundImage: `url(${getCoverUrl(currentTrack.coverPhoto)})` }} />
      )}
      <div className={s.bgOverlay} />

      {/* Toast */}
      {toast && <div className={s.toast}>{toast}</div>}

      {/* Sliding sidebar */}
      {sidebarOpen && (
        <>
          <div className={s.sidebarOverlay} onClick={closeSidebar} />
          <div className={`${s.sidebar} ${sidebarClosing ? s.sidebarClosing : ""}`}>
            <SidebarHeader onClose={closeSidebar} />
            <TrackList />
          </div>
        </>
      )}

      {/* Header */}
      <div className={s.portraitHeader}>
        <button className={s.backBtn} onClick={() => navigate(-1)}><BackIcon /></button>
        <span className={s.headerLabel}>Now Playing</span>
        <button className={s.listToggleBtn} onClick={() => setSidebarOpen(true)}>
          <ListIcon />
        </button>
      </div>

      {/* Cover */}
      <div className={s.coverWrap}>
        {currentTrack?.coverPhoto
          ? <img src={getCoverUrl(currentTrack.coverPhoto)} alt="cover" className={s.coverImg} />
          : <div className={s.coverPlaceholder}><NoteIcon /></div>}
      </div>

      {/* Info */}
      <div className={s.infoRow}>
        <h1 className={s.trackTitle}>{currentTrack?.title || "—"}</h1>
        <p className={s.trackArtist}>{currentTrack?.artist || "Unknown Artist"}</p>
      </div>

      {/* Stats + like button */}
      <div className={s.statsRow}>
        <button
          className={`${s.likeBtn} ${isLikedByMe ? s.likeBtnActive : ""}`}
          onClick={handleLike}
          disabled={liking}
        >
          <HeartSVG filled={isLikedByMe} />
          {currentTrack?.likes?.length || 0} likes
        </button>
        <span className={`${s.statBadge} ${s.statPlays}`}>
          <PlayedIcon /> {currentTrack?.playCount || 0} plays
        </span>
      </div>

      {/* Progress */}
      <div className={s.progressWrap}>
        <div className={s.progressBg}>
          <div className={s.progressFill} style={{ width: `${progress}%` }} />
          <input type="range" min="0" max={duration || 0} value={currentTime}
            onChange={(e) => seek(Number(e.target.value))} className={s.progressInput} />
        </div>
        <div className={s.timeRow}>
          <span className={s.timeLbl}>{fmt(currentTime)}</span>
          <span className={s.timeLbl}>{fmt(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className={s.controls}>
        <button className={s.ctrlBtn} onClick={prev}><PrevIcon /></button>
        <button className={s.playBtn} onClick={togglePlay}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button className={s.ctrlBtn} onClick={next}><NextIcon /></button>
      </div>
    </div>
  );
}
