/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/utils/supabase/server";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DictionaryPage() {
  const supabase = await createClient();

  // 1. Kullanıcı Kontrolü
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // 2. Kullanıcının 'Öğrendiği' kelimelerin ID'lerini çek
  const { data: learnedData } = await supabase
    .from("user_progress")
    .select("word_id")
    .eq("user_id", user.id)
    .eq("is_learned", true);

  // ID'leri bir diziye dönüştür (Örn: [1, 5, 20])
  const learnedIds = learnedData?.map((item) => item.word_id) || [];

  // 3. Sadece bu ID'lere sahip kelimeleri çek
  // Eğer hiç kelime öğrenilmemişse boş bir sorgu gönderip boş dizi alırız
  let words: any[] = [];
  
  if (learnedIds.length > 0) {
    const { data } = await supabase
      .from("words")
      .select("*")
      .in("id", learnedIds) // Filtreleme burada yapılıyor
      .order("id", { ascending: true });
      
    words = data || [];
  }
  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
                </Link>
            </Button>
            <h1 className="text-2xl font-bold text-blue-900">Kelime Listesi (Sözlük)</h1>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table >
                <TableCaption>Toplam {words?.length || 0} kelime listeleniyor.</TableCaption>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[50px]">Almanca</TableHead>
                    <TableHead className="w-[150px]">Türkçe </TableHead>
                    
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {words?.map((word) => (
                    <TableRow key={word.id}>
                       
                        <TableCell className="font-bold text-blue-800">{word.german}</TableCell>
                        <TableCell className="italic text-gray-600">{word.turkish}</TableCell>
                        
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
