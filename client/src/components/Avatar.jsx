/**
 * Circular avatar: shows profile image or initial letter.
 * Use everywhere we display the user (header, login, profile preview, etc.).
 * Props: src (image URL or data URL), name (for initial fallback), size (px), className
 */
import { useState } from "react";

export default function Avatar({ src, name, size = 40, className = "" }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = src && !imgFailed;
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const circleStyle = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    border: "2px solid var(--border, #334155)",
    background: "var(--bg-card, #1e293b)",
    color: "var(--primary, #6366f1)",
    fontSize: size ? Math.round(size * 0.45) : 18,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <span className={className} style={{ position: "relative", display: "inline-block" }}>
      {showImg ? (
        <img
          src={src}
          alt=""
          style={{ ...circleStyle, padding: 0 }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span style={circleStyle} aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}
