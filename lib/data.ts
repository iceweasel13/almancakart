import fs from 'fs';
import path from 'path';

// 1. Tip tanımı (Aynı)
export type Word = {
  id: number; // Bu ID artık direkt JSON'dan geliyor.
  word: string;
  example_de: string;
  translation_tr: string;
  example_tr: string;
  level: string;
  artikel_code: number;
  category: string;
};

// Sunucuda çalışan veri çekme fonksiyonu
export function getWordList(): Word[] {
  // 'data.json' dosyasının yolunu bul (ana dizin)
  const jsonFilePath = path.join(process.cwd(), 'data.json');
  
  console.log(`[lib/data.ts] 'data.json' dosyası şu yolda aranıyor: ${jsonFilePath}`);

  try {
    // Dosyayı oku
    const fileContents = fs.readFileSync(jsonFilePath, 'utf8');
    
    // JSON'u parse et
    const data: Word[] = JSON.parse(fileContents);
    
    console.log(`[lib/data.ts] Başarılı: ${data.length} kelime bulundu.`);
    
    // Veri zaten 'id'li olduğu için direkt döndürüyoruz.
    return data;

  } catch (error) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("[lib/data.ts] HATA: 'data.json' dosyası okunamadı veya parse edilemedi!");
    console.error(`[lib/data.ts] Hata Detayı:`, error.message);
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    
    // Hata olursa BOŞ liste döndür (bu da "kelime yok" ekranını açıklar)
    return [];
  }
}