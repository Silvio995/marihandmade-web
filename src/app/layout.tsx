import { getCategories } from "@/lib/api/catalog";
import "./globals.css";
import localFont from "next/font/local";
import Header from "@/components/native/nav/parent";
import Footer from "@/components/native/Footer";
import { Providers } from "./providers";

const inter = localFont({
  src: "../../public/fonts/Inter/inter-var-latin.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "MarìShop",
  description: "Creazioni fatte a mano MariHandmade",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories().catch(() => []);
  return (
    <html lang="it">
      <body
        className={`${inter.variable} bg-shop-cream font-sans text-shop-ink`}
      >
        <Providers>
          <Header categories={categories} />
          <div>{children}</div>
          <Footer categories={categories} />
        </Providers>
      </body>
    </html>
  );
}
