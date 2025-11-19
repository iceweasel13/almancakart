/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, Volume2, ArrowRight, RotateCcw, Trophy, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Word = {
  id: number;
  german: string;
  german_sentence: string;
  turkish: string;
  artikel_code: number;
};

type Question = {
  target: Word;
  maskedSentence: string;
  options: Word[];
  correctIndex: number;
};

interface SentenceSessionProps {
  mode: "new" | "practice" | "review";
}

export default function SentenceSession({ mode }: SentenceSessionProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  // Yardımcı: Kelimenin artikelini (varsa) atıp kökünü döndürür
  // "der Zug" -> "Zug"
  const getCleanWord = (fullWord: string) => {
    const parts = fullWord.split(" ");
    // Eğer ilk kelime der/die/das ise at, değilse olduğu gibi bırak
    if (["der", "die", "das"].includes(parts[0].toLowerCase()) && parts.length > 1) {
      return parts.slice(1).join(" ");
    }
    return fullWord;
  };

  useEffect(() => {
    const prepareQuiz = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/auth/login");

      const { data: progress } = await supabase
        .from("user_progress")
        .select("word_id, is_learned")
        .eq("user_id", user.id);

      const learnedIds = progress?.filter(p => p.is_learned).map(p => p.word_id) || [];
      const seenIds = progress?.map(p => p.word_id) || [];

      // Sadece örnek cümlesi olan kelimeleri çek
      const { data: allWords } = await supabase
        .from("words")
        .select("id, german, german_sentence, turkish, artikel_code")
        .not("german_sentence", "is", null)
        .neq("german_sentence", "");

      if (!allWords || allWords.length < 4) {
        alert("Cümle alıştırması için yeterli veri yok.");
        return router.push("/");
      }

      // Havuz Filtreleme
      let targetPool: Word[] = [];
      if (mode === "new") {
         targetPool = allWords.filter((w: any) => !seenIds.includes(w.id));
      } else if (mode === "practice") {
         targetPool = allWords.filter((w: any) => seenIds.includes(w.id) && !learnedIds.includes(w.id));
      } else if (mode === "review") {
         targetPool = allWords.filter((w: any) => learnedIds.includes(w.id));
      }

      if (targetPool.length < 4) {
        // Eğer bu modda yeterli cümle yoksa, tüm havuzdan sor (Fallback)
        targetPool = allWords; 
      }

      // Soruları Oluştur
      const quizQuestions: Question[] = [];
      const questionCount = Math.min(10, targetPool.length);
      const shuffledTargets = targetPool.sort(() => 0.5 - Math.random()).slice(0, questionCount);

      for (const targetWord of shuffledTargets) {
        const cleanTarget = getCleanWord(targetWord.german);
        
        // Cümledeki kelimeyi bul ve gizle (Case insensitive regex)
        // Basit maskeleme: Kelimenin kökünü cümlede arar
        const regex = new RegExp(cleanTarget, "gi");
        
        // Eğer cümle içinde kelime geçmiyorsa (çekimlenmiş vs olabilir), bu soruyu atla
        if (!regex.test(targetWord.german_sentence)) continue;

        const maskedSentence = targetWord.german_sentence.replace(regex, "_______");

        // Şıkları oluştur
        const distractors: Word[] = [];
        while (distractors.length < 3) {
          const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
          if (randomWord.id !== targetWord.id && !distractors.find(d => d.id === randomWord.id)) {
            distractors.push(randomWord);
          }
        }

        const options = [...distractors];
        const correctIndex = Math.floor(Math.random() * 4);
        options.splice(correctIndex, 0, targetWord);

        quizQuestions.push({
          target: targetWord,
          maskedSentence,
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
      playSound("Richtig!");
    } else {
      playSound("Falsch.");
    }
    
    // Doğru cümleyi tam haliyle oku
    setTimeout(() => playSound(currentQ.target.german_sentence), 500);
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  if (isFinished) return (
    <div className="flex h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md text-center p-8 shadow-xl">
        <CardHeader className="flex flex-col items-center gap-4">
          <div className="p-4 bg-yellow-100 rounded-full text-yellow-600">
            <Trophy size={64} />
          </div>
          <CardTitle className="text-3xl text-blue-900">Tamamlandı!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-gray-600 mb-2">Skorun:</p>
          <div className="text-6xl font-bold text-blue-600 mb-6">
            {score} / {questions.length}
          </div>
          <Progress value={(score / questions.length) * 100} className="h-4 w-full" />
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

      <Card className="w-full max-w-md shadow-lg border-t-4 border-indigo-500">
        <CardHeader className="text-center py-10 bg-indigo-50/50 min-h-[200px] flex flex-col justify-center">
          <div className="flex justify-center mb-4">
             <MessageSquare className="w-10 h-10 text-indigo-400 opacity-50" />
          </div>
          {/* Cümle Gösterimi */}
          <h2 className="text-2xl font-medium text-gray-800 leading-relaxed px-2">
            {/* Cevaplandıysa tam cümleyi, değilse gizli halini göster */}
            {isAnswered ? (
                <>
                    {currentQ.target.german_sentence.split(new RegExp(getCleanWord(currentQ.target.german), "gi")).map((part, i, arr) => (
                        <span key={i}>
                            {part}
                            {i < arr.length - 1 && <span className="text-green-600 font-bold underline decoration-2 underline-offset-4">{getCleanWord(currentQ.target.german)}</span>}
                        </span>
                    ))}
                </>
            ) : (
                currentQ.maskedSentence
            )}
          </h2>
          <p className="text-gray-400 text-xs mt-4">Boşluğa hangi kelime gelmeli?</p>
        </CardHeader>
        
        <CardContent className="grid gap-3 p-6">
          {currentQ.options.map((option, index) => {
            let btnColor = "bg-white hover:bg-gray-50 border-gray-200 text-gray-700";
            if (isAnswered) {
              if (index === currentQ.correctIndex) {
                btnColor = "bg-green-100 border-green-500 text-green-800 font-bold"; 
              } else if (index === selectedOption) {
                btnColor = "bg-red-100 border-red-500 text-red-800";
              } else {
                btnColor = "opacity-40";
              }
            }

            return (
              <Button
                key={index}
                variant="outline"
                className={cn("h-14 text-lg justify-start px-4 border-2 transition-all", btnColor)}
                onClick={() => handleAnswer(index)}
                disabled={isAnswered}
              >
                <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs mr-3 text-gray-400">
                  {index + 1}
                </span>
                <span className="truncate">{option.german}</span> 
                {/* Şıklar Almanca olmalı */}
                
                {isAnswered && index === currentQ.correctIndex && <CheckCircle2 className="ml-auto text-green-600" />}
                {isAnswered && index === selectedOption && index !== currentQ.correctIndex && <XCircle className="ml-auto text-red-600" />}
              </Button>
            )
          })}
        </CardContent>

        {isAnswered && (
          <CardFooter className="pb-6 pt-0 animate-in fade-in slide-in-from-bottom-4">
            <Button className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-md" onClick={handleNext}>
              {currentQIndex < questions.length - 1 ? "Sonraki Soru" : "Sonuçları Gör"} <ArrowRight className="ml-2" />
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}