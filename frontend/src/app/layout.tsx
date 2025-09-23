"use client";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { ThemeProvider } from "next-themes";
import ScrollToTop from "@/components/ScrollToTop";
import Aoscompo from "@/utils/aos";
import { usePathname } from "next/navigation";
import ToasterContext from "@/app/api/contex/ToasetContex";

const font = DM_Sans({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isDashboardArea = pathname?.startsWith('/dashboard') || pathname?.startsWith('/profile') || pathname?.startsWith('/verify') || pathname?.startsWith('/admin') || pathname?.startsWith('/send') || pathname?.startsWith('/support') || pathname?.startsWith('/notifications') || pathname?.startsWith('/receive');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className}`}>
        <ThemeProvider
          attribute="class"
          enableSystem={true}
          defaultTheme="system"
        >
          <ToasterContext />
          <Aoscompo>
            {!isDashboardArea && <Header />}
            {children}
            {!isDashboardArea && <Footer />}
          </Aoscompo>
          {!isDashboardArea && <ScrollToTop />}
        </ThemeProvider>
      </body>
    </html>
  );
}
