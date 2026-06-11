import { useMemo } from "react"
import { PAYERS, CATEGORIES, formatCurrency } from "../lib/constants"

function DiffBadge({ estimate, actual }) {
  if (!actual) return null
  const diff = actual - estimate
  return (
    <span
      style={{
        fontSize: "0.7rem",
        fontWeight: 700,
        color: diff > 0 ? "#c47b7b" : "#5a9470",
        background: diff > 0 ? "#fdeaea" : "#eaf7ee",
        borderRadius: 99,
        padding: "2px 8px",
        marginLeft: 4,
      }}
    >
      {diff > 0 ? "+" : ""}
      {formatCurrency(diff)}
    </span>
  )
}

// ── By Payer ─────────────────────────────────────────────────────────────────
export function ByPayerTab({ items }) {
  const byPayer = useMemo(() => {
    const map = {}
    PAYERS.forEach((p) => {
      map[p] = { estimate: 0, actual: 0, paid: 0 }
    });
    items.forEach((i) => {
      if (!map[i.paid_by]) map[i.paid_by] = { estimate: 0, actual: 0, paid: 0 }
      map[i.paid_by].estimate += i.estimate || 0
      map[i.paid_by].actual += i.actual || 0
      map[i.paid_by].paid += i.paid || 0
    })
    return map
  }, [items])

  const activePayers = PAYERS.filter(
    (p) => byPayer[p]?.estimate > 0 || byPayer[p]?.actual > 0,
  )

  if (activePayers.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 60,
          color: "#c4a898",
          fontStyle: "italic",
        }}
      >
        Add budget items to see the payer breakdown
      </div>
    )
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 16,
      }}
    >
      {activePayers.map((payer) => {
        const p = byPayer[payer]
        const pct =
          p.estimate > 0 ? Math.min((p.actual / p.estimate) * 100, 100) : 0
        const over = p.actual > p.estimate
        const payerItems = items.filter((i) => i.paid_by === payer)

        return (
          <div key={payer} className="card">
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1.2rem",
                    color: "#4e3128",
                  }}
                >
                  {payer}
                </div>
                <div
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: "0.7rem",
                    color: "#b5998a",
                  }}
                >
                  {payerItems.length} item{payerItems.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: "1.1rem",
                    color: "#3d2c25",
                    fontWeight: 500,
                  }}
                >
                  {formatCurrency(p.actual || p.estimate)}
                </div>
                <div
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: "0.7rem",
                    color: "#b5998a",
                  }}
                >
                  of {formatCurrency(p.estimate)} est.
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 4,
                background: "#f0e6de",
                borderRadius: 99,
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: over ? "#c47b7b" : "#c9a96e",
                  borderRadius: 99,
                  transition: "width 0.5s",
                }}
              />
            </div>

            {/* Item list */}
            {payerItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "5px 0",
                  borderBottom: "1px solid #f5ede8",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: "0.84rem",
                      color: "#3d2c25",
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: "0.7rem",
                      color: "#b5998a",
                    }}
                  >
                    {item.category}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: "0.84rem",
                      color: "#5a3e31",
                    }}
                  >
                    {formatCurrency(item.estimate)}
                  </div>
                  {item.actual > 0 && (
                    <DiffBadge estimate={item.estimate} actual={item.actual} />
                  )}
                </div>
              </div>
            ))}

            {/* Footer totals */}
            <div
              style={{
                marginTop: 10,
                paddingTop: 8,
                borderTop: "1.5px solid #e5d9d0",
              }}
            >
              {[
                {
                  label: "Total Estimate",
                  val: formatCurrency(p.estimate),
                  color: "#5a3e31",
                },
                p.actual > 0
                  ? {
                      label: "Total Actual",
                      val: formatCurrency(p.actual),
                      color: over ? "#c47b7b" : "#5a9470",
                    }
                  : null,
                p.paid > 0
                  ? {
                      label: "Paid to Date",
                      val: formatCurrency(p.paid),
                      color: "#5a8a70",
                    }
                  : null,
                {
                  label: "Balance Due",
                  val: formatCurrency(
                    Math.max((p.actual || p.estimate) - p.paid, 0),
                  ),
                  color: "#c4722a",
                },
              ]
                .filter(Boolean)
                .map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: i === 0 ? 0 : 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Jost', sans-serif",
                        fontSize: "0.7rem",
                        color: "#b5998a",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {row.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Jost', sans-serif",
                        fontWeight: 600,
                        color: row.color,
                      }}
                    >
                      {row.val}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  )
}

// ── By Category ───────────────────────────────────────────────────────────────
export function ByCategoryTab({ items }) {
  const byCategory = useMemo(() => {
    const map = {}
    CATEGORIES.forEach((c) => {
      map[c] = { estimate: 0, actual: 0, paid: 0, count: 0 };
    })
    items.forEach((i) => {
      if (!map[i.category])
        map[i.category] = { estimate: 0, actual: 0, paid: 0, count: 0 }
      map[i.category].estimate += i.estimate || 0
      map[i.category].actual += i.actual || 0
      map[i.category].paid += i.paid || 0
      map[i.category].count++
    })
    return map
  }, [items])

  const activeCategories = CATEGORIES.filter((c) => byCategory[c]?.count > 0)

  if (activeCategories.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 60,
          color: "#c4a898",
          fontStyle: "italic",
        }}
      >
        Add budget items to see the category breakdown
      </div>
    )
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 16,
      }}
    >
      {activeCategories.map((cat) => {
        const c = byCategory[cat]
        const pct =
          c.estimate > 0 ? Math.min((c.actual / c.estimate) * 100, 100) : 0
        const over = c.actual > c.estimate
        const catItems = items.filter((i) => i.category === cat)

        return (
          <div key={cat} className="card">
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.2rem",
                  color: "#4e3128",
                }}
              >
                {cat}
              </div>
              <span
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: "0.7rem",
                  color: "#b5998a",
                }}
              >
                {c.count} item{c.count !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Stats row */}
            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  label: "Est.",
                  val: formatCurrency(c.estimate),
                  color: "#5a3e31",
                },
                c.actual > 0
                  ? {
                      label: "Actual",
                      val: formatCurrency(c.actual),
                      color: over ? "#c47b7b" : "#5a9470",
                    }
                  : null,
                c.paid > 0
                  ? {
                      label: "Paid",
                      val: formatCurrency(c.paid),
                      color: "#5a8a70",
                    }
                  : null,
                {
                  label: "Balance",
                  val: formatCurrency(
                    Math.max((c.actual || c.estimate) - c.paid, 0),
                  ),
                  color: "#c4722a",
                },
              ]
                .filter(Boolean)
                .map((stat, i) => (
                  <div key={i}>
                    <div
                      style={{
                        fontSize: "0.63rem",
                        letterSpacing: "0.1em",
                        color: "#b5998a",
                        textTransform: "uppercase",
                        fontFamily: "'Jost', sans-serif",
                      }}
                    >
                      {stat.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Jost', sans-serif",
                        fontSize: "1.05rem",
                        color: stat.color,
                        fontWeight: 500,
                      }}
                    >
                      {stat.val}
                    </div>
                  </div>
                ))}
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 4,
                background: "#f0e6de",
                borderRadius: 99,
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: over ? "#c47b7b" : "#c9a96e",
                  borderRadius: 99,
                }}
              />
            </div>

            {/* Item list */}
            {catItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "5px 0",
                  borderBottom: "1px solid #f5ede8",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: "0.82rem",
                      color: "#3d2c25",
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: "0.7rem",
                      color: "#b5998a",
                    }}
                  >
                    {item.paid_by}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: "0.82rem",
                      color: "#5a3e31",
                    }}
                  >
                    {formatCurrency(item.estimate)}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#c9a96e" }}>
                    →
                  </span>
                  <span
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: "0.82rem",
                      color: item.actual
                        ? item.actual > item.estimate
                          ? "#c47b7b"
                          : "#5a9470"
                        : "#c4a898",
                    }}
                  >
                    {item.actual ? formatCurrency(item.actual) : "TBD"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

