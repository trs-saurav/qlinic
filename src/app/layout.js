// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from '@/context/AppContext'
import { Toaster } from 'react-hot-toast'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/theme-provider'
import FetchInterceptor from '@/components/FetchInterceptor'

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <FetchInterceptor />
            <Toaster 
              position="top-center"
              toastOptions={{ 
                className: 'bg-background text-foreground border border-border',
                duration: 4000,
                style: {
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                }
              }} 
            />
            <AppContextProvider>
              {children}
            </AppContextProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
