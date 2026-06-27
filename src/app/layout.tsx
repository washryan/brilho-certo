import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://brilho-certo.vercel.app"),
  title: "Brilho Certo | Agendamento de Faxina Residencial",
  description:
    "Agende sua faxina residencial com praticidade, cuidado e confirmação pelo WhatsApp.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Brilho Certo | Agendamento de Faxina Residencial",
    description:
      "Limpeza com cuidado, confiança e confirmação rápida pelo WhatsApp.",
    url: "https://brilho-certo.vercel.app",
    siteName: "Brilho Certo",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Brilho Certo - Agendamento de faxina residencial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brilho Certo | Agendamento de Faxina Residencial",
    description:
      "Limpeza com cuidado, confiança e confirmação rápida pelo WhatsApp.",
    images: ["/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
