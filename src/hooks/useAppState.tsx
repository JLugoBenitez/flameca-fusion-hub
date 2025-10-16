import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';

// Tipos para el estado de la aplicación
interface AppState {
  isLoading: boolean;
  isOnline: boolean;
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  notifications: Notification[];
  userPreferences: UserPreferences;
}

interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  itemsPerPage: number;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// Acciones
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp' | 'read'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'UPDATE_USER_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' };

// Estado inicial
const initialState: AppState = {
  isLoading: false,
  isOnline: navigator.onLine,
  theme: 'system',
  sidebarCollapsed: false,
  notifications: [],
  userPreferences: {
    language: 'es',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'DD/MM/YYYY',
    currency: 'EUR',
    itemsPerPage: 20,
  },
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };
    
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    
    case 'ADD_NOTIFICATION':
      const newNotification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
        read: false,
      };
      return {
        ...state,
        notifications: [newNotification, ...state.notifications].slice(0, 50), // Máximo 50 notificaciones
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    
    case 'UPDATE_USER_PREFERENCES':
      const updatedPreferences = { ...state.userPreferences, ...action.payload };
      // Guardar en localStorage
      localStorage.setItem(STORAGE_KEYS.userPreferences, JSON.stringify(updatedPreferences));
      return { ...state, userPreferences: updatedPreferences };
    
    case 'CLEAR_ALL_NOTIFICATIONS':
      return { ...state, notifications: [] };
    
    default:
      return state;
  }
}

// Context
const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Cargar preferencias del usuario desde localStorage
  React.useEffect(() => {
    const savedPreferences = localStorage.getItem(STORAGE_KEYS.userPreferences);
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: preferences });
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    }
  }, []);

  // Escuchar cambios de conectividad
  React.useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

// Hook para usar el estado de la aplicación
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

// Hooks específicos para diferentes partes del estado
export function useLoading() {
  const { state, dispatch } = useAppState();
  return {
    isLoading: state.isLoading,
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
  };
}

export function useTheme() {
  const { state, dispatch } = useAppState();
  return {
    theme: state.theme,
    setTheme: (theme: 'light' | 'dark' | 'system') => dispatch({ type: 'SET_THEME', payload: theme }),
  };
}

export function useSidebar() {
  const { state, dispatch } = useAppState();
  return {
    collapsed: state.sidebarCollapsed,
    toggle: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
  };
}

export function useNotifications() {
  const { state, dispatch } = useAppState();
  return {
    notifications: state.notifications,
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) =>
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    removeNotification: (id: string) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
    markAsRead: (id: string) => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id }),
    clearAll: () => dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' }),
    unreadCount: state.notifications.filter(n => !n.read).length,
  };
}

export function useUserPreferences() {
  const { state, dispatch } = useAppState();
  return {
    preferences: state.userPreferences,
    updatePreferences: (preferences: Partial<UserPreferences>) =>
      dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: preferences }),
  };
}

export function useConnectivity() {
  const { state } = useAppState();
  return {
    isOnline: state.isOnline,
    isOffline: !state.isOnline,
  };
}
