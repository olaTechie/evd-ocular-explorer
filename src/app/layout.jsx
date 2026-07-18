import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "EVD Ocular Explorer — ocular complications in Ebola survivors",
  description:
    "Interactive evidence companion to a systematic review and meta-analysis of ocular complications in Ebola virus disease survivors: 53 studies, 13 pooled outcomes, with per-study risk of bias.",
};

// Avoid a flash of the wrong theme before hydration.
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <footer className="site">
          <div className="container">
            <p style={{ margin: "0 0 4px" }}>
              <strong>EVD Ocular Explorer</strong> — companion to a systematic review of ocular complications in
              Ebola virus disease survivors. All values derive from the corrected, source-verified dataset (53 studies).
            </p>
            <p style={{ margin: 0 }} className="faint">
              Prevalence estimates use Freeman–Tukey double-arcsine transformation with DerSimonian–Laird random
              effects. This tool summarises published data; it is not medical advice. Built with assistance from an AI
              coding tool — see <a href="/about/">About</a>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
