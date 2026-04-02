import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { FileText, LogOut, User, Zap, PenTool, Search, Sparkles } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Generate', icon: Sparkles },
  { to: '/cover-letter', label: 'Cover Letter', icon: PenTool },
  { to: '/ats-analyzer', label: 'ATS Score', icon: Search },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-ink-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="font-display text-xl text-ink-800">ResumeAI</span>
              </Link>

              {/* Nav tabs */}
              <div className="hidden sm:flex items-center gap-1">
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
                  const isActive = location.pathname === to;
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-ink-100 text-ink-900'
                          : 'text-ink-500 hover:text-ink-700 hover:bg-ink-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user?.subscriptionStatus === 'active' ? (
                <span className="tag !bg-success/10 !text-success !border-success/20">
                  <Zap className="w-3 h-3" /> Pro
                </span>
              ) : (
                <span className="tag">Free</span>
              )}

              {user && (
                <div className="flex items-center gap-2">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-ink-200 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-ink-500" />
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-md hover:bg-ink-100 text-ink-400 hover:text-ink-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile nav */}
          <div className="sm:hidden flex items-center gap-1 pb-2 overflow-x-auto">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-ink-100 text-ink-900'
                      : 'text-ink-500 hover:text-ink-700'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
