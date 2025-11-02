import type { Metadata } from "next";
import { Geist, Geist_Mono, Satisfy, Gotu, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

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
  title: "Kalam: Digital Whiteboard for Brainstorming & Collaboration",
  description:
    "Kalam is a fast, interactive digital whiteboard designed for seamless brainstorming, diagramming, and real-time collaboration. Enhance productivity and creativity with an intuitive canvas.",
  keywords: [
    "Kalam",
    "digital whiteboard",
    "online whiteboard",
    "brainstorming tool",
    "real-time collaboration",
    "diagramming app",
    "team productivity",
    "interactive whiteboard",
    "collaborative workspace"
  ],
  authors: [{ name: "Akash", url: "https://akassh.tech" }],
  creator: "Akash Pandey",
  openGraph: {
    title: "Kalam: Brainstorm, Diagram, and Collaborate in Real-Time",
    description:
      "Experience a seamless and interactive digital whiteboard with Kalam. Perfect for teams looking to brainstorm, diagram, and collaborate efficiently.",
    url: "https://kalamm.vercel.app",
    siteName: "Kalam",
    images: [
      {
        url: "https://res.cloudinary.com/ddkt00y0i/image/upload/v1752856969/gradii-1920x1080_10_flremb.png", 
        width: 1200,
        height: 630,
        alt: "Kalam: Digital Whiteboard",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalam: Digital Whiteboard for Collaboration",
    description:
      "Kalam is a real-time digital whiteboard for brainstorming, diagramming, and team collaboration.",
    images: ["https://res.cloudinary.com/ddkt00y0i/image/upload/v1752856969/gradii-1920x1080_10_flremb.png"],
    creator: "@akashpandeytwt",
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${satisfy.variable} ${gotu.variable} ${devanagri.variable}`}>
        {children}
        <Analytics/>
      </body>
    </html>
  );
}
