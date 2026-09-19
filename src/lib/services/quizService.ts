import { supabase, isSupabaseConfigured } from '../supabase';

export interface QuizAttempt {
  id?: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  completed_at?: string;
}

export const quizService = {
  async recordAttempt(userId: string, quizId: string, score: number, totalQuestions: number): Promise<void> {
    if (isSupabaseConfigured() && userId && userId !== 'local-user-id') {
      const { error } = await supabase.from('quiz_attempts').insert({
        user_id: userId,
        quiz_id: quizId,
        score,
        total_questions: totalQuestions,
        completed_at: new Date().toISOString(),
      });
      if (error) console.error('Error saving quiz attempt to Supabase:', error.message);
    }
  },

  async getUserAttempts(userId: string): Promise<QuizAttempt[]> {
    if (isSupabaseConfigured() && userId && userId !== 'local-user-id') {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (!error && data) return data as QuizAttempt[];
    }
    return [];
  },
};
