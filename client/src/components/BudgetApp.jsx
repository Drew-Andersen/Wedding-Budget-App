import { useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useBudget } from "../hooks/useBudget";
import { formatCurrency } from "../lib/constants";
import BudgetTable from "./BudgetTable";
import { ByPayerTab, ByCategoryTab } from "./BreakdownTabs";

export default function BudgetApp() {
  const { user, logout } = useAuth();
  const { items, loading, error, createItem, updateItem, deleteItem } =
    useBudget(user);
  const [activeTab, setActiveTab] = useState("tracker");
  const [inviteRevealed, setInviteRevealed] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const inviteHideTimer = useRef(null);

  const isEditor = user.role === "editor";
  const totalEst = items.reduce((s, i) => s + (i.estimate || 0), 0);
  const totalActual = items.reduce((s, i) => s + (i.actual || 0), 0);
  const totalPaid = items.reduce((s, i) => s + (i.paid || 0), 0);
  const totalBal = Math.max((totalActual || totalEst) - totalPaid, 0);
  const progressPct =
    totalEst > 0 ? Math.min((totalActual / totalEst) * 100, 100) : 0;
  const overBudget = totalActual > totalEst && totalEst > 0;

  async function copyInviteToClipboard() {
    if (!user.inviteCode) return;
    try {
      await navigator.clipboard.writeText(user.inviteCode);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
  }

  function handleInviteClick () {
    if (!inviteRevealed) {
      setInviteRevealed(true);
      clearTimeout(inviteHideTimer.current);
      inviteHideTimer.current = setTimeout(() => setInviteRevealed(false), 4000)
      return;
    }
    copyInviteToClipboard();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f9f4ef 0%, #fdf8f4 60%, #f4ede8 100%)",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #3d2c25 0%, #6b4c3b 100%)",
          padding: "40px 32px 28px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            backgroundImage:
              "repeating-linear-gradient(45deg, #c9a96e 0, #c9a96e 1px, transparent 0, transparent 50%)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Top-right user bar */}
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
            zIndex: 2,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {!isEditor && <span className="viewer-badge">👁 View Only</span>}
          <div
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: "0.75rem",
              color: "#c9a96e",
            }}
          >
            {user.displayName}
          </div>
          {isEditor && (
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(201,169,110,0.25)",
                borderRadius: 8,
                padding: "3px 10px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: "0.62rem",
                  color: "#b5998a",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Code:{" "}
              </span>
              <span
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: "0.8rem",
                  color: "#c9a96e",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                }}
              >
                {user.coupleCode}
              </span>
            </div>
          )}
          {isEditor && user.inviteCode && (
            <div
              onMouseEnter={() => {
                clearInterval(inviteHideTimer.current);
                setInviteRevealed(true);
              }}
              onMouseLeave={() => setInviteRevealed(false)}
              onClick={handleInviteClick}
              title={
                inviteRevealed
                  ? "Click to copy - share with your partner only"
                  : "Tap to reveal - share with your partner only"
              }
              style={{
                background: "rgba(196,114,42,0.12)",
                border: "1px solid rgba(196,114,42,0.35)",
                borderRadius: 8,
                padding: "3px 10px",
                cursor: "pointer",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: "0.62rem",
                  color: "#c4722a",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Invite:{" "}
              </span>
              <span
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: "0.8rem",
                  color: "#e0935a",
                  fontWeight: 500,
                  letterSpacing: inviteRevealed ? "0.1em" : "0.25em",
                  transition: "letter-spacing 0.15s ease",
                }}
              >
                {inviteCopied
                  ? "Copied!"
                  : inviteRevealed
                    ? user.inviteCode
                    : "•".repeat(Math.max(user.inviteCode.length, 6))
                }
              </span>
            </div>
          )}
          <button
            onClick={logout}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(201,169,110,0.3)",
              borderRadius: 99,
              padding: "4px 12px",
              fontSize: "0.72rem",
              color: "#c9a96e",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "0.8rem",
            letterSpacing: "0.35em",
            color: "#c9a96e",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {user.coupleName}
        </div>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
            fontWeight: 300,
            color: "#fdf8f4",
            letterSpacing: "0.05em",
            marginBottom: 4,
          }}
        >
          Wedding Budget
        </h1>
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            color: "#d4bfb0",
            fontSize: "1rem",
          }}
        >
          Every detail, beautifully planned
        </div>

        {/* Summary cards */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            marginTop: 28,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              label: "Total Estimate",
              val: formatCurrency(totalEst),
              accent: "#c9a96e",
            },
            {
              label: "Total Actual",
              val: formatCurrency(totalActual),
              accent: overBudget ? "#e8a09a" : "#9fcfb0",
            },
            {
              label: "Paid to Date",
              val: formatCurrency(totalPaid),
              accent: "#a9c4d4",
            },
            {
              label: "Balance Due",
              val: formatCurrency(totalBal),
              accent: totalPaid > 0 ? "#e8b89a" : "#c9a96e",
            },
            { label: "Items", val: items.length, accent: "#c9a96e" },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(201,169,110,0.25)",
                borderRadius: 14,
                padding: "12px 20px",
                minWidth: 110,
              }}
            >
              <div
                style={{
                  fontSize: "0.63rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#b5998a",
                  fontFamily: "'Jost', sans-serif",
                  marginBottom: 3,
                }}
              >
                {c.label}
              </div>
              <div
                style={{ fontSize: "1.3rem", fontWeight: 300, color: c.accent }}
              >
                {c.val}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {/* <div style={{ maxWidth: 460, margin: "16px auto 0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "'Jost', sans-serif",
              fontSize: "0.7rem",
              color: "#b5998a",
              marginBottom: 5,
            }}
          >
            <span>{Math.round(progressPct)}% of budget used</span>
            {overBudget && (
              <span style={{ color: "#e8a09a" }}>
                Over budget by {formatCurrency(totalActual - totalEst)}
              </span>
            )}
          </div>
          <div
            style={{
              height: 5,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                borderRadius: 99,
                transition: "width 0.5s ease",
                background: overBudget
                  ? "linear-gradient(90deg, #e8a09a, #c47b7b)"
                  : "linear-gradient(90deg, #c9a96e, #9fcfb0)",
              }}
            />
          </div>
        </div> */}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #f0e6de",
          display: "flex",
          justifyContent: "center",
          gap: 4,
        }}
      >
        {[
          { id: "tracker", label: "📋 All Items" },
          { id: "by-payer", label: "👥 By Payer" },
          { id: "by-category", label: "🏷️ By Category" },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? " active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div
        style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 60px" }}
      >
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              color: "#c4a898",
              fontStyle: "italic",
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.1rem",
            }}
          >
            Loading your budget…
          </div>
        )}

        {error && (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: "#c47b7b",
              fontFamily: "'Jost', sans-serif",
              fontSize: "0.9rem",
            }}
          >
            Error loading budget: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {activeTab === "tracker" && (
              <BudgetTable
                items={items}
                isEditor={isEditor}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onAdd={createItem}
              />
            )}
            {activeTab === "by-payer" && <ByPayerTab items={items} />}
            {activeTab === "by-category" && <ByCategoryTab items={items} />}
          </>
        )}
      </div>
    </div>
  );
}
