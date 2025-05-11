import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "../components/ui/sonner";
import { SessionProvider } from "next-auth/react";

import Logo from "@/public/logo.svg"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MeControla.AI",
  description: "Aplicativo de gestão financeira.",
  icons: {
    icon: Logo.src
  },
  themeColor: [ // Define as cores do tema para a meta tag inicial
    { media: '(prefers-color-scheme: light)', color: '#ffffff' }, // Sua cor para o tema claro
    { media: '(prefers-color-scheme: dark)', color: '#000000' },  // Sua cor para o tema escuro
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <html lang="en" suppressHydrationWarning>
        <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SessionProvider>
            {children}
          </SessionProvider>
          <Toaster />
        </body>
      </html>
    </ThemeProvider>
  );
}
