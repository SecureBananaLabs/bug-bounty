import "./globals.css";
import { Navigation } from "../components/Navigation";

export const metadata = {
  title: "FreelanceFlow",
  description: "Full-stack freelance platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-shell site-header">
          <h1>FreelanceFlow</h1>
          <Navigation />
        </header>
        <main className="site-shell">
          {children}
        </main>
      </body>
    </html>
  );
}
