export default function Home() {
  return (
    <main style={{ maxWidth: 720 }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Footage dashboard</h1>
      <p style={{ opacity: 0.7 }}>
        Hackathon scaffold. Upload flow is two steps:
      </p>
      <ol>
        <li>
          <code>POST /api/uploads</code> with{" "}
          <code>{`{ username, captured_at }`}</code> to reserve a row and get
          an <code>id</code>.
        </li>
        <li>
          Connect directly to Postgres and{" "}
          <code>UPDATE screenshots SET image_data=..., status='uploaded'</code>{" "}
          for that <code>id</code>.
        </li>
      </ol>
    </main>
  );
}
