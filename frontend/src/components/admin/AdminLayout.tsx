import { Home, Users, Calendar, Trophy, FileText } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  onNavigateHome?: () => void;
  onNavigate?: (view: string) => void;
  currentView?: string;
}

export const AdminLayout = ({ children, onNavigateHome, onNavigate, currentView }: AdminLayoutProps) => {
  const navItems = [
    { id: 'clubs', label: 'Clubs', icon: Trophy },
    { id: 'seasons', label: 'Seasons', icon: Calendar },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'matches', label: 'Matches', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onNavigateHome}
                className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"
              >
                <Home size={20} />
                <span className="font-medium">Back to Match Tracker</span>
              </button>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
