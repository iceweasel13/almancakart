/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, Volume2, ArrowRight, RotateCcw, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Word = {
  id: number;
  german: string;
  turkish: string;
  artikel_code: number;
};

type Question = {
  target: Word;
  options: Word[];
  correctIndex: number;
};

interface QuizSessionProps {
  mode: "new" | "practice" | "review";
}

export default function QuizSession({ mode }: QuizSessionProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizFinished, setQuizFinished] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const prepareQuiz = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/auth/login");

      // 1. Kullanıcı ilerlemesini çek
      const { data: progress } = await supabase
        .from("user_progress")
        .select("word_id, is_learned")
        .eq("user_id", user.id);

      const learnedIds = progress?.filter(p => p.is_learned).map(p => p.word_id) || [];
      const seenIds = progress?.map(p => p.word_id) || [];

      // 2. Tüm kelimeleri çek (Çeldirici şıklar için hepsine ihtiyacımız var)
      const { data: allWords } = await supabase.from("words").select("id, german, turkish, artikel_code");

      if (!allWords || allWords.length < 4) {
        alert("Yeterli veri yok!");
        return router.push("/");
      }

      // 3. Mod'a göre HEDEF kelime havuzunu belirle
      let targetPool: Word[] = [];

      if (mode === "new") {
         // Quiz genelde görülenler içindir ama 'new' gelirse hiç görülmemişleri seç
         targetPool = allWords.filter((w: any) => !seenIds.includes(w.id));
      } else if (mode === "practice") {
         // Görülenler ama Öğrenilmeyenler
         targetPool = allWords.filter((w: any) => seenIds.includes(w.id) && !learnedIds.includes(w.id));
      } else if (mode === "review") {
         // Sadece Öğrenilenler
         targetPool = allWords.filter((w: any) => learnedIds.includes(w.id));
      }

      // Havuz boşsa uyarı ver
      if (targetPool.length < 4) {
        alert("Bu modda quiz yapmak için yeterli kelime birikmedi. Önce biraz ders çalışın!");
        return router.push("/");
      }

      // 4. Soruları Oluştur (Max 10 soru)
      const quizQuestions: Question[] = [];
      const questionCount = Math.min(10, targetPool.length);
      const shuffledTargets = targetPool.sort(() => 0.5 - Math.random()).slice(0, questionCount);

      for (const targetWord of shuffledTargets) {
        // 3 Yanlış cevap seç (Tüm havuzdan)
        const distractors: Word[] = [];
        while (distractors.length < 3) {
          const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
          // Kendisi veya zaten seçilmiş olmasın
          if (randomWord.id !== targetWord.id && !distractors.find(d => d.id === randomWord.id)) {
            distractors.push(randomWord);
          }
        }

        const options = [...distractors];
        const correctIndex = Math.floor(Math.random() * 4);
        options.splice(correctIndex, 0, targetWord);

        quizQuestions.push({
          target: targetWord,
          options,
          correctIndex
        });
      }

      setQuestions(quizQuestions);
      setLoading(false);
    };

    prepareQuiz();
  }, [mode, router, supabase]);

  const playSound = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      // En iyi sesi bulmaya çalış (Google veya German içeren)
      const voices = window.speechSynthesis.getVoices();
      const bestVoice = voices.find(v => v.lang === 'de-DE' && (v.name.includes('Google') || v.name.includes('German')));
      if (bestVoice) utterance.voice = bestVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIndex);
    setIsAnswered(true);

    const currentQ = questions[currentQIndex];
    if (optionIndex === currentQ.correctIndex) {
      setScore(prev => prev + 1);
      playSound("Gut!");
    } else {
      playSound("Falsch.");
    }
    setTimeout(() => playSound(currentQ.target.german), 400);
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <p className="text-gray-500 font-medium">Quiz hazırlanıyor ({mode === "review" ? "Öğrenilenler" : "Görülenler"})...</p>
    </div>
  );

  if (quizFinished) return (
    <div className="flex h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md text-center p-8 shadow-xl">
        <CardHeader className="flex flex-col items-center gap-4">
          <div className="p-4 bg-yellow-100 rounded-full text-yellow-600 animate-bounce">
            <Trophy size={64} />
          </div>
          <CardTitle className="text-3xl text-blue-900">Quiz Tamamlandı!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-gray-600 mb-2">Toplam Skorun:</p>
          <div className="text-6xl font-bold text-blue-600 mb-6">
            {score} / {questions.length}
          </div>
          <Progress value={(score / questions.length) * 100} className="h-4 w-full rounded-full" />
          <p className="text-sm text-gray-400 mt-4">
            {mode === "review" ? "Öğrendiklerini pekiştirdin!" : "Pratik yaparak gelişiyorsun!"}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-4">
          <Button className="w-full h-12 text-lg" onClick={() => window.location.reload()}>
            <RotateCcw className="mr-2 h-4 w-4" /> Tekrar Oyna
          </Button>
          <Button variant="outline" className="w-full h-12" onClick={() => router.push('/')}>
            Ana Sayfaya Dön
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  const currentQ = questions[currentQIndex];

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-center pb-20">
      <div className="w-full max-w-md mb-6 flex justify-between items-center">
        <span className="text-sm font-bold text-gray-500">Soru {currentQIndex + 1}/{questions.length}</span>
        <span className="text-sm font-bold text-blue-600">Puan: {score}</span>
      </div>
      
      <Progress value={((currentQIndex) / questions.length) * 100} className="w-full max-w-md h-2 mb-8" />

      <Card className="w-full max-w-md shadow-lg border-t-4 border-blue-500">
        <CardHeader className="text-center py-10 bg-slate-50">
          <div className="flex justify-center mb-4">
             <Button variant="ghost" size="icon" onClick={() => playSound(currentQ.target.german)}>
               <Volume2 className="w-10 h-10 text-blue-500" />
             </Button>
          </div>
          <h2 className="text-4xl font-bold text-blue-900 mb-2">{currentQ.target.german}</h2>
          <p className="text-gray-400 text-sm">Doğru Türkçe karşılığı seçin</p>
        </CardHeader>
        
        <CardContent className="grid gap-3 p-6">
          {currentQ.options.map((option, index) => {
            let btnColor = "bg-white hover:bg-gray-50 border-gray-200 text-gray-700";
            if (isAnswered) {
              if (index === currentQ.correctIndex) {
                btnColor = "bg-green-100 border-green-500 text-green-800 font-bold shadow-sm"; 
              } else if (index === selectedOption) {
                btnColor = "bg-red-100 border-red-500 text-red-800 shadow-sm";
              } else {
                btnColor = "opacity-40";
              }
            }

            return (
              <Button
                key={index}
                variant="outline"
                className={cn("h-16 text-lg justify-start px-4 border-2 transition-all", btnColor)}
                onClick={() => handleAnswer(index)}
                disabled={isAnswered}
              >
                <span className="w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold mr-3 text-gray-400 bg-gray-50">
                  {["A", "B", "C", "D"][index]}
                </span>
                <span className="truncate">{option.turkish}</span>
                
                {isAnswered && index === currentQ.correctIndex && <CheckCircle2 className="ml-auto text-green-600 w-6 h-6" />}
                {isAnswered && index === selectedOption && index !== currentQ.correctIndex && <XCircle className="ml-auto text-red-600 w-6 h-6" />}
              </Button>
            )
          })}
        </CardContent>

        {isAnswered && (
          <CardFooter className="pb-6 pt-0 animate-in fade-in slide-in-from-bottom-4">
            <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-md" onClick={handleNext}>
              {currentQIndex < questions.length - 1 ? "Sonraki Soru" : "Sonuçları Gör"} <ArrowRight className="ml-2" />
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}