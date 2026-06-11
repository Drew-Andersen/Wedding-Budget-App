const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const pool = require("../db")

const COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
}

async function login(req, res) {
    const { username, password } = req.body
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password required "})
    }

    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.display_name, u.password_hash, u.role, u.couple_id, c.name AS couple_name, c.couple_code 
            FROM users u
            JOIN couples c ON c.id = u.couple_id
            WHERE u.username = $1`,
            [username.toLowerCase()]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Incorrect username or password" })
        }

        const user = result.rows[0]
        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) {
            return res.status(401).json({ error: "Incorrect username or password" })
        }

        const payload = {
            userId: user.id,
            username: user.username,
            displayName: user.display_name,
            role: user.role,
            coupleId: user.couple_id,
            coupleName: user.couple_name,
            coupleCode: user.couple_code
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
        res.cookie('token', token, COOKIE_OPTS)
        res.json({ user: payload })
    } catch (err) {
        console.error("Login error", err)
        res.status(500).json({ error: "Server error during login" })
    }
}

function logout (req, res) {
    res.clearCookie('token')
    res.json({ message: "Logged out" })
}

function getMe (req, res) {
    res.json({ user: req.user })
}

async function register (req, res) {
    const { username, displayName, password, role, coupleName, coupleCode } = req.body

    if (!username || !displayName || !password || !role) {
        return res.status(400).json({ error: "Missing required fields" })
    }
    if (!['editor', 'viewer'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" })
    }
    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" })
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return res.status(400).json({ error: "Username may only contain letters, numbers, - and _" })
    }

    const client = await pool.connect()
    try{
        await client.query('BEGIN')

        const existing = await client.query(`SELECT id FROM users WHERE username = $1`, [username.toLowerCase()])
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: "Username already taken" })
        }

        let coupleId

        if (role === 'editor') {
            if (!coupleName?.trim()) {
                return res.status(400).json({ error: "Couple name is required" })
            }

            // Generate a unique couple code (first 8 chars of name + 4 random digits)
            const base = coupleName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0,8)
            const suffix = String(Math.floor(1000 + Math.random() * 9000))
            const newCode = base + suffix

            const coupleResult = await client.query(
                `INSERT INTO couples (name, couple_code) VALUES ($1, $2) RETURNING id, couple_code`,
                [coupleName.trim(), newCode]
            )
            coupleId = coupleResult.rows[0].id
            req._coupleCode = coupleResult.rows[0].couple_code
        } else {
            if (!coupleCode?.trim()) {
                return res.status(400).json({ error: "Couple code is required" })
            }
            const coupleResult = await client.query(
                `SELECT id, name FROM couples WHERE UPPER(couple_code) = UPPER($1)`,
                [coupleCode.trim()]
            )
            if (coupleResult.rows.length === 0) {
                return res.status(404).json({ error: "No wedding found with that code" })
            }
            coupleId = coupleResult.rows[0].id
            req._coupleName = coupleResult.rows[0].name
        }

        const passwordHash = await bcrypt.hash(password, 12)
        const userResult = await client.query(
            `INSERT INTO users (
                username, 
                display_name, 
                password_hash, 
                role, 
                couple_id
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, display_name, role, couple_id`,
            [
                username.toLowerCase(), 
                displayName.trim(), 
                passwordHash, 
                role, 
                coupleId,
            ]
        )

        await client.query("COMMIT")

        const user = userResult.rows[0]

        const coupleRow = await pool.query(`SELECT name, couple_code FROM couples WHERE id = $1`, [coupleId])
        const couple = coupleRow.rows[0]

        res.json({
            message: "Account created",
            coupleCode: couple.couple_code,
            coupleName: couple.name,
            role
        })
    } catch (err) {
        await client.query("ROLLBACK")
        console.error("Register error:", err)
        res.status(500).json({ error: "Server error during registration" })
    } finally {
        client.release()
    }
}

module.exports = { login, logout, getMe, register }