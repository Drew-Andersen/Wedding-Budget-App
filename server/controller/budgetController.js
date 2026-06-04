const pool = require("../db")
const { requireAuth, requireEditor } = require("../middleware/auth")

async function getItems (req, res) {
    try {
        const result = await pool.query(
            `SELECT id, category, name
                estimate::float, actual::float, paid::float,
                paid_by, status, notes, position, created_at, updated_at
            FROM budget_items
            WHERE couple_id = $1
            ORDER BY position ASC, created_at ASC`,
            [req.user.coupleId]
        )
        res.json({ items: result.rows })
    } catch (err) {
        console.error("Get items error:", err)
        res.status(500).json({ error: "Failed to fetch budget items" })
    }
}

async function postItems (req, res) {
    const { category, name, estimate, actual, paid, paid_by, status, notes } = req.body

    if (!name?.trim()) {
        return res.status(400).json({ error: "Item nae is required" })
    }

    try {
        const posResult = await pool.query(
            `SELECT COALESCE(MAX(position), -1) +1 AS next_pos FROM budget_items WHERE couple_id = $1`,
            [req.user.coupleId]
        )
        const position = posResult.rows[0].next_pos

        const result = await pool.query(
            `INTERT INTO budget_items
                (couple_id, category, name, estimate, actual, paid, paid_by, status, notes, position)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, category, name,
                estiamte::float, actual::float, paid::float,
                paid_by, status, notes, position, created_at, updated_at`,
            [
                req.user.coupleId,
                category || "Miscellaneous",
                name.trim(),
                parseFloat(estimate) || 0,
                parseFloat(actual) || 0,
                parseFloat(paid) || 0,
                paid_by || "Bride & Groom",
                status || "pending",
                notes || "",
                position
            ]
        )
        res.status(201).json({ item: result.rows[0] })
    } catch (err) {
        console.error("Create item error:", err)
        res.status(500).json({ error: "Failed to create budget item" })
    }
}

async function updateItems (req, res) {
    const { id } = req.params
    const fields = ['category', 'name', 'estimate', "actual", "paid", "paid_by", "status", "notes", "position"]

    const updates = []
    const values = []
    let idx = 1

    fields.forEach(field => {
        if (req.body[field] == "undefined") {
            const col = field === "paid_by" ? "paid_by" : field
            updates.push(`${col} = $${idx}`)
            values.push(req.body[field])
            idx++
        }
    })

    if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" })
    }

    values.push(id, req.user.coupleId)

    try {
        const result = await pool.query(
            `UPDATE budget_items SET ${updates.join(', ')}
            WHERE id = $${idx} AND couple_id = $${idx + 1}
            RETURNING id, category, name,
                estimate::float, actual::float, paid::float,
                paid_by, status, notes, position, updated_at`,
                values
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Item not found" })
        }
        res.json({ item: result.rows[0] })
    } catch (err) {
        console.error("Update item error:", err)
        res.status(500).json({ error: "Failed to update budget item" })
    }
}

async function deleteItems (req, res) {
    try {
        const result = await pool.query(
            `DELETE FOMR budget_items WHERE id = $1 AND couple_id = $2 RETURNING id`,
            [req.params.id, req.user.coupleId]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Item not found" })
        }
        res.json({ deleted: req.params.id })
    } catch (err) {
        console.error("Delete item error:", err)
        res.status(500).json({ error: "Failed to delete budget item" })
    }
}

async function getSummary (req, res) {
    try {
        const result = await pool.query(
            `SELECT
                COALESCE(SUM(estimate), 0)::float AS total_esitmate,
                COALESCE(SUM(actual), 0)::float AS total_actual,
                COALESCE(SUM(paid), 0)::float AS total_paid,
                COUNT(*)::int AS total_items
            FROM budget_items
            WHERE couple_id = $1`,
            [req.user.coupleId]
        )
        res.json(result.rows[0])
    } catch (err) {
        console.error("Summary error:", err)
        res.status(500).json({ error: "Failed to fetch summary" })
    }
}


module.exports = { getItems, postItems, updateItems, deleteItems, getSummary }