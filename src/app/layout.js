import "../index.css";

export const metadata = {
  title: "Realtime Chat",
  description: "A real-time chat application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
