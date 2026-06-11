import { useState } from "react";
import {
  CATEGORIES,
  PAYERS,
  STATUS_CONFIG,
  formatCurrency,
} from "../lib/constants";

function DiffBadge({ estimate, actual }) {
  if (!actual) return null;
  const diff = actual - estimate;
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
  );
}

export default function BudgetTable({
  items,
  isEditor,
  onUpdate,
  onDelete,
  onAdd,
}) {
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterPayer, setFilterPayer] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({
    category: CATEGORIES[0],
    name: "",
    estimate: "",
    actual: "",
    paid: "",
    paid_by: PAYERS[0],
    status: "pending",
    notes: "",
  });

  const filtered = items.filter(
    (i) =>
      (filterCategory === "All" || i.category === filterCategory) &&
      (filterPayer === "All" || i.paid_by === filterPayer),
  );

  async function handleSaveAdd() {
    if (!newItem.name.trim()) return;
    setSaving(true);
    try {
      await onAdd({
        ...newItem,
        estimate: parseFloat(newItem.estimate) || 0,
        actual: parseFloat(newItem.actual) || 0,
        paid: parseFloat(newItem.paid) || 0,
      });
      setNewItem({
        category: CATEGORIES[0],
        name: "",
        estimate: "",
        actual: "",
        paid: "",
        paid_by: PAYERS[0],
        status: "pending",
        notes: "",
      });
      setShowAddForm(false);
    } finally {
      setSaving(false);
    }
  }

  // Numeric fields save on blur to avoid a server call on every keystroke
  async function handleBlurUpdate(id, field, rawValue) {
    await onUpdate(id, { [field]: parseFloat(rawValue) || 0 });
  }

  async function handleSelectUpdate(id, field, value) {
    await onUpdate(id, { [field]: value });
  }

  const fEst = filtered.reduce((s, i) => s + (i.estimate || 0), 0);
  const fAct = filtered.reduce((s, i) => s + (i.actual || 0), 0);
  const fPaid = filtered.reduce((s, i) => s + (i.paid || 0), 0);
  const fBal = filtered.reduce(
    (s, i) => s + Math.max((i.actual || i.estimate || 0) - (i.paid || 0), 0),
    0,
  );

  return (
    <>
      {/* ── Filter bar ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <select
          className="chip-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          className="chip-select"
          value={filterPayer}
          onChange={(e) => setFilterPayer(e.target.value)}
        >
          <option value="All">All Payers</option>
          {PAYERS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        {isEditor ? (
          <button className="add-btn" onClick={() => setShowAddForm((v) => !v)}>
            + Add Item
          </button>
        ) : (
          <span className="viewer-badge">👁 View only</span>
        )}
      </div>

      {/* ── Add form ── */}
      {showAddForm && isEditor && (
        <div
          className="card"
          style={{ marginBottom: 18, border: "1.5px solid #c9a96e" }}
        >
          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.2rem",
              color: "#6b4c3b",
              marginBottom: 16,
            }}
          >
            New Budget Item
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 14,
            }}
          >
            {[
              { label: "Item Name *", key: "name", type: "text" },
              { label: "Estimated", key: "estimate", type: "number" },
              { label: "Actual", key: "actual", type: "number" },
              { label: "Paid", key: "paid", type: "number" },
            ].map((f) => (
              <div key={f.key}>
                <div
                  style={{
                    fontSize: "0.68rem",
                    letterSpacing: "0.12em",
                    color: "#b5998a",
                    textTransform: "uppercase",
                    fontFamily: "'Jost', sans-serif",
                    marginBottom: 5,
                  }}
                >
                  {f.label}
                </div>
                <input
                  type={f.type}
                  value={newItem[f.key]}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    border: "1px solid #e5d9d0",
                    borderRadius: 8,
                    padding: "8px 11px",
                    fontSize: "0.9rem",
                    color: "#3d2c25",
                  }}
                />
              </div>
            ))}
            {[
              { label: "Category", key: "category", opts: CATEGORIES },
              { label: "Paid By", key: "paid_by", opts: PAYERS },
              {
                label: "Status",
                key: "status",
                opts: Object.keys(STATUS_CONFIG),
              },
            ].map((f) => (
              <div key={f.key}>
                <div
                  style={{
                    fontSize: "0.68rem",
                    letterSpacing: "0.12em",
                    color: "#b5998a",
                    textTransform: "uppercase",
                    fontFamily: "'Jost', sans-serif",
                    marginBottom: 5,
                  }}
                >
                  {f.label}
                </div>
                <select
                  value={newItem[f.key]}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    border: "1px solid #e5d9d0",
                    borderRadius: 8,
                    padding: "8px 11px",
                    fontSize: "0.9rem",
                    color: "#3d2c25",
                    background: "white",
                    appearance: "none",
                  }}
                >
                  {f.opts.map((o) => (
                    <option key={o} value={o}>
                      {f.key === "status" ? STATUS_CONFIG[o].label : o}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1" }}>
              <div
                style={{
                  fontSize: "0.68rem",
                  letterSpacing: "0.12em",
                  color: "#b5998a",
                  textTransform: "uppercase",
                  fontFamily: "'Jost', sans-serif",
                  marginBottom: 5,
                }}
              >
                Notes
              </div>
              <textarea
                value={newItem.notes}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
                style={{
                  width: "100%",
                  border: "1px solid #e5d9d0",
                  borderRadius: 8,
                  padding: "8px 11px",
                  fontSize: "0.9rem",
                  color: "#3d2c25",
                  resize: "vertical",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              className="add-btn"
              onClick={handleSaveAdd}
              disabled={saving}
            >
              {saving ? "Saving…" : "Add Item"}
            </button>
            <button
              className="outline-btn"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fdf5ef" }}>
                {[
                  "Category",
                  "Item",
                  "Paid By",
                  "Estimate",
                  "Actual",
                  "Difference",
                  "Paid to Date",
                  "Balance Due",
                  "Status",
                  "Notes",
                  isEditor ? "Actions" : "",
                ].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "12px 14px",
                      textAlign: "left",
                      fontSize: "0.66rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#b5998a",
                      fontFamily: "'Jost', sans-serif",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      borderBottom: "1px solid #f0e6de",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#c4a898",
                      fontStyle: "italic",
                    }}
                  >
                    {items.length === 0
                      ? "No budget items yet — add your first one!"
                      : "No items match your filters"}
                  </td>
                </tr>
              )}

              {filtered.map((item, idx) => {
                const diff = (item.actual || 0) - (item.estimate || 0);
                const paidAmt = item.paid || 0;
                const baseAmt = item.actual || item.estimate || 0;
                const balance = Math.max(baseAmt - paidAmt, 0);
                const isEditing = editingId === item.id;

                return (
                  <tr
                    key={item.id}
                    className="item-row"
                    style={{
                      borderBottom: "1px solid #f5ede8",
                      background: idx % 2 === 0 ? "white" : "#fdfaf8",
                    }}
                  >
                    {/* Category */}
                    <td style={{ padding: "10px 14px" }}>
                      {isEditing && isEditor ? (
                        <select
                          className="chip-select"
                          value={item.category}
                          onChange={(e) =>
                            handleSelectUpdate(
                              item.id,
                              "category",
                              e.target.value,
                            )
                          }
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          style={{
                            background: "#f4ede8",
                            borderRadius: 99,
                            padding: "2px 10px",
                            fontSize: "0.73rem",
                            color: "#7a5045",
                            fontFamily: "'Jost', sans-serif",
                          }}
                        >
                          {item.category}
                        </span>
                      )}
                    </td>

                    {/* Name */}
                    <td style={{ padding: "10px 14px", minWidth: 130 }}>
                      {isEditing && isEditor ? (
                        <input
                          className="edit-input"
                          defaultValue={item.name}
                          onBlur={(e) =>
                            onUpdate(item.id, { name: e.target.value })
                          }
                        />
                      ) : (
                        <span
                          style={{
                            fontFamily: "'Jost', sans-serif",
                            fontSize: "0.87rem",
                            color: "#3d2c25",
                          }}
                        >
                          {item.name}
                        </span>
                      )}
                    </td>

                    {/* Paid By */}
                    <td style={{ padding: "10px 14px" }}>
                      {isEditing && isEditor ? (
                        <select
                          className="chip-select"
                          value={item.paid_by}
                          onChange={(e) =>
                            handleSelectUpdate(
                              item.id,
                              "paid_by",
                              e.target.value,
                            )
                          }
                        >
                          {PAYERS.map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.76rem",
                            fontFamily: "'Jost', sans-serif",
                            color: "#6b7a6b",
                            background: "#edf4ee",
                            borderRadius: 99,
                            padding: "2px 9px",
                          }}
                        >
                          {item.paid_by}
                        </span>
                      )}
                    </td>

                    {/* Estimate */}
                    <td style={{ padding: "10px 14px" }}>
                      {isEditing && isEditor ? (
                        <input
                          className="edit-input"
                          type="number"
                          defaultValue={item.estimate}
                          onBlur={(e) =>
                            handleBlurUpdate(
                              item.id,
                              "estimate",
                              e.target.value,
                            )
                          }
                          style={{ width: 90 }}
                        />
                      ) : (
                        <span
                          style={{
                            fontFamily: "'Jost', sans-serif",
                            fontSize: "0.87rem",
                            color: "#5a3e31",
                          }}
                        >
                          {formatCurrency(item.estimate)}
                        </span>
                      )}
                    </td>

                    {/* Actual */}
                    <td style={{ padding: "10px 14px" }}>
                      {isEditing && isEditor ? (
                        <input
                          className="edit-input"
                          type="number"
                          defaultValue={item.actual}
                          onBlur={(e) =>
                            handleBlurUpdate(item.id, "actual", e.target.value)
                          }
                          style={{ width: 90 }}
                        />
                      ) : (
                        <span
                          style={{
                            fontFamily: "'Jost', sans-serif",
                            fontSize: "0.87rem",
                            color: item.actual ? "#3d2c25" : "#c4a898",
                          }}
                        >
                          {item.actual ? formatCurrency(item.actual) : "—"}
                        </span>
                      )}
                    </td>

                    {/* Difference */}
                    <td style={{ padding: "10px 14px" }}>
                      {item.actual ? (
                        <span
                          style={{
                            fontFamily: "'Jost', sans-serif",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            color: diff > 0 ? "#c47b7b" : "#5a9470",
                          }}
                        >
                          {diff > 0 ? "+" : ""}
                          {formatCurrency(diff)}
                        </span>
                      ) : (
                        <span style={{ color: "#ddd" }}>—</span>
                      )}
                    </td>

                    {/* Paid to Date */}
                    <td style={{ padding: "10px 14px" }}>
                      {isEditing && isEditor ? (
                        <input
                          className="edit-input"
                          type="number"
                          defaultValue={item.paid}
                          onBlur={(e) =>
                            handleBlurUpdate(item.id, "paid", e.target.value)
                          }
                          style={{ width: 90 }}
                        />
                      ) : (
                        <span
                          style={{
                            fontFamily: "'Jost', sans-serif",
                            fontSize: "0.87rem",
                            color: paidAmt > 0 ? "#5a8a70" : "#c4a898",
                            fontWeight: paidAmt > 0 ? 500 : 400,
                          }}
                        >
                          {paidAmt > 0 ? formatCurrency(paidAmt) : "—"}
                        </span>
                      )}
                    </td>

                    {/* Balance Due */}
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          fontFamily: "'Jost', sans-serif",
                          fontSize: "0.87rem",
                          fontWeight: balance > 0 ? 500 : 400,
                          color:
                            balance === 0 && paidAmt > 0
                              ? "#5a9470"
                              : balance > 0
                                ? "#c4722a"
                                : "#c4a898",
                        }}
                      >
                        {balance === 0 && paidAmt > 0
                          ? "✓ Cleared"
                          : balance > 0
                            ? formatCurrency(balance)
                            : "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "10px 14px" }}>
                      {isEditing && isEditor ? (
                        <select
                          className="chip-select"
                          value={item.status}
                          onChange={(e) =>
                            handleSelectUpdate(
                              item.id,
                              "status",
                              e.target.value,
                            )
                          }
                        >
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.73rem",
                            fontFamily: "'Jost', sans-serif",
                            color: STATUS_CONFIG[item.status]?.color,
                            background: `${STATUS_CONFIG[item.status]?.color}18`,
                            borderRadius: 99,
                            padding: "3px 9px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {STATUS_CONFIG[item.status]?.label}
                        </span>
                      )}
                    </td>

                    {/* Notes */}
                    <td style={{ padding: "10px 14px", maxWidth: 160 }}>
                      {isEditing && isEditor ? (
                        <input
                          className="edit-input"
                          defaultValue={item.notes}
                          onBlur={(e) =>
                            onUpdate(item.id, { notes: e.target.value })
                          }
                          placeholder="Add note…"
                        />
                      ) : (
                        <span
                          style={{
                            fontFamily: "'Jost', sans-serif",
                            fontSize: "0.76rem",
                            color: "#a08070",
                            fontStyle: "italic",
                          }}
                        >
                          {item.notes || ""}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>
                      {isEditor && (
                        <>
                          <button
                            onClick={() =>
                              setEditingId(isEditing ? null : item.id)
                            }
                            style={{
                              background: isEditing ? "#c9a96e" : "none",
                              color: isEditing ? "white" : "#c9a96e",
                              border: "1px solid #c9a96e",
                              borderRadius: 99,
                              padding: "3px 12px",
                              fontSize: "0.7rem",
                              marginRight: 4,
                            }}
                          >
                            {isEditing ? "Done" : "Edit"}
                          </button>
                          <button
                            className="del-btn"
                            onClick={() => onDelete(item.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#c47b7b",
                              fontSize: "0.8rem",
                              padding: "3px 6px",
                            }}
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals footer */}
            <tfoot>
              <tr
                style={{
                  background: "#fdf5ef",
                  borderTop: "2px solid #e5d9d0",
                }}
              >
                <td
                  colSpan={3}
                  style={{
                    padding: "12px 14px",
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1rem",
                    color: "#6b4c3b",
                    fontWeight: 600,
                  }}
                >
                  Total
                </td>
                <td
                  style={{
                    padding: "12px 14px",
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 600,
                    color: "#5a3e31",
                  }}
                >
                  {formatCurrency(fEst)}
                </td>
                <td
                  style={{
                    padding: "12px 14px",
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {formatCurrency(fAct)}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <DiffBadge estimate={fEst} actual={fAct} />
                </td>
                <td
                  style={{
                    padding: "12px 14px",
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 600,
                    color: "#5a8a70",
                  }}
                >
                  {formatCurrency(fPaid)}
                </td>
                <td
                  style={{
                    padding: "12px 14px",
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 600,
                    color: "#c4722a",
                  }}
                >
                  {formatCurrency(fBal)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
