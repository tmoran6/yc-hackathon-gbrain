export const metadata = {
  title: "Footage dashboard",
  description: "Hackathon footage capture dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          margin: 0,
          padding: "2rem",
          background: "#0b0d10",
          color: "#e8e8e8",
        }}
      >
        {children}
      </body>
    </html>
  );
}
