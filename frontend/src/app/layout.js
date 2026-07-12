import { AuthProvider } from "../context/AuthContext";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata = {
  title: "AssetFlow — Enterprise Asset & Resource Management",
  description: "Track asset lifecycles, allocations, maintenance, and resource bookings.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-surface text-ink">
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
