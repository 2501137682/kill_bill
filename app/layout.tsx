import type { Metadata } from "next";
import { Bebas_Neue, IBM_Plex_Mono, Lora, Varela_Round } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-title",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["300", "400"],
  subsets: ["latin"],
  variable: "--font-metadata",
});

const ibmPlexMonoBold = IBM_Plex_Mono({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-credit",
});

const varelaRound = Varela_Round({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-scene1-round",
});

const lora = Lora({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-scene1-serif",
});

export const metadata: Metadata = {
  title: "Kill Bill",
  description: "An interactive cinematic experience inspired by Kill Bill Vol.1 & Vol.2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bebasNeue.variable} ${ibmPlexMono.variable} ${ibmPlexMonoBold.variable} ${varelaRound.variable} ${lora.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
