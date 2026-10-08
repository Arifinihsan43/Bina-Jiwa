import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Smile, 
  Users, 
  MessageSquare, 
  Search, 
  CalendarCheck,
  Calendar, 
  AlertCircle, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  User
} from 'lucide-react';
import BinaJiwaLogo from '../../common/BinaJiwaLogo';

export default function DashboardSidebar({
  isOpen = true,
  onToggleSidebar,
  onCloseSidebar,
  activeMenu = 'dashboard',
  user,
  onLogout,
  onOpenCrisis,
  onOpenSettings,
}) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard / Overview', icon: LayoutDashboard },
    { id: 'mood', label: 'Mood & Refleksi', icon: Smile },
    { id: 'komunitas', label: 'Komunitas', icon: Users },
    { id: 'pesan', label: 'Pesan', icon: MessageSquare },
    { id: 'psikolog', label: 'Cari Psikolog', icon: Search },
    { id: 'janji-temu', label: 'Janji Temu', icon: CalendarCheck },
    { id: 'events', label: 'Events & Workshop', icon: Calendar },
  ];

  if (user?.role === 'doctor') {
    navItems.push({ id: 'profil-praktik', label: 'Profil Praktik', icon: Stethoscope });
  }

  const handleNavClick = (itemId) => {
    const targetPath = itemId === 'dashboard' ? '/dashboard' : `/${itemId}`;
    navigate(targetPath);
    if (typeof window !== 'undefined' && window.innerWidth <= 768 && onCloseSidebar) {
      onCloseSidebar();
    }
  };

  return (
    <aside className={`db-sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Floating Border Toggle Button */}
      <button
        type="button"
        className="db-sidebar-collapse-toggle"
        onClick={onToggleSidebar}
        title={isOpen ? 'Tutup Sidebar' : 'Buka Sidebar'}
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Brand Header */}
      <div className="db-sidebar-brand">
        <Link to="/" className="db-brand-link" title="Bina Jiwa - Ruang Pulih & Diri">
          <div className="db-brand-icon">
            <BinaJiwaLogo size={32} />
          </div>
          <div className="db-brand-text">
            <span className="db-brand-title">Bina Jiwa</span>
            <span className="db-brand-sub">Ruang Pulih &amp; Diri</span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="db-sidebar-nav">
        <div className="db-nav-group">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`db-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                title={!isOpen ? item.label : undefined}
              >
                <Icon size={18} className="db-nav-icon" />
                <span className="db-nav-text">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Menu Items */}
        <div className="db-nav-bottom">
          <button
            type="button"
            className={`db-nav-item db-nav-krisis ${activeMenu === 'krisis' ? 'active' : ''}`}
            onClick={() => {
              navigate('/krisis');
              if (typeof window !== 'undefined' && window.innerWidth <= 768 && onCloseSidebar) onCloseSidebar();
            }}
            title={!isOpen ? 'Bantuan & Krisis' : undefined}
          >
            <AlertCircle size={18} className="db-nav-icon-krisis" />
            <span className="db-nav-text">Bantuan &amp; Krisis</span>
          </button>

          <button
            type="button"
            className={`db-nav-item ${activeMenu === 'pengaturan' ? 'active' : ''}`}
            onClick={() => {
              navigate('/pengaturan');
              if (typeof window !== 'undefined' && window.innerWidth <= 768 && onCloseSidebar) onCloseSidebar();
            }}
            title={!isOpen ? 'Pengaturan' : undefined}
          >
            <Settings size={18} className="db-nav-icon" />
            <span className="db-nav-text">Pengaturan</span>
          </button>
        </div>
      </nav>

      {/* User Profile Card */}
      <div className="db-user-card" title={!isOpen ? (user?.name || 'Pengguna') : undefined}>
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user?.name || 'User Profile'}
            className="db-user-avatar"
          />
        ) : (
          <div className="db-user-avatar db-user-avatar-placeholder" title={user?.name || 'Pengguna'}>
            <User size={20} />
          </div>
        )}
        <div className="db-user-info">
          <span className="db-user-name">{user?.name || 'Pengguna'}</span>
          <span className="db-user-status">
            <span className="db-status-dot"></span>
            <span>{user?.status || 'Sesi Aktif'}</span>
          </span>
        </div>
        <button
          type="button"
          className="db-logout-btn"
          onClick={handleLogoutClick}
          title="Keluar"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

