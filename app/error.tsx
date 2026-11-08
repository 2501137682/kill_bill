"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#000",
        color: "#fff",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ margin: "0 0 12px", fontSize: "20px", letterSpacing: "0.12em" }}>
          Something went wrong
        </h1>
        <p style={{ margin: "0 0 20px", opacity: 0.7, fontSize: "14px" }}>
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            border: "1px solid rgba(255,255,255,0.35)",
            background: "transparent",
            color: "#fff",
            padding: "10px 18px",
            cursor: "pointer",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontSize: "12px",
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
