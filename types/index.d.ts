export type Word = {
  id: number;
  german: string;
  german_sentence: string | null; // Veritabanında boş olabilir
  turkish: string;
  turkish_sentence: string | null; // Veritabanında boş olabilir
  level: string | null;
  artikel_code: number;
  category: string;
};

export type UserProgress = {
  user_id: string;
  word_id: number;
  is_learned: boolean;
  last_reviewed: string; // Supabase'den tarih string olarak döner
};

// Join işlemi yaparsak (İlerleme ile Kelimeyi birleştirince) kullanılacak tip
export type WordWithProgress = Word & {
  is_learned?: boolean;
  is_seen?: boolean;
};