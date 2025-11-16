// src/app/layout.tsx
import TRPCProvider from "@/components/TRPCProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import Image from "next/image";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Added dark theme classes for consistency */}
      <body className="dark bg-black text-white">
        <TRPCProvider>
          {/* his div creates the sticky footer layout */}
          <div className="flex min-h-screen flex-col">
            {/* Header section */}
            <header className="flex justify-center pt-10">
              <Image
                src="/logo.png"
                alt="GNW Landscaping Logo"
                width={120}
                height={100}
                className="rounded-sm"
                priority
              />
            </header>

            <main className="flex-grow">{children}</main>

            {/* Footer section */}
            <footer className="border-t border-gray-700 py-4 px-4 text-center text-xs text-gray-400">
              Copyright © 2025 | Greenworks Construction and Companies Inc. |
              All Rights Reserved.
            </footer>
          </div>

          <Toaster position="top-right" richColors />
        </TRPCProvider>
      </body>
    </html>
  );
}
