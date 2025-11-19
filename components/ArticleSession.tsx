/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Loader2, Trophy, Volume2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Word = {
  id: number;
  german: string; 
  artikel_code: number; 
};

interface ArticleSessionProps {
  mode: "new" | "practice" | "review";
}

export default function ArticleSession({ mode }: ArticleSessionProps) {
  const [questions, setQuestions] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null); 
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchArticles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/auth/login");

      const { data: progress } = await supabase
        .from("user_progress")
        .select("word_id, is_learned")
        .eq("user_id", user.id);

      const learnedIds = progress?.filter(p => p.is_learned).map(p => p.word_id) || [];
      const seenIds = progress?.map(p => p.word_id) || [];

      // Sadece artikeli olan kelimeleri (artikel_code > 0) çek
      const { data: allWords } = await supabase
        .from("words")
        .select("id, german, artikel_code")
        .gt("artikel_code", 0);

      if (!allWords) {
          setLoading(false);
          return;
      }

      // Filtreleme Mantığı (QuizSession ile aynı)
      let targetPool: Word[] = [];
      if (mode === "new") {
         targetPool = allWords.filter((w: any) => !seenIds.includes(w.id));
      } else if (mode === "practice") {
         targetPool = allWords.filter((w: any) => seenIds.includes(w.id) && !learnedIds.includes(w.id));
      } else if (mode === "review") {
         targetPool = allWords.filter((w: any) => learnedIds.includes(w.id));
      }

      if (targetPool.length < 1) {
        alert("Bu mod için yeterli artikel verisi yok.");
        return router.push("/");
      }

      // 15 tane seç
      const shuffled = targetPool.sort(() => 0.5 - Math.random()).slice(0, 15);
      setQuestions(shuffled);
      setLoading(false);
    };

    fetchArticles();
  }, [mode, router, supabase]);

  // ... (Geri kalan playSound, handleAnswer, render mantığı aynı kalabilir veya önceki koddaki gibi kullanılabilir)
  // Önceki koddaki render kısmını buraya yapıştırıyorum ama 'mode' kullanımı eklendiği için güncellemiş oldum.
  
  const playSound = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnswer = (code: number) => {
    if (isAnswered) return;
    setSelectedAnswer(code);
    setIsAnswered(true);
    const currentWord = questions[currentIndex];
    if (code === currentWord.artikel_code) {
      setScore(s => s + 1);
      playSound("Richtig!");
    } else {
      playSound("Falsch.");
    }
    setTimeout(() => playSound(currentWord.german), 500);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(p => p + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  const getWordRoot = (fullWord: string) => {
    const parts = fullWord.split(" ");
    return parts.length > 1 ? parts.slice(1).join(" ") : fullWord;
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (isFinished) return (
    <div className="flex h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md text-center p-6">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Harika İş!</h2>
        <p className="text-gray-600 mb-6">Skorun: {score} / {questions.length}</p>
        <Button onClick={() => window.location.reload()} className="w-full mb-2">Tekrar Oyna</Button>
        <Button variant="outline" onClick={() => router.push('/')} className="w-full">Çıkış</Button>
      </Card>
    </div>
  );

  const currentWord = questions[currentIndex];
  const wordRoot = getWordRoot(currentWord.german);

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-center">
       {/* Aynı tasarım... */}
       <div className="w-full max-w-md mb-8 flex justify-between text-sm font-bold text-gray-500">
         <span>Soru {currentIndex + 1}/{questions.length}</span>
         <span>Skor: {score}</span>
       </div>

       <Card className="w-full max-w-md shadow-lg overflow-hidden">
         <div className="h-2 bg-gray-100 w-full">
            <div className="h-full bg-purple-500 transition-all" style={{ width: `${((currentIndex) / questions.length) * 100}%` }}></div>
         </div>
         
         <CardHeader className="text-center py-12 bg-white">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">{wordRoot}</h2>
            <p className="text-gray-400">Bu kelimenin artikeli nedir?</p>
         </CardHeader>

         <CardContent className="p-6 flex gap-3 justify-center">
            <Button 
              className={cn(
                "flex-1 h-24 text-xl font-bold border-b-4 transition-all",
                !isAnswered && "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200",
                isAnswered && currentWord.artikel_code === 1 && "bg-blue-500 text-white border-blue-700 scale-105",
                isAnswered && selectedAnswer === 1 && currentWord.artikel_code !== 1 && "bg-gray-200 opacity-50",
                isAnswered && selectedAnswer !== 1 && currentWord.artikel_code !== 1 && "opacity-30"
              )}
              onClick={() => handleAnswer(1)}
              disabled={isAnswered}
            >
              DER
            </Button>

            <Button 
              className={cn(
                "flex-1 h-24 text-xl font-bold border-b-4 transition-all",
                !isAnswered && "bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200",
                isAnswered && currentWord.artikel_code === 2 && "bg-pink-500 text-white border-pink-700 scale-105",
                isAnswered && selectedAnswer === 2 && currentWord.artikel_code !== 2 && "bg-gray-200 opacity-50",
                isAnswered && selectedAnswer !== 2 && currentWord.artikel_code !== 2 && "opacity-30"
              )}
              onClick={() => handleAnswer(2)}
              disabled={isAnswered}
            >
              DIE
            </Button>

            <Button 
              className={cn(
                "flex-1 h-24 text-xl font-bold border-b-4 transition-all",
                !isAnswered && "bg-green-100 text-green-700 border-green-300 hover:bg-green-200",
                isAnswered && currentWord.artikel_code === 3 && "bg-green-500 text-white border-green-700 scale-105",
                isAnswered && selectedAnswer === 3 && currentWord.artikel_code !== 3 && "bg-gray-200 opacity-50",
                isAnswered && selectedAnswer !== 3 && currentWord.artikel_code !== 3 && "opacity-30"
              )}
              onClick={() => handleAnswer(3)}
              disabled={isAnswered}
            >
              DAS
            </Button>
         </CardContent>
         
         {isAnswered && (
           <CardFooter className="bg-gray-50 p-4">
             <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => playSound(currentWord.german)}>
                        <Volume2 className="text-blue-600" />
                    </Button>
                    <span className="text-lg font-bold text-gray-700">{currentWord.german}</span>
                </div>
                <Button onClick={handleNext}>Devam Et <ArrowRight className="ml-2 w-4 h-4" /></Button>
             </div>
           </CardFooter>
         )}
       </Card>
    </div>
  );
}