import "./globals.css";

export const metadata = {
  title: "Plan.Works — Electrical Layout Tool",
  description: "Drag-and-drop electrical symbols onto architectural drawings",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
