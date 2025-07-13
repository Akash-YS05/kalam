import type { Metadata } from "next";
import { Geist, Geist_Mono, Satisfy, Gotu, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";

// Load fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const gotu = Gotu({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gotu",
});
const satisfy = Satisfy({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-satisfy",
});
const devanagri = Noto_Serif_Devanagari({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["devanagari"],
  variable: "--font-devanagari",
});
export const metadata: Metadata = {
  title: "Kalam",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${satisfy.variable} ${gotu.variable} ${devanagri.variable}`}>
        {children}
      </body>
    </html>
  );
}
