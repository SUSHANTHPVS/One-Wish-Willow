import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, UserRound } from 'lucide-react';
import { apiGetProfile, type UserProfile } from '../api';

interface UserMenuProps {
  username: string;
  token: string;
  onLogout: () => void;
}

export default function UserMenu({ username, token, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [picture, setPicture] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const lastFirst = useRef(false);
  const menuId = useId();
  const tooltipId = useId();

  useEffect(() => {
    let disposed = false;
    let changed = false;
    setPicture(null);
    const onProfileChange = (event: Event) => {
      changed = true;
      const profile = (event as CustomEvent<UserProfile>).detail;
      if (profile) setPicture(profile.profilePicture);
    };
    window.addEventListener('one-wish-profile-changed', onProfileChange);
    void apiGetProfile(token).then(profile => {
      if (!disposed && !changed) setPicture(profile.profilePicture);
    }).catch(() => {});
    return () => {
      disposed = true;
      window.removeEventListener('one-wish-profile-changed', onProfileChange);
    };
  }, [token]);

  useEffect(() => {
    if (!open) return;
    const items = menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    items?.[lastFirst.current ? items.length - 1 : 0]?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  return (
    <div className="user-menu" ref={container}>
      <button
        className="user-avatar-button"
        type="button"
        ref={trigger}
        aria-label="Open user navigation menu"
        aria-describedby={open ? undefined : tooltipId}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => { lastFirst.current = false; setOpen(current => !current); }}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            lastFirst.current = event.key === 'ArrowUp';
            setOpen(true);
          } else if (event.key === 'Escape') close();
        }}
      >
        {picture ? <img src={picture} alt="" onError={() => setPicture(null)} /> : <span aria-hidden="true">{username.trim().charAt(0).toUpperCase() || 'U'}</span>}
      </button>
      {!open && <span className="user-menu-tooltip" id={tooltipId} role="tooltip">Open user navigation menu</span>}
      {open && (
        <div
          className="user-menu-popup"
          ref={menu}
          id={menuId}
          role="menu"
          aria-label="User navigation"
          onKeyDown={event => {
            const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') || []);
            const index = items.indexOf(document.activeElement as HTMLElement);
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
              event.preventDefault();
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
              items[next]?.focus();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              close();
            } else if (event.key === 'Tab') close();
          }}
        >
          <Link to="/profile" role="menuitem" tabIndex={-1} onClick={close}><UserRound size={18} aria-hidden="true" />Profile</Link>
          <button type="button" role="menuitem" tabIndex={-1} onClick={() => { setOpen(false); onLogout(); }}><LogOut size={18} aria-hidden="true" />Logout</button>
        </div>
      )}
    </div>
  );
}