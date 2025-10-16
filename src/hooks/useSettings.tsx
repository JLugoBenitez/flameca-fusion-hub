import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AutoSyncSettings {
  enabled: boolean;
  ordersInterval: number; // en milisegundos
  productsInterval: number; // en milisegundos
}

interface SettingsContextType {
  settings: AutoSyncSettings;
  updateSettings: (newSettings: Partial<AutoSyncSettings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AutoSyncSettings = {
  enabled: true,
  ordersInterval: 30000, // 30 segundos
  productsInterval: 60000, // 1 minuto
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AutoSyncSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false); // Cambiado a false para evitar loading innecesario

  const updateSettings = async (newSettings: Partial<AutoSyncSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Aquí se guardaría en la base de datos
      // await supabase.from('settings').upsert({ ... });
      
      // Emitir evento para que useAutoSync se actualice
      window.dispatchEvent(new CustomEvent('settingsUpdated', { 
        detail: updatedSettings 
      }));
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
