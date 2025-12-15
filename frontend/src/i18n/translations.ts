export type LanguageCode = 'en' | 'ca' | 'es';

export const availableLanguages: Array<{ code: LanguageCode; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ca', label: 'Català' },
  { code: 'es', label: 'Español' },
];

export const fallbackLanguage: LanguageCode = 'en';

type TranslationMap = Record<string, string>;

export const translations: Record<LanguageCode, TranslationMap> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.matches': 'Matches',
    'nav.clubs': 'Clubs',
    'nav.seasons': 'Seasons',
    'nav.teams': 'Teams',
    'nav.players': 'Players',
    'language.label': 'Language',
    'dashboard.title': 'Dashboard',
    'dashboard.loadingMessage': 'Loading your matches...',
    'dashboard.loadingSectionTitle': 'Upcoming Matches',
    'dashboard.welcome': 'Welcome back, Coach',
    'dashboard.newMatch': 'New Match',
    'dashboard.upcomingMyTeams': 'Upcoming for your teams',
    'dashboard.noUpcomingMyTeams': 'No upcoming matches for your teams.',
    'dashboard.upcomingAll': 'Upcoming Matches',
    'dashboard.viewAll': 'View All',
    'dashboard.noUpcoming': 'No upcoming matches',
    'dashboard.noUpcomingDescription': 'Get started by scheduling a new match.',
    'dashboard.scheduleMatch': 'Schedule Match',
    'dashboard.recentHistory': 'Recent History',
    'dashboard.noPastMatches': 'No past matches found.',
  },
  ca: {
    'nav.dashboard': 'Dashboard',
    'nav.matches': 'Partits',
    'nav.clubs': 'Clubs',
    'nav.seasons': 'Temporades',
    'nav.teams': 'Equips',
    'nav.players': 'Jugadors',
    'language.label': 'Idioma',
    'dashboard.title': 'Dashboard',
    'dashboard.loadingMessage': 'Carregant els teus partits...',
    'dashboard.loadingSectionTitle': 'Propers partits',
    'dashboard.welcome': 'Hola, entrenador',
    'dashboard.newMatch': 'Nou partit',
    'dashboard.upcomingMyTeams': 'Propers partits dels teus equips',
    'dashboard.noUpcomingMyTeams': 'No tens partits previstos dels teus equips.',
    'dashboard.upcomingAll': 'Propers partits',
    'dashboard.viewAll': 'Veure tots',
    'dashboard.noUpcoming': 'No hi ha partits previstos',
    'dashboard.noUpcomingDescription': 'Programar un partit.',
    'dashboard.scheduleMatch': 'Programa un partit',
    'dashboard.recentHistory': 'Historial recent',
    'dashboard.noPastMatches': 'No hi ha partits anteriors.',
  },
  es: {
  'nav.dashboard': 'Dashboard',
  'nav.matches': 'Partidos',
  'nav.clubs': 'Clubes',
  'nav.seasons': 'Temporadas',
  'nav.teams': 'Equipos',
  'nav.players': 'Jugadores',
  'language.label': 'Idioma',

  'dashboard.title': 'Dashboard',
  'dashboard.loadingMessage': 'Cargando tus partidos...',
  'dashboard.loadingSectionTitle': 'Próximos partidos',
  'dashboard.welcome': 'Hola, entrenador',
  'dashboard.newMatch': 'Nuevo partido',

  'dashboard.upcomingMyTeams': 'Próximos partidos de tus equipos',
  'dashboard.noUpcomingMyTeams': 'No tienes partidos previstos de tus equipos.',
  'dashboard.upcomingAll': 'Próximos partidos',
  'dashboard.viewAll': 'Ver todos',

  'dashboard.noUpcoming': 'No hay partidos previstos',
  'dashboard.noUpcomingDescription': 'Programa un partido.',
  'dashboard.scheduleMatch': 'Programar un partido',

  'dashboard.recentHistory': 'Historial reciente',
  'dashboard.noPastMatches': 'No hay partidos anteriores.',
},
};

export const getTranslation = (lang: LanguageCode, key: string): string => {
  const languagePack = translations[lang] ?? translations[fallbackLanguage];
  return languagePack[key] ?? translations[fallbackLanguage][key] ?? key;
};
