import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Bell, CalendarClock, Check, CheckCheck, RefreshCw, Trophy, X } from 'lucide-react';
import { apiDismissNotification, apiGetNotifications, apiReadNotification, type AppNotification } from '../api';

export default function NotificationCenter({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    let disposed = false;
    let inFlight = false;
    let queued = false;
    setItems([]);
    setUnreadCount(0);
    setLoading(true);
    setError('');
    async function refresh() {
      if (disposed || document.visibilityState === 'hidden') return;
      if (inFlight) { queued = true; return; }
      inFlight = true;
      setRefreshing(true);
      try {
        const result = await apiGetNotifications(token);
        if (!disposed) {
          setItems(result.items);
          setUnreadCount(result.unreadCount);
          setError('');
        }
      } catch (failure) {
        if (!disposed) setError(failure instanceof Error ? failure.message : 'Unable to load notifications.');
      } finally {
        inFlight = false;
        if (!disposed) {
          setLoading(false);
          setRefreshing(false);
          if (queued) { queued = false; void refresh(); }
        }
      }
    }
    void refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    window.addEventListener('one-wish-data-changed', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('one-wish-data-changed', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [token]);

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);

  function refresh() {
    window.dispatchEvent(new Event('one-wish-data-changed'));
  }

  async function act(action: 'read' | 'dismiss', id?: string) {
    if (pending) return;
    setPending(id || 'all');
    setError('');
    try {
      if (action === 'dismiss' && id) await apiDismissNotification(token, id);
      else await apiReadNotification(token, id);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to update notifications.');
    } finally {
      setPending('');
    }
  }

  const visibleItems = unreadOnly ? items.filter(item => !item.readAt) : items;

  return (
    <>
      <button
        className="notification-bell"
        type="button"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Notifications"
        onClick={() => { setOpen(true); refresh(); }}
      >
        <Bell size={21} aria-hidden="true" />
        {unreadCount > 0 && <span className="notification-badge" aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {createPortal(
        <dialog
          className="notification-dialog"
          ref={dialog}
          aria-labelledby={titleId}
          onClose={() => setOpen(false)}
        >
          <div className="notification-header">
            <div>
              <h2 id={titleId}>Notifications</h2>
              <p>{unreadCount} unread</p>
            </div>
            <button type="button" className="notification-icon-button" title="Close notifications" aria-label="Close notifications" onClick={() => setOpen(false)}>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="notification-toolbar">
            <label><input type="checkbox" checked={unreadOnly} onChange={event => setUnreadOnly(event.target.checked)} /> Unread only</label>
            <div>
              <button type="button" className="notification-icon-button" title="Mark all as read" aria-label="Mark all as read" disabled={!unreadCount || Boolean(pending)} onClick={() => void act('read')}>
                <CheckCheck size={19} aria-hidden="true" />
              </button>
              <button type="button" className="notification-icon-button" title="Refresh notifications" aria-label="Refresh notifications" disabled={refreshing} onClick={refresh}>
                <RefreshCw size={18} aria-hidden="true" className={refreshing ? 'notification-refreshing' : ''} />
              </button>
            </div>
          </div>
          {error && <p className="notification-error" role="alert">{error}</p>}
          <div className="notification-list" aria-busy={loading || Boolean(pending)}>
            {loading ? <p className="notification-empty" role="status">Loading notifications...</p> : visibleItems.length === 0 ? (
              <div className="notification-empty">
                <Bell size={30} aria-hidden="true" />
                <p>{unreadOnly ? 'No unread notifications' : 'No notifications right now'}</p>
              </div>
            ) : visibleItems.map(item => (
              <article key={item._id} className={`notification-item ${item.readAt ? '' : 'is-unread'}`}>
                <span className="notification-kind" aria-hidden="true">{item.kind === 'wish-completed' ? <Trophy size={20} /> : <CalendarClock size={20} />}</span>
                <div className="notification-copy">
                  <Link to={item.href} onClick={() => { if (!item.readAt) void act('read', item._id); setOpen(false); }}>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                  </Link>
                  <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
                </div>
                <div className="notification-item-actions">
                  {!item.readAt && <button type="button" className="notification-icon-button" title="Mark as read" aria-label={`Mark ${item.title} as read`} disabled={Boolean(pending)} onClick={() => void act('read', item._id)}><Check size={17} aria-hidden="true" /></button>}
                  <button type="button" className="notification-icon-button" title="Dismiss notification" aria-label={`Dismiss ${item.title}`} disabled={Boolean(pending)} onClick={() => void act('dismiss', item._id)}><X size={17} aria-hidden="true" /></button>
                </div>
              </article>
            ))}
          </div>
        </dialog>,
        document.body,
      )}
    </>
  );
}