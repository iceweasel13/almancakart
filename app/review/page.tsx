import FlashcardSession from "@/components/FlashcardSession";
import { getWordList } from "@/lib/data";

export default function TekrarPage() {
  const allWords = getWordList();
  return (
   
    <FlashcardSession mode="review" allWords={allWords} />
  );
}