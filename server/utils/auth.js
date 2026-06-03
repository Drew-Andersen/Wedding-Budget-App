const jwt = require("jsonwebtoken")

function requireAuth(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1]
    if(!token) return res.status(401).json({ error: "Not authorized" })

        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET)
            next()
        } catch {
            res.clearCookie("token")
            return res.status(401).json({ error: "Invalid or expired session" })
        }
}

function requireEditor(req, res, next) {
    if (req.user?.role !== "editor") {
        return res.status(403).json({ error: "Editor access required" })
    }
    next()
}

module.exports = { requireAuth, requireEditor }