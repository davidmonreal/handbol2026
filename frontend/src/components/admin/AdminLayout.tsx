import { Home, Users, User, Calendar, Trophy, FileText, LayoutDashboard } from 'lucide-react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';

export const AdminLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const showSidebarLanguage = location.pathname === '/';
  const navItems = [
    { path: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { path: '/matches', labelKey: 'nav.matches', icon: FileText },
    { path: '/clubs', labelKey: 'nav.clubs', icon: Trophy },
    { path: '/seasons', labelKey: 'nav.seasons', icon: Calendar },
    { path: '/teams', labelKey: 'nav.teams', icon: Users },
    { path: '/players', labelKey: 'nav.players', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
                <Home size={20} />
                <span className="font-bold text-xl">Handbol 2026</span>
              </Link>
            </div>
            <div className="flex items-center justify-end" />
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon size={20} />
                  {t(item.labelKey)}
                </NavLink>
              );
            })}
            {showSidebarLanguage && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <LanguageSelector className="w-full" label={t('language.label')} />
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
