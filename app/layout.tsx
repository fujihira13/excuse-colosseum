import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "言い訳コロシアム",
  description: "AI審査員を相手に言い訳で勝負するテキストゲーム",
  icons: {
    icon: "/arena-glyph.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
