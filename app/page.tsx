// Shadcn component'lerini import ediyoruz.
// Bu component'leri projenize `npx shadcn-ui@latest add card button progress`
// komutlarıyla eklediğinizi varsayıyorum.
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

// Ana sayfa component'i
export default function HomePage() {
  const learnedWords = 0;
  const totalWords = 979;
  const progressPercentage = (learnedWords / totalWords) * 100;

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
      {/* Tasarımınızı ortalayan ve ekran görüntüsündekine benzer
        bir genişlik veren ana kart.
      */}
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center">
          {/* Ana Başlık */}
          <CardTitle className="text-3xl font-bold text-blue-900">
            Almanca Kelime Avcısı
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* İlerleme (Progress) Bölümü */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm font-medium text-gray-700">
              <span>Öğrenilen Kelimeler</span>
              <span className="font-semibold">
                {learnedWords} / {totalWords}
              </span>
            </div>
            {/* Shadcn Progress component'i */}
            <Progress value={progressPercentage} className="w-full h-3" />
          </div>

          {/* Aksiyon Butonları Bölümü */}
          <div className="flex flex-col gap-3">
            {/* Shadcn Button component'leri.
              Ekran görüntüsündeki gibi yeşil ve outline stilleri için
              Tailwind class'ları ile özelleştiriyoruz.
            */}
                 <Link href={'/new'} >
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold text-base py-6 w-full"
            >
              Yeni Ders Başlat (15 Kelime)
            </Button>
            </Link>
             <Link href={'/practice'} >
             
            <Button
              size="lg"
              variant="outline"
              className="border-blue-900 text-blue-900 hover:bg-blue-50 hover:text-blue-900 font-semibold text-base py-6 w-full"
            >
              Pratik Yap (Görülenler)
            </Button>
            </Link>
                 <Link href={'/review'} >
            <Button
              size="lg"
              variant="outline"
              className="border-blue-900 text-blue-900 hover:bg-blue-50 hover:text-blue-900 font-semibold text-base py-6 w-full"
            >
              Öğrendiklerim (Genel Tekrar)
            </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}