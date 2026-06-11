import { useState } from "react"
import { AuthProvider, useAuth } from "./hooks/useAuth"
import LoginPage from "./components/LoginPage"
import RegisterPage from "./components/RegisterPage"
import BudgetApp from "./components/BudgetApp"

import './App.css'

function Router() {
  const { user, loading } = useAuth()
  const [screen, setScreen] = useState("login"); // 'login' | 'register'

  // Checking for an existing session cookie on first load
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #3d2c25 0%, #6b4c3b 55%, #3d2c25 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.2rem",
            color: "#c9a96e",
            fontStyle: "italic",
          }}
        >
          Loading…
        </div>
      </div>
    )
  }

  // Logged in → show the budget app
  if (user) return <BudgetApp />

  // Not logged in → show auth screens
  if (screen === "register") {
    return <RegisterPage onGoLogin={() => setScreen("login")} />
  }

  return <LoginPage onGoRegister={() => setScreen("register")} />
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  )
}
