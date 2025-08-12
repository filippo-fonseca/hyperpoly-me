import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { AuthProvider } from "@/context/AuthContext";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <NavBar />
          {/* main grows to fill space */}
          <main className="mx-auto max-w-7xl px-4 py-6 flex-1">{children}</main>

          {/* footer sticks to bottom if content is short */}
          <footer className="mx-auto max-w-7xl pb-10 pt-6 text-xs text-black text-center mt-auto">
            © {new Date().getFullYear()} Filippo Fonseca. Made with ❤️.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
