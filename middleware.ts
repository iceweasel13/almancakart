import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middlewareClient";

export async function middleware(request: NextRequest) {
  // 1. Supabase istemcisini ve yanıtı oluştur
  const { supabase, response } = createClient(request);

  // 2. Kullanıcı oturumunu kontrol et
  // getUser() daha güvenlidir çünkü her seferinde Supabase Auth sunucusunu doğrular
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Korunacak sayfalar listesi (Auth sayfaları hariç her yer korunsun istiyoruz genelde)
  // Eğer kullanıcı yoksa ve login sayfasında DEĞİLSE, login'e yönlendir
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/_next") && // Next.js statik dosyaları
    !request.nextUrl.pathname.startsWith("/favicon.ico") &&
    !request.nextUrl.pathname.startsWith("/icons") // PWA ikonları
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return Response.redirect(url);
  }

  // 4. Eğer kullanıcı varsa ve login sayfasındaysa, ana sayfaya yönlendir
  if (user && request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return Response.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Tüm request yollarıyla eşleş, şunlar hariç:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};