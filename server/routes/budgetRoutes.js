const router = require("express").Router()
const { getItems, postItems, updateItems, deleteItems, getSummary } = require("../controller/budgetController")
const { requireAuth, requireEditor } = require("../middleware/auth")

router.use(requireAuth)

router.get("/items", getItems)
router.post("/items", requireEditor, postItems)
router.patch("/items/:id", requireEditor, updateItems)
router.delete("/items/:id", requireEditor, deleteItems)
router.get("/summary", getSummary)

module.exports = router