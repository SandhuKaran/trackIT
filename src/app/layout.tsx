// src/app/layout.tsx
import TRPCProvider from "@/components/TRPCProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>
          {children} <Toaster position="top-right" richColors />
        </TRPCProvider>
      </body>
    </html>
  );
}
