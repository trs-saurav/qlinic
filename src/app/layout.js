import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from '@/context/AppContext'
import { Toaster } from 'react-hot-toast'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "QLINIC",
  description: "YOUR HEALTH IS OUR PRIORITY",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster toastOptions={{ className: 'bg-background text-foreground border border-border' }} />
            <AppContextProvider>{children}</AppContextProvider>
          </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
