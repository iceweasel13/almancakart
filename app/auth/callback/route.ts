import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code as string);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Hata olursa login sayfasına geri gönder
  return NextResponse.redirect(`${origin}/auth/login?error=auth-code-error`);
}
