import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AppProvider } from "@/lib/AppContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tiến Độ Nhóm",
  description: "Dashboard nội bộ theo dõi tiến độ của 5 phòng ban vận hành",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <AppProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:pt-0 pt-14 overflow-x-hidden">
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
