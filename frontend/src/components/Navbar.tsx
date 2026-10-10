import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  LayoutDashboard, 
  FileText, 
  GitCompare, 
  Calendar, 
  Mic, 
  TrendingUp, 
  BookOpen, 
  LogOut, 
  Settings,
  Menu,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isHome = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-slate-900 leading-none">
                Prep<span className="text-indigo-600">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                Interview Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {!isAuthenticated ? (
              <>
                <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
                  Features
                </a>
                <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
                  How It Works
                </a>
                <Link to="/mock-interview/setup" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
                  Mock Interview
                </Link>
                <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
                  Pricing
                </a>
                <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
                  FAQ
                </a>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 text-sm font-medium transition ${
                    location.pathname === '/dashboard' ? 'text-indigo-600 font-semibold' : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  to="/profile-job"
                  className={`flex items-center gap-1.5 text-sm font-medium transition ${
                    location.pathname === '/profile-job' ? 'text-indigo-600 font-semibold' : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Resume & JD
                </Link>
                <Link
                  to="/skill-gap"
                  className={`flex items-center gap-1.5 text-sm font-medium transition ${
                    location.pathname === '/skill-gap' ? 'text-indigo-600 font-semibold' : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                  Skill Gap
                </Link>
                <Link
                  to="/plan"
                  className={`flex items-center gap-1.5 text-sm font-medium transition ${
                    location.pathname === '/plan' ? 'text-indigo-600 font-semibold' : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Prep Plan
                </Link>
                <Link
                  to="/mock-interview/setup"
                  className={`flex items-center gap-1.5 text-sm font-medium transition ${
                    location.pathname.startsWith('/mock-interview') ? 'text-indigo-600 font-semibold' : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  Mock Interview
                </Link>
                <Link
                  to="/rag"
                  className={`flex items-center gap-1.5 text-sm font-medium transition ${
                    location.pathname === '/rag' ? 'text-indigo-600 font-semibold' : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Knowledge
                </Link>
                <Link
                  to="/progress"
                  className={`flex items-center gap-1.5 text-sm font-medium transition ${
                    location.pathname === '/progress' ? 'text-indigo-600 font-semibold' : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Progress
                </Link>
              </>
            )}
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/settings"
                  className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                  title="System Status & Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-semibold text-slate-900">{user?.full_name || user?.email}</div>
                  <div className="text-[11px] text-slate-500">{user?.target_role || 'Candidate'}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg hover:border-rose-200 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          {!isAuthenticated ? (
            <>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-700">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-700">How It Works</a>
              <Link to="/mock-interview/setup" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-700">Mock Interview</Link>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-700">Pricing</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-700">FAQ</a>
              <div className="pt-2 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg">Sign In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg">Get Started</Link>
              </div>
            </>
          ) : (
            <>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-700">Dashboard</Link>
              <Link to="/profile-job" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-700">Resume & Job</Link>
              <Link to="/skill-gap" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-700">Skill Gap</Link>
              <Link to="/plan" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-700">Preparation Plan</Link>
              <Link to="/mock-interview/setup" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-700">Mock Interview</Link>
              <Link to="/rag" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-700">Knowledge Base</Link>
              <Link to="/progress" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-700">Progress</Link>
              <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-700">Settings</Link>
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left py-2 text-sm font-medium text-rose-600">Sign Out</button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
