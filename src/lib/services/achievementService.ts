import { supabase, isSupabaseConfigured } from '../supabase';

export interface AchievementItem {
  id?: string;
  user_id: string;
  achievement_key: string;
  unlocked_at?: string;
}

export const achievementService = {
  async unlock(userId: string, achievementKey: string): Promise<void> {
    if (isSupabaseConfigured() && userId && userId !== 'local-user-id') {
      const { error } = await supabase.from('achievements').upsert(
        {
          user_id: userId,
          achievement_key: achievementKey,
          unlocked_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,achievement_key' }
      );
      if (error) console.error('Error unlocking achievement in Supabase:', error.message);
    }
  },

  async getUserAchievements(userId: string): Promise<AchievementItem[]> {
    if (isSupabaseConfigured() && userId && userId !== 'local-user-id') {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId);

      if (!error && data) return data as AchievementItem[];
    }
    return [];
  },
};
