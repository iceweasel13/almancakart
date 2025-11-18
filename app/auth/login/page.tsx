"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Mail, KeyRound, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // 1. Adım: E-posta ile Kod İste
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Link yerine sadece kod göndermesini sağlıyoruz
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setStep("otp");
      setMessage({
        type: "success",
        text: "6 haneli kod email adresinize gönderildi.",
      });
    }
    setLoading(false);
  };

  // 2. Adım: Kodu Doğrula ve Giriş Yap
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (error) {
      setMessage({ type: "error", text: "Kod hatalı veya süresi dolmuş." });
    } else {
      // Başarılı giriş -> Direkt Ana sayfaya (/)
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-blue-900">
          {step === "email" ? "Giriş Yap" : "Kodu Gir"}
        </CardTitle>
        <CardDescription>
          {step === "email"
            ? "Email adresinizi girin, size giriş kodu gönderelim."
            : `${email} adresine gönderilen 6 haneli kodu girin.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div className="space-y-2">
              <input
                type="email"
                placeholder="ornek@email.com"
                required
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Kod Gönder
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="123456"
                required
                autoComplete="one-time-code" // Mobilde kodu klavyeden otomatik çekmesi için
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg tracking-widest ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 h-12" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Doğrulanıyor...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Giriş Yap
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setStep("email"); setMessage(null); }}
              className="text-sm text-gray-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              E-postayı değiştir
            </Button>
          </form>
        )}

        {message && (
          <div
            className={`mt-4 p-3 rounded-md text-sm ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}
      </CardContent>
    </Card>
  );
}