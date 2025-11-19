import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { redirect } from "next/navigation";
import PracticeHub from "@/components/PracticeHub";

// Server Component (Doğrudan veritabanına bağlanır)
export default async function HomePage() {
  const supabase = await createClient();

  // 1. Kullanıcı Giriş Yapmış mı?
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // 2. Toplam Kelime Sayısını Çek
  const { count: totalWords } = await supabase
    .from("words")
    .select("*", { count: 'exact', head: true });

  // 3. Öğrenilen Kelime Sayısını Çek
  const { count: learnedCount } = await supabase
    .from("user_progress")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", user.id)
    .eq("is_learned", true);

  // İlerleme Yüzdesi
  const progressPercentage = ((learnedCount || 0) / (totalWords || 1)) * 100;

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4 pb-20">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center">
          <CardTitle className="text-3xl font-bold text-blue-900">
            Almanca Kelime Avcısı
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          
          {/* İlerleme Çubuğu */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm font-medium text-gray-700">
              <span>Öğrenilen Kelimeler</span>
              <span className="font-semibold">
                {learnedCount || 0} / {totalWords || 0}
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full h-3" />
          </div>

          {/* Butonlar */}
          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white font-semibold text-base py-6">
              <Link href="/new">Yeni Ders Başlat (15 Kelime)</Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="border-blue-900 text-blue-900 py-6">
              <Link href="/practice">Pratik Yap (Görülenler)</Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="border-blue-900 text-blue-900 py-6">
              <Link href="/review">Öğrendiklerim (Genel Tekrar)</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-blue-900 text-blue-900 py-6">
              <Link href="/dictionary">Öğrenilmiş Kelimeleri Gör (Sözlük)</Link>
            </Button>

          </div>


        

        </CardContent>
      </Card>
    </main>
  );
}