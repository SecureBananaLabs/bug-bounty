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
        <main>
          <h1>FreelanceFlow</h1>
          <Navigation currentUserRole={undefined} />
          {children}
        </main>
      </body>
    </html>
  );
}
