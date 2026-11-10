import { useState, useEffect } from "react";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";

function photoUrl(photo) {
  const clean = String(photo).replace(/\\/g, "/");
  return /^https?:\/\//i.test(clean) ? clean : `${apiUrl}/${clean}`;
}

// The photo comes with the data from the server, so nothing extra is fetched.
//   <Avatar user={post.author} />                      (object with username + profilePhoto)
//   <Avatar username={c.username} photo={c.profilePhoto} size={22} />
// No photo (or it fails to load) -> first letter of the username.
export default function Avatar({ user, username, photo, size = 40, className = "", style }) {
  const [broken, setBroken] = useState(false);

  const uname = username || user?.username;
  const src = photo || user?.profilePhoto || "";

  // a new photo gets a fresh chance to load
  useEffect(() => {
    setBroken(false);
  }, [src]);

  const letter = (uname || "?").charAt(0).toUpperCase();
  const small = size < 30;

  return (
    <div
      className={`fb-avatar${small ? " avatar-sm" : ""} ${className}`.trim()}
      title={uname || undefined}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        display: "inline-flex",
        verticalAlign: "middle",
        ...style,
      }}
    >
      {src && !broken ? (
        <img
          src={photoUrl(src)}
          alt={uname || "profile"}
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        letter
      )}
    </div>
  );
}
