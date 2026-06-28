// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import QueryProvider from "@/components/provider/QueryProvider";
import { ThemeProvider } from "@/components/provider/ThemeProvider";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EventSphere AI",
  description: "The ultimate AI-powered events platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        {/* Wrap your layout items here so TanStack query state is available everywhere */}
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          {/* Core Header Navigation */}
          <Header />
          
          {/* Contextual Sub-Navbar links */}
          <Navbar />
          
          {/* Main Content Viewport */}
          <main className="flex-1">
            {children}
          </main>

          {/* Global Footer Platform Branding */}
          <Footer />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
