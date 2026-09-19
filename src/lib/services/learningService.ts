import { supabase, isSupabaseConfigured } from '../supabase';

export interface LearningProgressItem {
  id?: string;
  user_id: string;
  topic: string;
  progress: number;
  completed: boolean;
  updated_at?: string;
}

export const learningService = {
  async updateProgress(userId: string, topic: string, progress: number, completed: boolean = false): Promise<void> {
    if (isSupabaseConfigured() && userId && userId !== 'local-user-id') {
      const { error } = await supabase.from('learning_progress').upsert(
        {
          user_id: userId,
          topic,
          progress,
          completed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,topic' }
      );
      if (error) console.error('Error updating learning progress in Supabase:', error.message);
    }
  },

  async getUserProgress(userId: string): Promise<LearningProgressItem[]> {
    if (isSupabaseConfigured() && userId && userId !== 'local-user-id') {
      const { data, error } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', userId);

      if (!error && data) return data as LearningProgressItem[];
    }
    return [];
  },
};
