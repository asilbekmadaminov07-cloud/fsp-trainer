import './globals.css';

export const metadata = {
  title: 'FSP Trainer',
  description: 'Fachsprachprüfung Zahnmedizin — interaktives Training'
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
