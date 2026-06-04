const router = require("express").Router()
const { register, login, logout, getMe } = require("../controller/authController")
const { requireAuth } = require("../middleware/auth")

router.post("/register", register)
router.post("/login", login)
router.post("/logout", logout)
router.get("/me", requireAuth, getMe)

module.exports = router