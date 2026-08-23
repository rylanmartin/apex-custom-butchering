import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://www.apexcustombutchering.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Apex Custom Butchering | Owosso, MI",
    template: "%s | Apex Custom Butchering",
  },
  description:
    "Custom beef, pork, sheep, goat, and deer processing in Owosso, Michigan. Schedule processing, view pricing, request meat, and access cut sheets.",
  applicationName: "Apex Custom Butchering",
  category: "business",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/apex-logo-icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apex-logo-icon.png", type: "image/png", sizes: "180x180" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Apex Custom Butchering",
    title: "Apex Custom Butchering | Owosso, MI",
    description:
      "Custom beef, pork, sheep, goat, and deer processing in Owosso, Michigan.",
    images: [
      {
        url: "/apex-logo-social.png",
        width: 1200,
        height: 630,
        alt: "Apex Custom Butchering logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Apex Custom Butchering | Owosso, MI",
    description:
      "Custom beef, pork, sheep, goat, and deer processing in Owosso, Michigan.",
    images: ["/apex-logo-social.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "geo.region": "US-MI",
    "geo.placename": "Owosso",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090909",
};

const localBusinessData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Apex Custom Butchering",
  url: siteUrl,
  logo: `${siteUrl}/apex-logo-icon.png`,
  image: `${siteUrl}/apex-logo-social.png`,
  telephone: "+1-989-323-1187",
  address: {
    "@type": "PostalAddress",
    streetAddress: "155 W Henderson Rd.",
    addressLocality: "Owosso",
    addressRegion: "MI",
    postalCode: "48867",
    addressCountry: "US",
  },
  areaServed: {
    "@type": "City",
    name: "Owosso",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessData) }}
        />
      </body>
    </html>
  );
}
