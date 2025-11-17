/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Volume2, Settings, RefreshCw, Leaf 
} from "lucide-react";
// lib/data.ts dosyasından güncel Word tipini import ediyoruz
import { type Word } from "@/lib/data"; 
// Shadcn'in 'classnames' utility'si
import { cn } from "@/lib/utils"; 

// YENİ: Typescript'e 'responsiveVoice' objesinin 'window' 
// üzerinde var olduğunu söylüyoruz.
declare global {
  interface Window {
    responsiveVoice: any;
  }
}

// LocalStorage'dan güvenli veri çekmek için helper
const getStorageData = (key: string): number[] => {
  // Bu fonksiyon client-side'da çalışacağı için 'window' kontrolü önemli
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Component'in alacağı prop'lar
interface FlashcardSessionProps {
  mode: "new" | "practice" | "review";
  allWords: Word[]; // Tüm kelimeler sunucudan prop olarak geliyor
}

// Fisher-Yates shuffle algoritması (diziyi karıştırmak için)
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// *** Artikel koduna göre renk sınıfını döndüren fonksiyon ***
const getArticleColorClass = (code: number): string => {
  switch (code) {
    case 1: // der
      return "bg-blue-100/60"; // Hafif mavi arkaplan
    case 2: // die
      return "bg-pink-100/60"; // Hafif pembe arkaplan
    case 3: // das
      return "bg-green-100/60"; // Hafif yeşil arkaplan
    default: // 0 veya diğer
      return "bg-white"; // Standart
  }
};

export default function FlashcardSession({ mode, allWords }: FlashcardSessionProps) {
  // Oturumda gösterilecek kelimeler (örn: 15 tane)
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useState(0);

  // Component yüklendiğinde 'mode'a göre kelimeleri filtrele
  useEffect(() => {
    // 1. LocalStorage'dan mevcut durumu al
    const seenIds = new Set(getStorageData("seenWordIds"));
    const learnedIds = new Set(getStorageData("learnedWordIds"));

    let filteredWords: Word[] = [];

    if (mode === "new") {
      // Mod 'new': Henüz HİÇ GÖRÜLMEMİŞ kelimeleri bul
      filteredWords = allWords.filter(word => !seenIds.has(word.id));
    } else if (mode === "practice") {
      // Mod 'practice': GÖRÜLMÜŞ ama ÖĞRENİLMEMİŞ kelimeleri bul
      filteredWords = allWords.filter(word => seenIds.has(word.id) && !learnedIds.has(word.id));
    } else if (mode === "review") {
      // Mod 'review': ÖĞRENİLMİŞ kelimeleri bul (genel tekrar)
      filteredWords = allWords.filter(word => learnedIds.has(word.id));
    }

    // 2. Bulunan kelimeleri karıştır ve ilk 15'ini al
    const sessionBatch = shuffleArray(filteredWords).slice(0, 15);
    setSessionWords(sessionBatch);

    // 3. Başlangıç state'lerini ayarla
    setCurrentIndex(0);
    setIsFlipped(false);
    setProgress(0);

  }, [mode, allWords]); // 'mode' veya 'allWords' değiştiğinde yeniden çalış

  // İlerleme çubuğunu güncelle
  useEffect(() => {
    if (sessionWords.length > 0) {
      setProgress(((currentIndex + 1) / sessionWords.length) * 100);
    }
  }, [currentIndex, sessionWords]);

  // Kartı çevir
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Sonraki kelimeye geç (Biliyorum / Tekrar Göster)
  const handleNextWord = (knewIt: boolean) => {
    const currentWord = sessionWords[currentIndex];

    // 1. LocalStorage'ı güncelle
    const seenIds = getStorageData("seenWordIds");
    const learnedIds = getStorageData("learnedWordIds");

    // Her durumda 'görüldü' olarak ekle
    if (!seenIds.includes(currentWord.id)) {
      seenIds.push(currentWord.id);
      localStorage.setItem("seenWordIds", JSON.stringify(seenIds));
    }

    if (knewIt) {
      // 'Biliyorum' dediyse 'öğrenildi'ye ekle
      if (!learnedIds.includes(currentWord.id)) {
        learnedIds.push(currentWord.id);
        localStorage.setItem("learnedWordIds", JSON.stringify(learnedIds));
      }
    } else {
      // 'Tekrar Göster' dediyse 'öğrenildi'den çıkar (eğer oradaysa)
      const index = learnedIds.indexOf(currentWord.id);
      if (index > -1) {
        learnedIds.splice(index, 1);
        localStorage.setItem("learnedWordIds", JSON.stringify(learnedIds));
      }
    }

    // 2. Sonraki kelimeye geç
    if (currentIndex < sessionWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false); // Yeni kelimede kartı başa döndür
    } else {
      // Oturum bitti!
      alert("Oturum bitti! Ana sayfaya yönlendiriliyorsunuz.");
      window.location.href = '/'; // Ana sayfaya yolla
    }
  };
  
  // *** playSound fonksiyonu ResponsiveVoice kullanacak şekilde güncellendi ***
  const playSound = (text: string) => {
    // 1. Cümle boşsa hiçbir şey yapma
    if (!text) return;

    // 2. ResponsiveVoice kütüphanesi yüklendi mi diye kontrol et
    if (typeof window !== 'undefined' && window.responsiveVoice) {
      // 3. Yüklendiyse, "Deutsch Male" sesiyle metni oku
      // ( layout.tsx'e script'i eklediğini varsayıyorum )
      window.responsiveVoice.speak(text, "Deutsch Female");
    } else {
      // 4. (Fallback) Kütüphane yüklenmezse, eski robotik sesi kullan
      console.warn("ResponsiveVoice not loaded, using default TTS.");
      if (typeof window !== 'undefined' && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'de-DE';
          window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Gösterilecek kelime yoksa (yükleniyor veya o modda kelime kalmadıysa)
  if (sessionWords.length === 0) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Harika!</h2>
          <p className="text-gray-700">
            Bu modda çalışacak kelime kalmamış görünüyor.
          </p>
          <Button 
            className="mt-6 w-full" 
            onClick={() => window.location.href = '/'}
          >
            Ana Sayfaya Dön
          </Button>
        </Card>
      </div>
    );
  }

  // O anki kelime verisi ve rengi
  const currentWord = sessionWords[currentIndex];
  // Renk kodunu al
  const articleColorClass = getArticleColorClass(currentWord.artikel_code);

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50 p-4 sm:p-8">
      {/* 1. Header (Başlık ve İlerleme Çubuğu) */}
      <header className="w-full max-w-3xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Leaf className="text-green-500" size={32} />
            <span className="text-xl font-bold text-gray-700">Deutsch</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Settings className="text-gray-400" />
            </Button>
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          </div>
        </div>
        <span className="text-sm font-semibold text-gray-500">
          Session Progress
        </span>
        <Progress value={progress} className="w-full h-3 mt-2" />
      </header>

      {/* 2. Flashcard Alanı */}
      <main className="grow flex flex-col items-center justify-center">
        {/* Kartın arkaplan rengi 'articleColorClass' ile ayarlandı */}
        <Card className={cn(
          "w-full max-w-3xl h-[400px] shadow-lg rounded-2xl flex flex-col justify-center items-center p-6 text-center transition-colors duration-300",
          articleColorClass // Renk sınıfı burada eklendi
        )}>
          {!isFlipped ? (
            // ÖN YÜZ (Almanca) - Alan adları güncellendi
            <CardContent className="flex flex-col items-center justify-center gap-6">
              <div className="flex items-center gap-3">
                <h2 className="text-5xl font-bold text-gray-800">
                  {currentWord.word}
                </h2>
                {/* Buton artık güncel playSound'u çağırıyor */}
                <Button variant="ghost" size="icon" onClick={() => playSound(currentWord.word)}>
                  <Volume2 className="text-gray-500" />
                </Button>
              </div>
              {/* Sadece cümle varsa (boş string değilse) göster */}
              {currentWord.example_de && ( 
                <div className="flex items-center gap-3">
                  <p className="text-xl text-gray-600">
                    {currentWord.example_de}
                  </p>
                  <Button variant="ghost" size="icon" onClick={() => playSound(currentWord.example_de)}>
                    <Volume2 className="text-gray-500" />
                  </Button>
                </div>
              )}
              
              <Button
                variant="outline"
                className="mt-8"
                onClick={handleFlip}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Çevir
              </Button>
            </CardContent>
          ) : (
            // ARKA YÜZ (Türkçe)
            <CardContent className="flex flex-col items-center justify-center gap-6 animate-in fade-in">
              <h2 className="text-5xl font-bold text-gray-800">
                {currentWord.translation_tr}
              </h2>
              {/* Sadece cümle varsa (boş string değilse) göster */}
              {currentWord.example_tr && ( 
                <p className="text-xl text-gray-600">
                  {currentWord.example_tr}
                </p>
              )}
              {/* Arka yüze de çevir butonu eklendi */}
              <Button
                variant="outline"
                className="mt-8"
                onClick={handleFlip}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Çevir
              </Button>
            </CardContent>
          )}
        </Card>
      </main>

      {/* 3. Footer (Aksiyon Butonları) */}
      <footer className="w-full max-w-3xl mx-auto mt-6">
        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg py-8"
            onClick={() => handleNextWord(false)} // 'false' -> Bilemedim
          >
            Tekrar Göster
          </Button>
          <Button
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-8"
            onClick={() => handleNextWord(true)} // 'true' -> Bildim
          >
            Biliyorum
          </Button>
        </div>
      </footer>
    </div>
  );
}