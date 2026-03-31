// Inside your MediaCard component...
const { playTrack, currentTrack, isPlaying: globalIsPlaying } = useContext(MusicContext);

// Check if THIS specific card is the one currently playing in the global player
const isThisPlaying = currentTrack?.url === `${apiUrl}/${item.audioFile}`;

/**
 * handleMusicClick: This replaces the old local play/pause logic.
 * It sends the item's data up to the MusicContext.
 */
function handleMusicClick() {
  playTrack({
    id: item._id,
    title: item.title,
    artist: item.artist || item.uploadedBy?.username,
    // We use the environment variable 'apiUrl' so it works on Render and Localhost
    url: `${apiUrl}/${item.audioFile}`,
    cover: item.coverPhoto ? `${apiUrl}/${item.coverPhoto}` : null
  });
}

// In your JSX (Render):
{item.category === "music" && (
  <button onClick={handleMusicClick} className="tiktok-btn">
    {/* Change icon based on whether this specific song is playing */}
    <span>{isThisPlaying && globalIsPlaying ? "⏸️" : "▶️"}</span>
  </button>
)}
