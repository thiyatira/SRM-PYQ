import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "katex/dist/katex.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_NAME = "SRM StudyHub";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://srm-pyq.vercel.app";
const DESCRIPTION =
  "SRM StudyHub: browse SRMIST previous year question papers with math and code rendering, and view your Academia attendance, timetable and marks in one place.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — PYQs & Academia`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — PYQs & Academia`,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — PYQs & Academia`,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Only load Google Analytics when a (well-formed) measurement ID is configured.
const rawGaId = process.env.NEXT_PUBLIC_GA_ID?.trim();
const GA_MEASUREMENT_ID = rawGaId && /^[A-Za-z0-9-]+$/.test(rawGaId) ? rawGaId : undefined;

// Runs before first paint: applies the saved (or system) theme to <html> so the
// page never flashes the wrong theme and React hydration is unaffected.
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("darkMode");var d=s==="1"||(s!=="0"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
