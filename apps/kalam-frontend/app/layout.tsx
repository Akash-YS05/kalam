import type { Metadata } from "next";
import { Geist, Geist_Mono, Satisfy, Gotu } from "next/font/google";
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
export const metadata: Metadata = {
  title: "Kalam",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${satisfy.variable} ${gotu.variable}`}>
        {children}
      </body>
    </html>
  );
}
