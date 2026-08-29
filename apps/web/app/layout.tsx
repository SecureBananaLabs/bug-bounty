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
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <main>
          <h1>FreelanceFlow</h1>
          <Navigation />
          <section id="main-content" tabIndex={-1}>
            {children}
          </section>
        </main>
      </body>
    </html>
  );
}
