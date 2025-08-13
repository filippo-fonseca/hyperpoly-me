import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { AuthProvider } from "@/context/AuthContext";
import localFont from "next/font/local";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hyperpoly",
  description: "Daily language journal for a hyperpolyglot.",
};

const louize = localFont({
  src: [
    {
      path: "../../public/fonts/louize-regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/louize-medium.otf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-louize",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${louize.variable} ${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <NavBar />
          {/* main grows to fill space */}
          <main className="mx-auto max-w-7xl px-4 py-6 flex-1">{children}</main>

          {/* footer sticks to bottom if content is short */}
          <footer className="font-mono mx-auto max-w-7xl pb-10 pt-6 text-xs text-black text-center mt-auto">
            © {new Date().getFullYear()}{" "}
            <Link
              className="underline font-bold hover:scale-105 hover:text-black text-gray-700 transition-all"
              href="https://filippofonseca.com"
              target="_blank"
            >
              Filippo Fonseca
            </Link>
            . Made with ❤️ from wherever I may be right now.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
