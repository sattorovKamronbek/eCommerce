import { copy } from "@/messages";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { storeConfig } from "@/lib/config";
import "../globals.css";
export const metadata: Metadata = {
  title: {
    default: `${storeConfig.name} — Hayotga did bilan`,
    template: `%s | ${storeConfig.name}`,
  },
  description: copy.uyingizVaKundalikHayotingizUchunDid,
  applicationName: storeConfig.name,
  openGraph: { siteName: storeConfig.name },
  robots: { index: false, follow: false },
  icons: { icon: storeConfig.brand.icon },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body>
        <Providers enableSystem>
          <a className="skip-link" href="#asosiy">
            {copy.asosiyMazmungaOtish}
          </a>
          <Header />
          <main id="asosiy">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
