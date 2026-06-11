import { useState } from "react"
import { AuthShell } from "./AuthShell"
import { useAuth } from "../hooks/useAuth"

export default function LoginPage({ onGoRegister }) {
  const { login } = useAuth()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!username.trim() || !password) {
      setError("Please enter your username and password")
      return
    }
    setLoading(true)
    setError("")
    try {
      await login(username.trim(), password)
    } catch (err) {
      setError(err.message || "Incorrect username or password")
    } finally {
      setLoading(false)
    }
  }

  const labelStyle = {
    display: "block",
    fontSize: "0.68rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#b5998a",
    fontFamily: "'Jost', sans-serif",
    marginBottom: 5,
  }

  return (
    <AuthShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Username */}
        <div>
          <label style={labelStyle}>Username</label>
          <input
            className={`auth-input ${error ? "error" : ""}`}
            value={username}
            placeholder="your username"
            autoFocus
            autoCapitalize="none"
            disabled={loading}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("")
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>
        {/* Password */}
        <div>
          <label style={labelStyle}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              className={`auth-input ${error ? "error" : ""}`}
              type={showPw ? "text" : "password"}
              value={password}
              placeholder="••••••••"
              disabled={loading}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("")
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <button
              onClick={() => setShowPw((v) => !v)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#b5998a",
                fontSize: "0.78rem",
              }}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {/* Error */}
        {error && (
          <div
            style={{
              fontSize: "0.82rem",
              color: "#c47b7b",
              fontFamily: "'Jost', sans-serif",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
        {/* Submit */}
        <button
          className="primary-btn"
          onClick={handleLogin}
          disabled={loading}
          style={{ marginTop: 4 }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
        {/* Register link */}
        <div
          style={{
            textAlign: "center",
            fontFamily: "'Jost', sans-serif",
            fontSize: "0.84rem",
            color: "#a08070",
          }}
        >
          Don&apos;t have an account?{" "}
          <button className="link-btn" onClick={onGoRegister}>
            Create one
          </button>
        </div>
      </div>
    </AuthShell>
  )
}
