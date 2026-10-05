import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApi } from '../hooks/useApi';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Notification, ListResponse } from '../types';
import { formatDate } from '../utils/format';
export function Notifications() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const { data, reload } = useApi<ListResponse<Notification> & { unreadCount?: number }>(
    user ? '/notifications' : null,
    { pageSize: 30 },
  );
  const items = data?.items || [];
  const unread = data?.unreadCount ?? items.filter((item) => !item.isRead).length;
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(reload, 45000);
    return () => clearInterval(timer);
  }, [user, reload]);
  useEffect(() => {
    const handle = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, []);
  async function read(item: Notification) {
    if (item.isRead) return;
    try {
      await api.put(`/notifications/${item.id}/read`);
      reload();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }
  return (
    <div className="notification-control" ref={root}>
      <button
        className="icon-btn notification-bell"
        aria-label={`Хабарламалар${unread ? `: ${unread} оқылмаған` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Bell size={20} />
        {unread > 0 && <span className="notification-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <section className="notification-panel" aria-label="Хабарламалар">
          <div className="notification-panel-head">
            <strong>Хабарламалар</strong>
            <button className="icon-btn" aria-label="Жабу" onClick={() => setOpen(false)}>
              <X size={17} />
            </button>
          </div>
          {items.length ? (
            items.map((item) => (
              <div key={item.id} className={`notification-item ${!item.isRead ? 'unread' : ''}`}>
                <button
                  className="notification-read"
                  aria-label="Оқылды деп белгілеу"
                  onClick={() => void read(item)}
                >
                  <CheckCheck size={16} />
                </button>
                {item.link ? (
                  <Link
                    to={item.link}
                    onClick={() => {
                      void read(item);
                      setOpen(false);
                    }}
                  >
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                  </Link>
                ) : (
                  <button className="notification-text" onClick={() => void read(item)}>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                  </button>
                )}
                <small>{formatDate(item.createdAt, { day: 'numeric', month: 'short' })}</small>
              </div>
            ))
          ) : (
            <p className="notification-empty">
              Жаңа хабарлама жоқ. Барлық жаңалық осы жерде пайда болады.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
