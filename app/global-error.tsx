"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#000",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "24px" }}>
          <h1 style={{ margin: "0 0 12px", fontSize: "20px" }}>Application error</h1>
          <p style={{ margin: "0 0 20px", opacity: 0.7, fontSize: "14px" }}>
            {error.message || "An unexpected error occurred."}
          </p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
