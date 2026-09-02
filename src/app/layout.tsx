import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "PointBot Dashboard",
  description: "Configure your PointBot servers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-discord-darker text-gray-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
