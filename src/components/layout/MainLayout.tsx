import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  Settings,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ── Nav config ─────────────────────────────────────────────────────────────
interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Kontrol Paneli' },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'İşlemler'       },
  { to: '/categories',   icon: Tag,             label: 'Kategoriler'    },
];

const ACCOUNT_ITEMS: NavItem[] = [
  { to: '/settings', icon: Settings, label: 'Ayarlar' },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Kontrol Paneli',
  '/transactions': 'İşlemler',
  '/categories':   'Kategoriler',
  '/settings':     'Ayarlar',
};

// ── Sidebar NavLink ─────────────────────────────────────────────────────────
function SideNavItem({ to, icon: Icon, label, onClick }: NavItem & { onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
    >
      <Icon size={15} strokeWidth={1.75} />
      <span>{label}</span>
    </NavLink>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────
export default function MainLayout() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'GiderTakip';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', backgroundColor: 'var(--color-abyss)' }}>

      {/* ── Sidebar (Desktop) ────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 sticky top-0 h-[100dvh] overflow-y-auto w-[232px]"
        style={{
          backgroundColor: 'var(--color-void)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: '1.375rem 1.25rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {/* Brass diamond mark */}
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(196,151,58,0.25) 0%, rgba(196,151,58,0.08) 100%)',
                border: '1px solid rgba(196,151,58,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ color: 'var(--color-accent)', fontSize: '0.8rem', lineHeight: 1 }}>◆</span>
            </div>
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                GiderTakip
              </p>
              <p style={{ fontSize: '0.5625rem', color: 'var(--color-text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '1px' }}>
                Finans Sistemi
              </p>
            </div>
          </div>
        </div>

        {/* Main navigation */}
        <nav style={{ padding: '1.125rem 0.75rem', flex: 1 }}>
          <p className="section-label" style={{ paddingLeft: '0.875rem', marginBottom: '0.5rem' }}>
            Menü
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {NAV_ITEMS.map((item) => <SideNavItem key={item.to} {...item} />)}
          </div>

          {/* Account separator */}
          <div style={{ margin: '1.25rem 0.875rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }} />
          <p className="section-label" style={{ paddingLeft: '0.875rem', marginBottom: '0.5rem' }}>
            Hesap
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {ACCOUNT_ITEMS.map((item) => <SideNavItem key={item.to} {...item} />)}
          </div>
        </nav>

        {/* Sign out */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              width: '100%',
              padding: '0.625rem 0.9375rem',
              borderRadius: 'var(--radius-md)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-tertiary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8125rem',
              textAlign: 'left',
              letterSpacing: '0.01em',
              transition: 'background-color 140ms ease, color 140ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(192,96,96,0.12)';
              e.currentTarget.style.color = 'var(--color-danger-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-tertiary)';
            }}
          >
            <LogOut size={14} strokeWidth={1.75} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="w-full relative z-10" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header
          className="header-padded"
          style={{
            height: '58px',
            backgroundColor: 'rgba(5,7,10,0.90)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="md:hidden flex items-center justify-center"
              onClick={() => setIsMobileMenuOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer', padding: 0 }}
              aria-label="Menüyü aç"
            >
              <Menu size={20} />
            </button>
            {/* Vertical separator */}
            <div className="hidden md:block" style={{ width: '2px', height: '16px', backgroundColor: 'var(--color-accent)', borderRadius: '1px', opacity: 0.6 }} />
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {pageTitle}
            </h2>
          </div>

          <span className="badge-accent">
            {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
          </span>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 main-content-padded overflow-y-auto w-full">
          <div className="w-full max-w-screen-md lg:max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile Drawer ─────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Sidebar Drawer */}
          <div className="relative w-[280px] max-w-[85vw] bg-[var(--color-void)] h-full flex flex-col border-r border-white/5 shadow-2xl animate-in slide-in-from-left-4 duration-200">
          {/* Drawer Header */}
          <div
            style={{
              padding: '1.25rem',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(196,151,58,0.25) 0%, rgba(196,151,58,0.08) 100%)',
                  border: '1px solid rgba(196,151,58,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ color: 'var(--color-accent)', fontSize: '0.8rem', lineHeight: 1 }}>◆</span>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  GiderTakip
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyItems: 'center',
                width: '32px', height: '32px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-tertiary)',
                cursor: 'pointer',
              }}
              aria-label="Kapat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Navigation */}
          <nav style={{ padding: '1.125rem 0.75rem', flex: 1, overflowY: 'auto' }}>
            <p className="section-label" style={{ paddingLeft: '0.875rem', marginBottom: '0.5rem' }}>
              Menü
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {NAV_ITEMS.map((item) => (
                <SideNavItem key={item.to} {...item} onClick={() => setIsMobileMenuOpen(false)} />
              ))}
            </div>

            <div style={{ margin: '1.25rem 0.875rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }} />
            <p className="section-label" style={{ paddingLeft: '0.875rem', marginBottom: '0.5rem' }}>
              Hesap
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {ACCOUNT_ITEMS.map((item) => (
                <SideNavItem key={item.to} {...item} onClick={() => setIsMobileMenuOpen(false)} />
              ))}
            </div>
          </nav>

          {/* Drawer Footer (Logout) */}
          <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                width: '100%',
                padding: '0.625rem 0.9375rem',
                borderRadius: 'var(--radius-md)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.8125rem',
                textAlign: 'left',
                letterSpacing: '0.01em',
              }}
            >
              <LogOut size={14} strokeWidth={1.75} />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
      )}

    </div>
  );
}
