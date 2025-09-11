import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AudioSeparator - AI-Powered Voice & Music Separation",
  description: "Separate voice and music from any audio or video file using advanced AI technology. High-quality track extraction made simple.",
  keywords: ["audio separation", "voice extraction", "music isolation", "AI audio processing", "track separation"],
  authors: [{ name: "AudioSeparator Team" }],
  openGraph: {
    title: "AudioSeparator - AI-Powered Voice & Music Separation",
    description: "Separate voice and music from any audio or video file using advanced AI technology.",
    type: "website",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fillOpacity='0.03' fillRule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            <div className="relative z-10">
              <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">AS</span>
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-white">AudioSeparator</h1>
                        <p className="text-sm text-gray-400">AI-Powered Audio Separation</p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center space-x-6 text-sm text-gray-300">
                      <span className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>High Quality AI</span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Multiple Formats</span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Instant Download</span>
                      </span>
                    </div>
                  </div>
                </div>
              </header>
              <main className="container mx-auto px-4 py-8">
                {children}
              </main>
              <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm mt-16">
                <div className="container mx-auto px-4 py-6">
                  <div className="text-center text-gray-400 text-sm">
                    <p>&copy; 2024 AudioSeparator. Advanced AI-powered audio separation technology.</p>
                    <p className="mt-2">Separate voice and music tracks with professional quality results.</p>
                  </div>
                </div>
              </footer>
            </div>
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}