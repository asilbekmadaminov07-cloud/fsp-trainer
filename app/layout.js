import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';

export const metadata = {
  title: 'FSP Trainer',
  description: 'Fachsprachprüfung Zahnmedizin — interaktives Training'
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <div className="orbs" aria-hidden="true">
          <span className="orb a" /><span className="orb b" /><span className="orb c" />
        </div>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
