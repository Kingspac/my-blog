const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";

// Works for Cloudinary URLs and for any old local paths
export function mediaUrl(p) {
  if (!p) return "";
  const clean = String(p).replace(/\\/g, "/");
  return /^https?:\/\//i.test(clean) ? clean : `${apiUrl}/${clean}`;
}
