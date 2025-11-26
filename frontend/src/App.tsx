import { useState } from 'react';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'match' | 'stats' | 'admin'>('home');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">🤾 Handbol 2026</h1>
            </div>
            <div className="flex space-x-4 items-center">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'home'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Inici
              </button>
              <button
                onClick={() => setCurrentView('match')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'match'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Partit
              </button>
              <button
                onClick={() => setCurrentView('stats')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'stats'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Estadístiques
              </button>
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Gestió
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'home' && <HomeView />}
        {currentView === 'match' && <MatchView />}
        {currentView === 'stats' && <StatsView />}
        {currentView === 'admin' && <AdminView />}
      </main>
    </div>
  );
}

// Placeholder components
function HomeView() {
  return (
    <div className="text-center py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Benvingut a Handbol 2026</h2>
      <p className="text-gray-600 mb-8">Gestiona els teus partits i estadístiques d'handbol</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-4xl mb-2">🏐</div>
          <h3 className="font-semibold text-lg mb-2">Partits</h3>
          <p className="text-gray-600 text-sm">Registra jugades en temps real</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-4xl mb-2">📊</div>
          <h3 className="font-semibold text-lg mb-2">Estadístiques</h3>
          <p className="text-gray-600 text-sm">Analitza el rendiment</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-4xl mb-2">⚙️</div>
          <h3 className="font-semibold text-lg mb-2">Gestió</h3>
          <p className="text-gray-600 text-sm">Administra jugadors i equips</p>
        </div>
      </div>
    </div>
  );
}

function MatchView() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Registre de Partit</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-600">Interfície de registre de jugades (en construcció)</p>
      </div>
    </div>
  );
}

function StatsView() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Estadístiques</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-600">Dashboard d'estadístiques (en construcció)</p>
      </div>
    </div>
  );
}

function AdminView() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestió</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-600">Gestió de jugadors, equips i clubs (en construcció)</p>
      </div>
    </div>
  );
}

export default App;
