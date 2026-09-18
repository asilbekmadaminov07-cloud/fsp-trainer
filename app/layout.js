import './globals.css';

export const metadata = {
  title: 'FSP Trainer',
  description: 'Fachsprachprüfung Zahnmedizin — interaktives Training'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F2F8FD'
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        {/* Fonda sekin suzuvchi yorug'lik sharlari */}
        <div className="orbs" aria-hidden="true">
          <span className="orb a" /><span className="orb b" /><span className="orb c" />
        </div>
        {children}
      </body>
    </html>
  );
}
