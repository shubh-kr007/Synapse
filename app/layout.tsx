import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import Beams from "@/components/ui/Beams/Beams";

import "./globals.css";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synapse.hr",
  description: "An AI-powered platform for preparing for mock interviews",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${monaSans.className} antialiased bg-slate-950 text-slate-100`}
      >
        <div className="fixed top-0 left-0 w-full h-full -z-10 opacity-50">
          <Beams />
        </div>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
