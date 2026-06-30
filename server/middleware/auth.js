const jwt = require("jsonwebtoken")

function requireAuth(req, res, next) {
    console.log("Origin:", req.headers.origin)
    console.log("Cookies:", req.cookies)
    console.log("Cookie header:", req.headers.cookie)

    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1]
    if(!token) {
        console.log("NO TOKEN RECEIVED")
        return res.status(401).json({ error: "Not authorized" })
    }

        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET)
            console.log("Authenticated:", req.user.username)
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