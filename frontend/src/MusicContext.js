import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

const MusicContext = createContext({});

export function MusicProvider({ children }) {
  const [tracks, setTracks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false); // show mini bar when navigated away
  const [hasStarted, setHasStarted] = useState(false); // whether user has played anything
  const audioRef = useRef(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

  const currentTrack = tracks[currentIndex] || null;

  // Build full audio URL
  const getAudioUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${backendUrl}/${path}`;
    console.log(path);
  };

  const getCoverUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${backendUrl}/${path}`;
  };

  // Load track when index changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    const url = getAudioUrl(currentTrack.audioFile);
    if (!url) return;
    audioRef.current.src = url;
    audioRef.current.load();
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentIndex, tracks]);

  // Play/pause sync
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const play = useCallback((index) => {
    setCurrentIndex(index);
    setIsPlaying(true);
    setHasStarted(true);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

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
