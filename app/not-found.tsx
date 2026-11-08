import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#000",
        color: "#fff",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <div>
        <h1 style={{ margin: "0 0 12px", fontSize: "20px", letterSpacing: "0.12em" }}>
          Page not found
        </h1>
        <Link
          href="/"
          style={{
            color: "rgba(255,255,255,0.75)",
            textDecoration: "none",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontSize: "12px",
          }}
        >
          Back to opening
        </Link>
      </div>
    </div>
  );
}
