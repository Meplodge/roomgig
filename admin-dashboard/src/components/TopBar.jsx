import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, Moon, Search, Sun, UserCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Avatar } from './ui';
import { titleCase } from '../lib/format';

/** Global search: matches users, listings and booking references. */
const GlobalSearch = () => {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const { data } = useQuery({
    queryKey: ['global-search', term],
    queryFn: async () => {
      const [users, properties] = await Promise.all([
        api.get('/api/users', { q: term, pageSize: 5 }),
        api.get('/api/properties', { q: term, pageSize: 5 }),
      ]);
      return { users: users.data, properties: properties.data };
    },
    enabled: term.trim().length >= 2,
    retry: false,
  });

  const go = (path) => {
    setTerm('');
    setOpen(false);
    navigate(path);
  };

  const hasResults = data && (data.users?.length || data.properties?.length);

  return (
    <div className="search-box menu-wrap">
      <Search size={15} />
      <input
        ref={inputRef}
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search users, listings, bookings..."
        aria-label="Global search"
      />
      <span className="kbd-hint">Ctrl K</span>

      {open && term.trim().length >= 2 && (
        <div className="menu" style={{ left: 0, right: 0, maxHeight: 380, overflowY: 'auto' }}>
          {!hasResults && <div className="menu-item muted">No matches</div>}
          {data?.users?.length > 0 && (
            <>
              <div className="micro-label" style={{ padding: '6px 12px' }}>
                Users
              </div>
              {data.users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="menu-item"
                  onMouseDown={() => go(`/users/${user.id}`)}
                >
                  <Avatar url={user.avatar_url} name={user.full_name} email={user.email} size={24} />
                  <span className="col grow" style={{ minWidth: 0 }}>
                    <span className="truncate">{user.full_name || 'Unnamed'}</span>
                    <span className="tiny muted truncate">{user.email}</span>
                  </span>
                </button>
              ))}
            </>
          )}
          {data?.properties?.length > 0 && (
            <>
              <div className="micro-label" style={{ padding: '6px 12px' }}>
                Listings
              </div>
              {data.properties.map((property) => (
                <button
                  key={property.id}
                  type="button"
                  className="menu-item"
                  onMouseDown={() => go(`/properties/${property.id}`)}
                >
                  <span className="col grow" style={{ minWidth: 0 }}>
                    <span className="truncate">{property.title}</span>
                    <span className="tiny muted truncate">
                      {property.city || 'Unknown city'} - {property.status}
                    </span>
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const TopBar = () => {
  const { theme, toggle } = useTheme();
  const { admin, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { data: notifications } = useQuery({
    queryKey: ['notification-alerts'],
    queryFn: () => api.get('/api/notifications', { failed: 'true', pageSize: 1 }),
    refetchInterval: 120_000,
    retry: false,
  });
  const hasAlerts = (notifications?.count || 0) > 0;

  return (
    <header className="topbar">
      <GlobalSearch />

      <div className="topbar-actions">
        <button
          type="button"
          className="icon-button"
          onClick={toggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button
          type="button"
          className="icon-button"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
          title={hasAlerts ? 'Push delivery failures need attention' : 'Notifications'}
        >
          <Bell size={17} />
          {hasAlerts && <span className="dot" />}
        </button>

        <div className="menu-wrap">
          <button
            type="button"
            className="icon-button avatar-button"
            onClick={() => setMenuOpen((o) => !o)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
            aria-label="Account menu"
          >
            <Avatar name={admin?.full_name} email={admin?.email} size={34} />
          </button>

          {menuOpen && (
            <div className="menu">
              <div className="menu-header">
                <div style={{ fontWeight: 600 }}>{admin?.full_name || 'Administrator'}</div>
                <div className="tiny muted">{admin?.email}</div>
                <div className="tiny" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  {titleCase(admin?.role)}
                </div>
              </div>
              <button
                type="button"
                className="menu-item"
                onMouseDown={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
              >
                <UserCircle size={16} /> Settings
              </button>
              <button type="button" className="menu-item danger" onMouseDown={signOut}>
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
