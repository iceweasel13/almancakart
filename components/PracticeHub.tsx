"use client";

import { useState } from "react";
import FlashcardSession from "@/components/FlashcardSession";
import QuizSession from "@/components/QuizSession";
import ArticleSession from "@/components/ArticleSession";
import SentenceSession from "@/components/SentenceSession"; // YENİ İMPORT
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, CheckSquare, WholeWord, ArrowLeft, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

interface PracticeHubProps {
  mode: "new" | "practice" | "review";
}

export default function PracticeHub({ mode }: PracticeHubProps) {
  const [selectedMode, setSelectedMode] = useState<"menu" | "flashcard" | "quiz" | "article" | "sentence">("menu");
  const router = useRouter();

  // Mod Yönlendirmeleri
  if (selectedMode === "flashcard") return <FlashcardSession mode={mode} />;
  if (selectedMode === "quiz") return <QuizSession mode={mode} />;
  if (selectedMode === "article") return <ArticleSession mode={mode} />;
  if (selectedMode === "sentence") return <SentenceSession mode={mode} />; // YENİ MOD

  const title = mode === "review" ? "Öğrendiklerim (Tekrar)" : "Pratik Yap (Görülenler)";
  const description = mode === "review" 
    ? "Öğrendiğin kelimeleri tekrar ederek hafızanda taze tut." 
    : "Daha önce gördüğün ama henüz tam öğrenemediğin kelimelere çalış.";

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-center gap-6">
      <div className="w-full max-w-md flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfa
        </Button>
        <h1 className="text-lg font-bold text-blue-900 truncate">{title}</h1>
      </div>

      <p className="text-gray-500 text-center max-w-md text-sm">{description}</p>

      <div className="w-full max-w-md grid gap-4">
        {/* 1. Kartlarla Çalış */}
        <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-blue-200"
            onClick={() => setSelectedMode("flashcard")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <Layers size={32} />
            </div>
            <div>
                <h2 className="font-bold text-lg">Kartlarla Çalış</h2>
                <p className="text-sm text-gray-500">Klasik flashcard yöntemiyle çalış.</p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Çoktan Seçmeli (Quiz) */}
        <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-green-200"
            onClick={() => setSelectedMode("quiz")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-green-100 rounded-full text-green-600">
                <CheckSquare size={32} />
            </div>
            <div>
                <h2 className="font-bold text-lg">Quiz Modu</h2>
                <p className="text-sm text-gray-500">4 şıklı test ile kendini sına.</p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Artikel Avcısı */}
        <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-purple-200"
            onClick={() => setSelectedMode("article")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                <WholeWord size={32} />
            </div>
            <div>
                <h2 className="font-bold text-lg">Artikel Avcısı</h2>
                <p className="text-sm text-gray-500">Der, Die, Das? Doğrusunu bul.</p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Cümle Tamamlama (YENİ) */}
        <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-indigo-200"
            onClick={() => setSelectedMode("sentence")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                <MessageSquare size={32} />
            </div>
            <div>
                <h2 className="font-bold text-lg">Cümle Tamamlama</h2>
                <p className="text-sm text-gray-500">Boşlukları doğru kelimeyle doldur.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}