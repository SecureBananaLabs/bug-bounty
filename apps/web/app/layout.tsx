import "./globals.css";
import { Navigation } from "../components/Navigation";
import { currentUser } from "../lib/mock";

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
          <Navigation currentUserRole={currentUser.role} />
          {children}
        </main>
      </body>
    </html>
  );
}
