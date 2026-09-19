import { supabase, isSupabaseConfigured } from '../supabase';

export interface EmergencyAlert {
  id?: string;
  title: string;
  message: string;
  severity: 'Critical' | 'Warning' | 'Advisory';
  location?: string;
  created_by?: string;
  created_at?: string;
  expires_at?: string;
}

export interface DrillItem {
  id?: string;
  title: string;
  description?: string;
  scheduled_at: string;
  location?: string;
  created_by?: string;
  created_at?: string;
}

export const teacherService = {
  async getStudentRoster() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          course,
          year,
          role,
          preparedness ( score, kit_items )
        `)
        .eq('role', 'student');

      if (!error && data) return data;
    }
    return null;
  },

  async getEmergencyAlerts(): Promise<EmergencyAlert[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) return data as EmergencyAlert[];
    }
    return [];
  },

  async createAlert(alertData: Omit<EmergencyAlert, 'id'>, userId?: string): Promise<EmergencyAlert | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .insert({
          ...alertData,
          created_by: userId || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) return data as EmergencyAlert;
      if (error) console.error('Error creating emergency alert:', error.message);
    }
    return null;
  },

  async deleteAlert(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('emergency_alerts').delete().eq('id', id);
    }
  },

  async getDrills(): Promise<DrillItem[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('drills')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (!error && data) return data as DrillItem[];
    }
    return [];
  },

  async createDrill(drillData: Omit<DrillItem, 'id'>, userId?: string): Promise<DrillItem | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('drills')
        .insert({
          ...drillData,
          created_by: userId || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) return data as DrillItem;
      if (error) console.error('Error creating drill:', error.message);
    }
    return null;
  },
};
