import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

const MusicContext = createContext({});

export function MusicProvider({ children }) {
  const [tracks, setTracks]         = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]     = useState(0);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioRef      = useRef(null);
  const playCountedRef = useRef(null); // tracks which song was already counted

  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

  const currentTrack = tracks[currentIndex] || null;

  // ── URL helpers ────────────────────────────────────────────────────────────
  const getAudioUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${backendUrl}/${path}`;
  };

  const getCoverUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${backendUrl}/${path}`;
  };

  // ── Increment play count (only when user actually plays) ──────────────────
  const incrementPlayCount = useCallback((track) => {
  if (!track) return;

  // check localStorage for already-played tracks
  const played = JSON.parse(localStorage.getItem("enchwra_played") || "[]");
  if (played.includes(track._id)) return; // already counted this track for this user

  // save to localStorage so it persists across sessions
  localStorage.setItem("enchwra_played", JSON.stringify([...played, track._id]));

  fetch(`${backendUrl}/api/music/${track._id}/play`, {
    method: "PUT",
    credentials: "include",
  })
    .then((r) => r.json())
    .then((data) => {
      setTracks((prev) =>
        prev.map((t) =>
          t._id === track._id ? { ...t, playCount: data.playCount } : t
        )
      );
    })
    .catch(() => {});
}, [backendUrl]);

  // ── Load audio when track changes ─────────────────────────────────────────
  useEffect(() => {
  if (!audioRef.current || !currentTrack) return;
  const url = getAudioUrl(currentTrack.audioFile);
  if (!url) return;
  audioRef.current.src = url;
  audioRef.current.load();
  // if already playing (e.g. next/prev), play immediately after load
  if (isPlaying) {
    audioRef.current.addEventListener("canplay", () => {
      audioRef.current.play().catch(() => {});
    }, { once: true });
  }
}, [currentIndex, tracks]);

  // ── Sync play/pause with audio element ────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // ── play — called when user clicks a track in the list ────────────────────
  const play = useCallback((index) => {
    const track = tracks[index];
    setCurrentIndex(index);
    setIsPlaying(true);
    setHasStarted(true);
    incrementPlayCount(track); // count only on explicit play
  }, [tracks, incrementPlayCount]);

  // ── togglePlay — play/pause button ────────────────────────────────────────
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const newPlaying = !prev;
      if (newPlaying && currentTrack) {
        incrementPlayCount(currentTrack); // count only when starting to play
      }
      return newPlaying;
    });
    setHasStarted(true);
  }, [currentTrack, incrementPlayCount]);

  // ── next / prev ───────────────────────────────────────────────────────────
  const next = useCallback(() => {
    setCurrentIndex((i) => {
      const nextIndex = (i + 1) % tracks.length;
      incrementPlayCount(tracks[nextIndex]);
      return nextIndex;
    });
    setIsPlaying(true);
  }, [tracks, incrementPlayCount]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => {
      const prevIndex = (i - 1 + tracks.length) % tracks.length;
      incrementPlayCount(tracks[prevIndex]);
      return prevIndex;
    });
    setIsPlaying(true);
  }, [tracks, incrementPlayCount]);

  // ── seek ──────────────────────────────────────────────────────────────────
  const seek = useCallback((val) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = val;
    setCurrentTime(val);
  }, []);

  return (
    <MusicContext.Provider
      value={{
        tracks, setTracks,
        currentIndex, setCurrentIndex,
        isPlaying, setIsPlaying,
        currentTime, setCurrentTime,
        duration, setDuration,
        isMiniPlayer, setIsMiniPlayer,
        hasStarted, setHasStarted,
        currentTrack,
        play, togglePlay, next, prev, seek,
        getAudioUrl, getCoverUrl,
        audioRef,
        backendUrl,
      }}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={next}
      />
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  return useContext(MusicContext);
}
