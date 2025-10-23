import { Outfit } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/Auth/AuthWrapper";
import { SnackbarProvider } from "./context/SnackbarContext"; // Add this import

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata = {
  title: "LogiTrack - Transport Logistics",
  description: "Professional logistics management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased`}>
        <SnackbarProvider> {/* Add this wrapper */}
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </SnackbarProvider> {/* Close the wrapper */}
      </body>
    </html>
  );
}