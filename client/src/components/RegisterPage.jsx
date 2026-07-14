import { useState } from "react"
import { AuthShell, Field } from "./AuthShell"
import { useAuth } from "../hooks/useAuth"

export default function RegisterPage({ onGoLogin }) {
  const { register } = useAuth()

  const [step, setStep] = useState(1)
  const [role, setRole] = useState(null)
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [coupleName, setCoupleName] = useState("")
  const [coupleCode, setCoupleCode] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  function clearError(field) {
    setErrors((prev) => ({ ...prev, [field]: null }))
  }

  function validateStep2() {
    const e = {}
    if (!displayName.trim()) return (e.displayName = "Required")
    if (!username.trim()) return (e.username = "Required")
    else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim()))
      return (e.username = "Letters, numbers, - and _ only")
    if (password.length < 6) return (e.password = "At least 6 characters")
    if (password !== password2) return (e.password2 = "Passwords don't match")
    if (role === "editor" && !coupleName.trim())
      return (e.coupleName = "Required")
    if (role === "editor_join" && !inviteCode.trim()) 
      return e.inviteCode = "Required"
    if (role === "viewer" && !coupleCode.trim())
      return (e.coupleCode = "Required")

    return e;
  }

  async function handleRegister() {
    const e = validateStep2()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSubmitting(true)
    try {
      const result = await register({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        password,
        role,
        coupleName: role === "editor" ? coupleName.trim() : undefined,
        inviteCode: role === "editor_join" ? inviteCode.trim() : undefined,
        coupleCode: role === "viewer" ? coupleCode.trim() : undefined,
      });
      setSuccess(result)
    } catch (err) {
      const msg = err.message || "Registration failed"
      if (msg.toLowerCase().includes("username"))
        return setErrors({ username: msg })
      else if (msg.toLowerCase().includes("two editors"))
        return setErrors({ inviteCode: msg })
      else if (msg.toLowerCase().includes("invite"))
        return setErrors({ inviteCode: msg })
      else if (msg.toLowerCase().includes("code"))
        return setErrors({ coupleCode: msg })
      else return setErrors({ general: msg })
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <AuthShell>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>🎉</div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.5rem",
              color: "#3d2c25",
              marginBottom: 8,
            }}
          >
            Account created!
          </h2>

          {role === "editor" ? (
            <>
              <p
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: "0.88rem",
                  color: "#6b4c3b",
                  marginBottom: 18,
                  lineHeight: 1.6,
                }}
              >
                Your wedding budget for <strong>{success.coupleName}</strong> is
                ready.
              </p>
              <div
                style={{
                  background: "#fdf5ef",
                  border: "1.5px solid #c9a96e",
                  borderRadius: 12,
                  padding: "16px 20px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: "0.68rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#b5998a",
                    marginBottom: 6,
                  }}
                >
                  Your couple code — share with family &amp; guests
                </div>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1.9rem",
                    letterSpacing: "0.2em",
                    color: "#6b4c3b",
                    fontWeight: 600,
                  }}
                >
                  {success.coupleCode}
                </div>
                <div
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: "0.72rem",
                    color: "#b5998a",
                    marginTop: 6,
                  }}
                >
                  Anyone with this code can register as a viewer
                </div>
              </div>
              <div
                style={{
                  background: "#fdf0f0",
                  border: "1.5px solid #d9a8a0",
                  borderRadius: 12,
                  padding: "16px 20px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: "0.68rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#a87a6e",
                    marginBottom: 6,
                  }}
                >
                  Invite code - share privately with your partner ONLY
                </div>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', sans-serif",
                    fontSize: "1.7rem",
                    letterSpacing: "0.2em",
                    color: "#8a4a3b",
                    fontWeight: 600,
                  }}
                >
                  {success.inviteCode}
                </div>
                <div
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: "0.73rem",
                    color: "#a87a6e",
                    marginTop: 6,
                  }}
                >
                  This code grants full editing access - dont&apos;t post it publicly
                </div>
              </div>
            </>
          ) : role === "editor_join" ? (
            <p
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: "0.88rem",
                color: "#6b4c3b",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              You&apos;re now a co-editor on the budget for {" "}
              <strong>{success.coupleName}</strong>.
            </p>
          ) : (
            <p
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: "0.88rem",
                color: "#6b4c3b",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              You can now view the budget for{" "}
              <strong>{success.coupleName}</strong>.
            </p>
          )}

          <button className="primary-btn" onClick={onGoLogin}>
            Go to Sign In
          </button>
        </div>
      </AuthShell>
    )
  }

  // Step 1
  if (step === 1) {
    return (
      <AuthShell>
        <div style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.4rem",
              fontWeight: 400,
              color: "#3d2c25",
              marginBottom: 4,
            }}
          >
            Create an Account
          </h2>
          <p
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: "0.84rem",
              color: "#a08070",
            }}
          >
            First, tell us what kind of account you need.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            margin: "20px 0",
          }}
        >
          {/* Create a brand new wedding budget */}
          <button
            className={`role-card${role === "editor" ? " selected" : ""}`}
            onClick={() => setRole("editor")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: "2rem", lineHeight: 1 }}>💍</div>
              <div>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1.15rem",
                    color: "#3d2c25",
                    marginBottom: 3,
                  }}
                >
                  We&apos;re getting married
                </div>
                <div
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: "0.78rem",
                    color: "#a08070",
                    lineHeight: 1.4,
                  }}
                >
                  Start a new wedding budget. You&apos;ll get a couple code for 
                  family and an invite code for your partner.
                </div>
              </div>
            </div>
          </button>

          {/* Join partner as a co-editor */}
          <button
            className={`role-card${role === "editor_join" ? " selected" : ""}`}
            onClick={() => setRole("editor_join")}
          >
            <div style={{display: "flex", alignItems: "center", gap: 14}}>
                  <div style={{fontSize: "2rem", lineHeight: 1}}>🤝</div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Cormorant Garamond', sans-serif",
                        fontSize: "1.15rem",
                        color: "#3d2c25",
                        marginBottom: 3,
                      }}
                    >
                      My partner already started one
                    </div>
                    <div
                      style={{
                        fontFamily: "'Jost', sans-serif",
                        fontSize: "0.78rem",
                        color: "#a08070",
                        lineHeight: 1.4,
                      }}
                    >
                      Join as a co-editor using the private invite code your
                      partner shared with you.
                    </div>
                  </div>
            </div>
          </button>

          {/* Viewer Button */}
          <button
            className={`role-card${role === "viewer" ? " selected" : ""}`}
            onClick={() => setRole("viewer")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: "2rem", lineHeight: 1 }}>👨‍👩‍👧</div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.15rem",
                  color: "#3d2c25",
                  marginBottom: 3,
                }}
              >
                I&apos;m family / a guest
              </div>
              <div
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: "0.78rem",
                  color: "#a08070",
                  lineHeight: 1.4,
                }}
              >
                View a couple&apos;s budget. You&apos;ll need the couple code
                they shared with you.
              </div>
            </div>
          </button>
        </div>

        {/* Continue Button */}
        <button
          className="primary-btn"
          disabled={!role}
          onClick={() => setStep(2)}
        >
          Continue →
        </button>
        <div
          style={{
            textAlign: "center",
            fontFamily: "'Jost', sans-serif",
            fontSize: "0.84rem",
            color: "#a08070",
            marginTop: 14,
          }}
        >
          Already have an account?{" "}
          <button className="link-btn" onClick={onGoLogin}>
            Sign in
          </button>
        </div>
      </AuthShell>
    )
  }

  // Step 2
  const stepHeading = 
    role === "editor"
      ? "💍 Create your wedding"
      : role === "editor_join"
        ? "🤝 Join as co-editor"
        : "👨‍👩‍👧 Join a wedding"
  
  const stepSubtext = 
    role === "editor" 
      ? "You'll be able o edit the budget, and you'll get two codes to share."
      : role === "editor_join"
        ? "Enter the private invite code you partner gave you."
        : "Enter the couple code the couple gave you."

  return (
    <AuthShell>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <button
          onClick={() => setStep(1)}
          style={{
            background: "none",
            border: "none",
            color: "#b5998a",
            fontSize: "1.2rem",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ←
        </button>
        <div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.35rem",
              fontWeight: 400,
              color: "#3d2c25",
            }}
          >
            {stepHeading}
          </h2>
          <p
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: "0.78rem",
              color: "#a08070",
            }}
          >
            {stepSubtext}
          </p>
        </div>
      </div>

      {errors.general && (
        <div
          style={{
            fontSize: "0.82rem",
            color: "#c47b7b",
            fontFamily: "'Jost', sans-serif",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {errors.general}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        <Field label="Your name" error={errors.displayName}>
          <input
            className={`auth-input ${errors.displayName ? "error" : ""}`}
            value={displayName}
            placeholder="e.g. Emma"
            onChange={(e) => {
              setDisplayName(e.target.value)
              clearError("displayName")
            }}
          />
        </Field>
        <Field label="Username" error={errors.username}>
          <input
            className={`auth-input ${errors.username ? " error" : ""}`}
            value={username}
            placeholder="e.g. emma2025"
            autoCapitalize="none"
            onChange={(e) => {
              setUsername(e.target.value)
              clearError("username")
            }}
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <div style={{ position: "relative" }}>
            <input
              className={`auth-input ${errors.password ? " error" : ""}`}
              type={showPw ? "text" : "password"}
              value={password}
              placeholder="At least 6 characters"
              onChange={(e) => {
                setPassword(e.target.value)
                clearError("password")
              }}
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
        </Field>
        <Field label="Confirm password" error={errors.password2}>
          <input
            className={`auth-input ${errors.password2 ? " error" : ""}`}
            type={showPw ? "text" : "password"}
            value={password2}
            placeholder="Repeat password"
            onChange={(e) => {
              setPassword2(e.target.value)
              clearError("password2")
            }}
          />
        </Field>
        {role === "editor" && (
          <Field label="Wedding / couple name" error={errors.coupleName}>
            <input
              className={`auth-input ${errors.coupleName ? " error" : ""}`}
              value={coupleName}
              placeholder="e.g. Emma & Jack"
              onChange={(e) => {
                setCoupleName(e.target.value)
                clearError("coupleName")
              }}
            />
          </Field>
        )}

        {role === "editor_join" && (
          <Field label="Invite code" error={errors.inviteCode}>
            <input 
              className={`auth-input ${errors.inviteCode ? "error" : ""}`}
              value={inviteCode}
              placeholder="e.g. EMMAJACKINVITE123456"
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase())
                clearError("inviteCode")
              }}
            />
            {console.log(inviteCode)}
            <div
              style={{
                fontSize: "0.7 rem",
                color: "#b5998a",
                fontFamily: "'Jost', sans-serif",
                marginTop: 4,
              }}
            >
              This is different from the couple code - ask your partner for 
              the private invite code shown when they created the account.
            </div>
          </Field>
        )}

        {role === "viewer" && (
          <Field label="Couple code" error={errors.coupleCode}>
            <input
              className={`auth-input ${errors.coupleCode ? " error" : ""}`}
              value={coupleCode}
              placeholder="e.g. EMMAJACK1234"
              onChange={(e) => {
                setCoupleCode(e.target.value.toUpperCase())
                clearError("coupleCode")
              }}
            />
            <div
              style={{
                fontSize: "0.7rem",
                color: "#b5998a",
                fontFamily: "'Jost', sans-serif",
                marginTop: 4,
              }}
            >
              Ask the couple — their code is shown in the header when
              they&apos;re logged in.
            </div>
          </Field>
        )}

        <button
          className="primary-btn"
          onClick={handleRegister}
          disabled={submitting}
          style={{ marginTop: 4 }}
        >
          {submitting ? "Creating account…" : "Create Account"}
        </button>
        <div
          style={{
            textAlign: "center",
            fontFamily: "'Jost', sans-serif",
            fontSize: "0.84rem",
            color: "#a08070",
          }}
        >
          Already have an account?{" "}
          <button className="link-btn" onClick={onGoLogin}>
            Sign in
          </button>
        </div>
      </div>
    </AuthShell>
  )
}
