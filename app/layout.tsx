import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Roboto_Slab } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/lib/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const robotoSlabHeading = Roboto_Slab({ subsets: ['latin'], variable: '--font-heading' });

const roboto = Roboto({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tracfin Surveillance Module - Example App",
  description: "Example application showcasing a transaction monitoring module for Tracfin, built with Next.js and TypeScript.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", roboto.variable, robotoSlabHeading.variable)}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-50 border-b border-primary/20 bg-primary text-primary-foreground">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary-foreground/15 flex items-center justify-center">
                <span className="font-heading font-black text-xs tracking-wider">TF</span>
              </div>
              <span className="font-heading font-semibold text-base tracking-wide">Tracfin</span>
            </div>
            <span className="h-4 w-px bg-primary-foreground/25" />
            <span className="text-primary-foreground/60 text-xs font-medium tracking-wider uppercase">Surveillance module</span>
          </div>
        </header>
        <TooltipProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </TooltipProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
