const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const pool = require("../db")

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

function generateCode(base, length = 4) {
    const cleaned = base.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 8)
    const suffix = String(Math.floor(Math.random() * 10 ** length)).padStart(length, '0')
    return cleaned + suffix
}

async function login(req, res) {
    const { username, password } = req.body
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password required "})
    }

    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.display_name, u.password_hash, u.role, u.couple_id, c.name AS couple_name, c.couple_code , c.invite_code
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
            coupleCode: user.couple_code,
            // Only editors get the invite code block - viewers never see it
            inviteCode: user.role === 'editor' ? user.invite_code : undefined,
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
    const { username, displayName, password, role, coupleName, coupleCode, inviteCode } = req.body

    if (!username || !displayName || !password || !role) {
        return res.status(400).json({ error: "Missing required fields" })
    }
    if (!['editor', 'editor_join', 'viewer'].includes(role)) {
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
            await client.query('ROLLBACK')
            return res.status(409).json({ error: "Username already taken" })
        }

        let coupleId
        let dbRole = 'editor'
        let responseCoupleCode = null
        let responseInviteCode = null
        let responseCoupleName = null

        if (role === 'editor') {
            // ---- Create a brand new wedding budget ----
            if (!coupleName?.trim()) {
                await client.query('ROLLBACK')
                return res.status(400).json({ error: "Couple name is required" })
            }

            const newCoupleCode = generateCode(coupleName, 4)
            const newInviteCode = generateCode(coupleName + 'invite', 6)

            const coupleResult = await client.query(
                `INSERT INTO couples (name, couple_code, invite_code)
                VALUES ($1, $2, $3)
                RETURNING id, name, couple_code, invite_code`,
                [coupleName.trim(), newCoupleCode, newInviteCode]
            )
            coupleId = coupleResult.rows[0].id
            responseCoupleCode = coupleResult.rows[0].couple_code
            responseInviteCode = coupleResult.rows[0].invite_code
            responseCoupleName = coupleResult.rows[0].name  

        } else if (role === 'editor_join'){
            //   ---- Join an EXISTING wedding as a 2nd editor ----
            if (!inviteCode?.trim()) {
                await client.query('ROLLBACK')
                return res.status(400).json({ error: "Invite code is required" })
            }

            const coupleResult = await client.query(
                `SELECT id, name FROM couples WHERE UPPER(invite_code) = UPPER($1)`,
                [inviteCode.trim()]
            )
            if (coupleResult.rows.length === 0) {
                await client.query("ROLLBACK")
                return res.status(404).json({ error: "No wedding found with that invite code" })
            }
            coupleId = coupleResult.rows[0].id
            responseCoupleName = coupleResult.rows[0].name

            const countResult = await client.query(
                `SELECT COUNT(*) AS count FROM users WHERE couple_id = $1 AND role = 'editor'`,
                [coupleId]
            )
            if (parseInt(countResult.rows[0].count, 10) >= 2) {
                await client.query('ROLLBACK')
                return res.status(409).json({ error: "This wedding already has 2 editors" })
            }

        } else {
            if (!coupleCode?.trim()) {
                await client.query('ROLLBACK')
                return res.status(400).json({ error: "Couple code is required" })
            }
            const coupleResult = await client.query(
                `SELECT id, name FROM couples WHERE UPPER(couple_code) = UPPER($1)`,
                [coupleCode.trim()]
            )
            if (coupleResult.rows.length === 0) {
                await client.query("ROLLBACK")
                return res.status(404).json({ error: "No wedding found with that code" })
            }
            coupleId = coupleResult.rows[0].id
            dbRole = 'viewer'
            responseCoupleName = coupleResult.rows[0].name
        }

        const passwordHash = await bcrypt.hash(password, 12)

        try {
            await client.query(
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
                    dbRole, 
                    coupleId,
                ]
            )
        } catch (err) {
            if (err.message?.includes('editor_limit_reached')) {
                await client.query('ROLLBACK')
                return res.status(409).json({ error: "This wedding already has 2 editors"})
            }
            throw err
        }

        await client.query('COMMIT')

        res.json({
            message: "Account created",
            role: dbRole,
            coupleName: responseCoupleName,
            coupleCode: responseCoupleCode,
            inviteCode: responseInviteCode,
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