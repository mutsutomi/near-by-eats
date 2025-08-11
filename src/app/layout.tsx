import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Near-by Eats - 近くのレストラン検索",
  description: "現在地から近くのレストランを見つけます",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}