export function AuthShell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #3d2c25 0%, #6b4c3b 55%, #3d2c25 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          opacity: 0.06,
          pointerEvents: "none",
          backgroundImage:
            "repeating-linear-gradient(45deg, #c9a96e 0, #c9a96e 1px, transparent 0, transparent 50%)",
          backgroundSize: "20px 20px",
        }}
      />
      <div
        style={{
          background: "rgba(255,255,255,0.97)",
          borderRadius: 20,
          padding: "44px 40px",
          width: "100%",
          maxWidth: 460,
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              fontSize: "0.72rem",
              letterSpacing: "0.35em",
              color: "#c9a96e",
              textTransform: "uppercase",
              fontFamily: "'Jost', sans-serif",
              marginBottom: 8,
            }}
          >
            Wedding
          </div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 300,
              color: "#3d2c25",
              letterSpacing: "0.04em",
              lineHeight: 1.1,
              marginBottom: 4,
            }}
          >
            Budget Tracker
          </h1>
          <div
            style={{
              fontStyle: "italic",
              color: "#a08070",
              fontSize: "0.9rem",
            }}
          >
            Every detail, beautifully planned
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, error, children }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "0.68rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#b5998a",
          fontFamily: "'Jost', sans-serif",
          marginBottom: 5,
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <div
          style={{
            fontSize: "0.72rem",
            color: "#c47b7b",
            fontFamily: "'Jost', sans-serif",
            marginTop: 3,
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
