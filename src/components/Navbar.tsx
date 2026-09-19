import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { Menu, X, User as UserIcon, LogOut, Settings, ChevronDown, LayoutDashboard } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthModal } from './AuthModal';
import type { UserSession } from './AuthModal';

const navItems = [
  { label: 'HOME', to: '/' },
  { label: 'LEARN', to: '/learn' },
  { label: 'PREPARE', to: '/prepare' },
  { label: 'QUIZ', to: '/quiz' },
  { label: 'GUIDE', to: '/guide' },
  { label: 'CAMPUS', to: '/campus' },
  { label: 'ARCHIVE', to: '/disasters' },
];

export function Navbar() {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('readysphere_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [photo, setPhoto] = useState<string | null>(() => {
    return localStorage.getItem('readysphere_profile_photo_v1') || null;
  });

  // Keep photo in sync with localStorage updates
  useEffect(() => {
    const handleStorageChange = () => {
      setPhoto(localStorage.getItem('readysphere_profile_photo_v1') || null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUser(null);
    setIsDropdownOpen(false);
    localStorage.removeItem('readysphere_user');
    navigate('/');
  };

  const handleSuccessLogin = (userData: UserSession) => {
    setUser(userData);
    localStorage.setItem('readysphere_user', JSON.stringify(userData));
    // Auto-navigate to appropriate portal dashboard
    if (userData.role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/student');
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  useEffect(() => {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;

    gsap.to(menu, {
      autoAlpha: isOpen ? 1 : 0,
      y: isOpen ? 0 : -18,
      duration: 0.25,
      ease: 'power2.out',
      display: isOpen ? 'block' : 'none',
    });
  }, [isOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-5 py-7 md:px-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
          <NavLink to="/" className="text-[17px] font-semibold tracking-tight text-white">
            ReadySphere™
          </NavLink>

          <nav className="hidden items-center justify-center md:flex">
            <div className="liquid-glass flex items-center gap-2 rounded-full px-2 py-1.5">
              {navItems.map(({ label, to }) => (
                <NavLink
                  key={label}
                  to={to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-1.5 text-[11px] font-medium tracking-[0.12em] transition-colors duration-200 ${
                      isActive ? 'bg-white/8 text-white' : 'text-white/90 hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative hidden md:block" ref={dropdownRef}>
                {/* AVATAR / PROFILE DROPDOWN BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="liquid-glass flex items-center gap-2.5 rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wider text-white/90 transition-all hover:border-white/30 hover:text-white"
                >
                  <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-cyan-400/40 bg-cyan-950/60 text-cyan-300">
                    {photo ? (
                      <img src={photo} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[11px] font-bold uppercase">{user.name.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <span>{user.name}</span>
                  <ChevronDown
                    size={13}
                    className={`text-white/60 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* DROPDOWN MENU */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-white/15 bg-[#080d11]/95 p-2 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-150">
                    <div className="border-b border-white/10 px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          user.role === 'teacher' ? 'bg-amber-400/20 text-amber-300' : 'bg-cyan-400/20 text-cyan-300'
                        }`}>
                          {user.role === 'teacher' ? 'Faculty' : 'Student'}
                        </span>
                      </div>
                      <p className="truncate text-[10px] text-white/50 mt-0.5">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate(user.role === 'teacher' ? '/teacher' : '/student');
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <LayoutDashboard size={14} className={user.role === 'teacher' ? 'text-amber-400' : 'text-cyan-400'} />
                        <span>Dashboard</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/profile');
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <UserIcon size={14} className="text-white/70" />
                        <span>Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/profile');
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Settings size={14} className="text-white/60" />
                        <span>Settings</span>
                      </button>
                    </div>

                    <div className="border-t border-white/10 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        <LogOut size={14} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="liquid-glass hidden rounded-full px-5 py-2.5 text-[11px] font-medium tracking-[0.12em] text-white/90 transition-colors hover:text-white md:inline-flex"
              >
                LOGIN / SIGN UP
              </button>
            )}

            <button
              type="button"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              onClick={() => setIsOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white md:hidden"
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        <div id="mobile-menu" className="pointer-events-none fixed inset-x-4 top-[86px] z-50 hidden rounded-[24px] border border-white/10 bg-black/75 p-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map(({ label, to }) => (
              <NavLink
                key={label}
                to={to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-left text-[11px] font-medium tracking-[0.12em] ${
                    isActive ? 'bg-white/8 text-white' : 'text-white/80'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

            {user ? (
              <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/profile');
                  }}
                  className="flex w-full items-center justify-between rounded-full bg-cyan-950/40 px-4 py-2.5 text-[11px] font-medium text-white border border-cyan-400/30"
                >
                  <span className="flex items-center gap-2">
                    <UserIcon size={14} className="text-cyan-400" />
                    <span>{user.name} (Profile)</span>
                  </span>
                  <span className="text-[10px] text-cyan-300">View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 py-2.5 text-[11px] font-medium text-red-400"
                >
                  <LogOut size={13} />
                  <span>LOG OUT</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="liquid-glass mt-2 rounded-full px-4 py-3 text-center text-[11px] font-medium tracking-[0.12em] text-white/90"
              >
                LOGIN / SIGN UP
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessLogin={handleSuccessLogin}
      />
    </>
  );
}


