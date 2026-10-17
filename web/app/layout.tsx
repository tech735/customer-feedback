import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Customer Experience & Feedback · Kotu",
  description: "Tell Kotu how we're doing. Every response is read by our team.",
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#02019B",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" richColors theme="light" />
      </body>
    </html>
  );
}
