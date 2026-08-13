import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  Bell,
  BarChart3,
  Building2,
  CalendarCheck,
  ChevronDown,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  MessagesSquare,
  PanelLeft,
  ScrollText,
  Settings,
  ShieldCheck,
  Star,
  Users,
  UsersRound,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatNumber } from '../lib/format';

const NavRow = ({ to, icon: Icon, label, badge, badgeTone, collapsed }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    title={collapsed ? label : undefined}
  >
    <Icon size={17} strokeWidth={2} />
    {!collapsed && (
      <>
        <span className="nav-item-label">{label}</span>
        {badge ? <span className={`nav-badge ${badgeTone || ''}`}>{badge}</span> : null}
      </>
    )}
  </NavLink>
);

const StatusCard = () => {
  const { data } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => api.get('/api/settings/system/health'),
    refetchInterval: 60_000,
    retry: false,
  });

  const checks = data?.data;
  const dot = (check) => {
    if (!check) return '';
    if (check.ok === null) return 'warn';
    return check.ok ? 'ok' : 'bad';
  };

  return (
    <div className="status-card">
      <span className="micro-label">System status</span>
      <div className="status-row">
        <span className={`status-dot ${dot(checks?.database)}`} />
        Database
        <span className="tiny muted" style={{ marginLeft: 'auto' }}>
          {checks?.database?.latency_ms != null ? `${checks.database.latency_ms}ms` : '--'}
        </span>
      </div>
      <div className="status-row">
        <span className={`status-dot ${dot(checks?.email)}`} />
        Email service
        <span className="tiny muted" style={{ marginLeft: 'auto' }}>
          {checks?.email?.message || '--'}
        </span>
      </div>
      <div className="status-row">
        <span className={`status-dot ${dot(checks?.push)}`} />
        Push delivery
        <span className="tiny muted" style={{ marginLeft: 'auto' }}>
          {checks?.push?.message || '--'}
        </span>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [opsOpen, setOpsOpen] = useState(true);
  const { can } = useAuth();

  // Badge count for the moderation queue.
  const { data: queue } = useQuery({
    queryKey: ['moderation-queue-count'],
    queryFn: () => api.get('/api/properties/moderation-queue'),
    refetchInterval: 120_000,
    retry: false,
  });
  const queueCount = queue?.count || 0;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <span className="sidebar-logo">R</span>
        {!collapsed && <span className="sidebar-wordmark">RoomGig</span>}
        <button
          type="button"
          className="sidebar-collapse"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft size={17} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavRow to="/" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
        <NavRow to="/users" icon={Users} label="Users" collapsed={collapsed} />
        <NavRow to="/properties" icon={Building2} label="Properties" collapsed={collapsed} />
        <NavRow
          to="/roommate-listings"
          icon={UsersRound}
          label="Roommate Listings"
          collapsed={collapsed}
        />
        <NavRow
          to="/moderation"
          icon={ShieldCheck}
          label="Moderation"
          badge={queueCount ? formatNumber(queueCount) : null}
          badgeTone="alert"
          collapsed={collapsed}
        />

        {!collapsed && (
          <div className="sidebar-section">
            <button
              type="button"
              className="nav-item nav-group-toggle"
              onClick={() => setOpsOpen((o) => !o)}
            >
              <CalendarCheck size={17} strokeWidth={2} />
              <span className="nav-item-label">Operations</span>
              <ChevronDown
                size={15}
                style={{
                  transform: opsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 160ms ease',
                }}
              />
            </button>
          </div>
        )}
        {(opsOpen || collapsed) && (
          <div className={collapsed ? '' : 'nav-sub'}>
            <NavRow to="/bookings" icon={CalendarCheck} label="Bookings" collapsed={collapsed} />
            <NavRow to="/payments" icon={CreditCard} label="Payments" collapsed={collapsed} />
            <NavRow to="/reviews" icon={Star} label="Reviews" collapsed={collapsed} />
            <NavRow
              to="/messaging"
              icon={MessagesSquare}
              label="Messaging"
              collapsed={collapsed}
            />
            <NavRow to="/notifications" icon={Bell} label="Notifications" collapsed={collapsed} />
          </div>
        )}

        <div style={{ marginTop: 'var(--space-2)' }} />
        <NavRow to="/analytics" icon={BarChart3} label="Analytics" collapsed={collapsed} />
        {can('super_admin') && (
          <NavRow to="/admins" icon={BadgeCheck} label="Admins" collapsed={collapsed} />
        )}
        {can('super_admin', 'admin') && (
          <NavRow to="/audit-log" icon={ScrollText} label="Audit Log" collapsed={collapsed} />
        )}
      </nav>

      <div className="sidebar-footer">
        <NavRow to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
        <a
          className="nav-item"
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noreferrer"
          title={collapsed ? 'Help & Support' : undefined}
        >
          <HelpCircle size={17} strokeWidth={2} />
          {!collapsed && <span className="nav-item-label">Help &amp; Support</span>}
        </a>
      </div>

      {!collapsed && <StatusCard />}
    </aside>
  );
};

export default Sidebar;
