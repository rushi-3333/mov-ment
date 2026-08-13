import { useState, useEffect, useRef } from "react";

/**
 * Profile icon + dropdown for dashboard header (right corner).
 * Props: userName, profilePictureUrl (optional), onProfile, onSettings, onRefresh, onLogout
 */
export default function ProfileDropdown({ userName, profilePictureUrl, onProfile, onSettings, onRefresh, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const initial = (userName || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="profile-dropdown-wrap" ref={ref}>
      <button
        type="button"
        className="profile-dropdown-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Profile menu"
      >
        {profilePictureUrl ? (
          <img src={profilePictureUrl} alt="" className="profile-dropdown-avatar" />
        ) : (
          <span className="profile-dropdown-initial">{initial}</span>
        )}
      </button>
      {open && (
        <div className="profile-dropdown-menu">
          {onProfile && (
            <button type="button" className="profile-dropdown-item" onClick={() => { setOpen(false); onProfile(); }}>
              Profile
            </button>
          )}
          {onSettings && (
            <button type="button" className="profile-dropdown-item" onClick={() => { setOpen(false); onSettings(); }}>
              Settings
            </button>
          )}
          {onRefresh && (
            <button type="button" className="profile-dropdown-item" onClick={() => { setOpen(false); onRefresh(); }}>
              Refresh
            </button>
          )}
          {onLogout && (
            <button type="button" className="profile-dropdown-item profile-dropdown-item-logout" onClick={() => { setOpen(false); onLogout(); }}>
              Log out
            </button>
          )}
        </div>
      )}
    </div>
  );
}
