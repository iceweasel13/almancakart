/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client"; // Client-side Supabase
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Volume2, Settings, RefreshCw, Leaf, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Kelime Tipi (Veritabanı ile aynı)
type Word = {
  id: number;
  german: string;
  german_sentence: string;
  turkish: string;
  turkish_sentence: string;
  artikel_code: number;
};

interface FlashcardSessionProps {
  mode: "new" | "practice" | "review";
}

// Artikel renkleri
const getArticleColorClass = (code: number): string => {
  switch (code) {
    case 1: return "bg-blue-100/60"; // Der
    case 2: return "bg-pink-100/60"; // Die
    case 3: return "bg-green-100/60"; // Das
    default: return "bg-white";
  }
};

export default function FlashcardSession({ mode }: FlashcardSessionProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [cardDirections, setCardDirections] = useState<boolean[]>([]); // True: Türkçe Ön, False: Almanca Ön
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  // Verileri Veritabanından Çek
  useEffect(() => {
    const fetchWords = async () => {
      // 1. Kullanıcıyı al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // 2. Kullanıcının ilerlemesini çek
      const { data: progress } = await supabase
        .from("user_progress")
        .select("word_id, is_learned")
        .eq("user_id", user.id);

      const learnedIds = progress?.filter(p => p.is_learned).map(p => p.word_id) || [];
      const seenIds = progress?.map(p => p.word_id) || [];

      // 3. Kelimeleri çek
      const { data: allWords, error } = await supabase.from("words").select("*");

      if (error) {
        console.error("Veri hatası:", error);
        setLoading(false);
        return;
      }

      // 4. Mod'a göre filtrele
      let filteredWords: Word[] = [];

      if (mode === "new") {
        // Hiç görülmemişler (seenIds içinde OLMAYANLAR)
        filteredWords = allWords.filter((w: any) => !seenIds.includes(w.id));
      } else if (mode === "practice") {
        // Görülenler ama Öğrenilmeyenler (seenIds içinde VAR ama learnedIds içinde YOK)
        filteredWords = allWords.filter((w: any) => seenIds.includes(w.id) && !learnedIds.includes(w.id));
      } else if (mode === "review") {
        // Öğrenilenler (learnedIds içinde VAR)
        filteredWords = allWords.filter((w: any) => learnedIds.includes(w.id));
      }

      // 5. Karıştır ve 15 tanesini al
      const shuffled = filteredWords.sort(() => 0.5 - Math.random()).slice(0, 15);
      setWords(shuffled);

      // 6. Kart Yönlerini Belirle
      const directions = shuffled.map(() => {
        if (mode === "new") return false;
        return Math.random() > 0.5; // %50 şans ile ters (Türkçe önde)
      });
      setCardDirections(directions);

      setLoading(false);
    };

    fetchWords();
  }, [mode]);

  // İlerlemeyi Kaydet
  const handleNextWord = async (knewIt: boolean) => {
    const currentWord = words[currentIndex];
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("user_progress").upsert({
        user_id: user.id,
        word_id: currentWord.id,
        is_learned: knewIt,
        last_reviewed: new Date().toISOString()
      });
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      router.push("/"); 
      router.refresh(); 
    }
  };

  // Seslendirme
  const playSound = (text: string) => {
    if (!text) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      const voices = window.speechSynthesis.getVoices();
      const bestVoice = voices.find(v => v.lang === 'de-DE' && (v.name.includes('Google') || v.name.includes('German')));
      if (bestVoice) utterance.voice = bestVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Mevcut kelime verilerini hazırla (Loading sırasında hata vermemesi için güvenli erişim)
  const currentWord = words[currentIndex];
  const isReversed = cardDirections[currentIndex];
  const articleColorClass = currentWord ? getArticleColorClass(currentWord.artikel_code) : "bg-white";

  // İçerik Belirleme (Data yoksa boş string)
  const frontText = currentWord ? (isReversed ? currentWord.turkish : currentWord.german) : "";
  const frontSentence = currentWord ? (isReversed ? currentWord.turkish_sentence : currentWord.german_sentence) : "";
  
  const backText = currentWord ? (isReversed ? currentWord.german : currentWord.turkish) : "";
  const backSentence = currentWord ? (isReversed ? currentWord.german_sentence : currentWord.turkish_sentence) : "";

  const showAudioOnFront = !isReversed;
  const showAudioOnBack = isReversed;

  const currentCardColor = (!isFlipped && !isReversed) || (isFlipped && isReversed) 
    ? articleColorClass 
    : "bg-white";

  return (
    // pb-24 (96px) + footer mb-8 = Mobilde navigasyonun altında kalmayı engeller
    <div className="flex flex-col min-h-screen w-full bg-gray-50 p-4 sm:p-8 pb-16">
      
      {/* Header */}
      <header className="w-full max-w-3xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Leaf className="text-green-500" size={32} />
            <span className="text-xl font-bold text-gray-700">Deutsch</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Settings className="text-gray-400" /></Button>
          </div>
        </div>
        {/* Loading sırasında progress 0 olsun veya dolu görünsün tercihe bağlı, şimdilik hesaplıyoruz */}
        <Progress value={words.length > 0 ? ((currentIndex) / words.length) * 100 : 0} className="w-full h-3 mt-2" />
      </header>

      {/* Ana Alan (Kart veya Loading) */}
      <main className="grow flex flex-col items-center justify-center w-full">
        
        {/* 1. Durum: Yükleniyor */}
        {loading ? (
           <div className="flex flex-col items-center justify-center gap-4 animate-pulse">
              <Loader2 className="animate-spin text-blue-600" size={56} />
             
           </div>
        ) : 
        
        /* 2. Durum: Kelime Yok */
        words.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-4 text-center">
              <h2 className="text-2xl font-bold text-gray-700">Harika!</h2>
              <p className="text-gray-500">Bu modda çalışacak yeni kelime kalmadı.</p>
              <Button onClick={() => router.push("/")} className="mt-4">Ana Sayfaya Dön</Button>
            </div>
        ) : 
        
        /* 3. Durum: Kart Gösterimi */
        (
          <Card className={cn(
            "w-full max-w-3xl h-[400px] shadow-lg rounded-2xl flex flex-col justify-center items-center p-6 text-center transition-colors duration-300",
            currentCardColor
          )}>
            {!isFlipped ? (
              <CardContent className="flex flex-col items-center justify-center gap-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl sm:text-5xl font-bold text-gray-800">{frontText}</h2>
                  {showAudioOnFront && (
                    <Button variant="ghost" size="icon" onClick={() => playSound(frontText)}>
                      <Volume2 className="text-gray-500" />
                    </Button>
                  )}
                </div>
                {frontSentence && (
                  <div className="flex items-center gap-3">
                    <p className="text-lg sm:text-xl text-gray-600">{frontSentence}</p>
                    {showAudioOnFront && (
                      <Button variant="ghost" size="icon" onClick={() => playSound(frontSentence)}>
                        <Volume2 className="text-gray-500" />
                      </Button>
                    )}
                  </div>
                )}
                <Button variant="outline" className="mt-8" onClick={() => setIsFlipped(true)}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Çevir
                </Button>
              </CardContent>
            ) : (
              <CardContent className="flex flex-col items-center justify-center gap-6 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl sm:text-5xl font-bold text-gray-800">{backText}</h2>
                  {showAudioOnBack && (
                    <Button variant="ghost" size="icon" onClick={() => playSound(backText)}>
                      <Volume2 className="text-gray-500" />
                    </Button>
                  )}
                </div>
                {backSentence && <p className="text-lg sm:text-xl text-gray-600">{backSentence}</p>}
                <Button variant="outline" className="mt-8" onClick={() => setIsFlipped(false)}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Çevir
                </Button>
              </CardContent>
            )}
          </Card>
        )}
      </main>

      {/* Alt Butonlar - Sadece Kart Varken Göster */}
      {!loading && words.length > 0 && (
        <footer className="w-full max-w-3xl mx-auto mt-6 "> {/* mb-8 ile yukarı kaldırdık */}
          <div className="grid grid-cols-2 gap-4">
            <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white font-bold py-8" onClick={() => handleNextWord(false)}>
              Tekrar Göster
            </Button>
            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-bold py-8" onClick={() => handleNextWord(true)}>
              Biliyorum
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}