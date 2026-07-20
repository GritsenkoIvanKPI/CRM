import type { Metadata } from "next";
import { Bitter, Manrope } from "next/font/google";
import "./globals.css";

const bitter = Bitter({
  variable: "--font-bitter",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "G.Vision CRM",
  description: "Внутрішня CRM для відстеження лідів G.Vision",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className={`${bitter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        {children}
      </body>
    </html>
  );
}
