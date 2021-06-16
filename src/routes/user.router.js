const router = require('express').Router()
const userController = require("../controllers/user.controller")
const authMiddleware = require("../middleware/auth.middleware")

router.get('/search', authMiddleware, userController.searchUser)
router.get('/user/:id', authMiddleware, userController.getUser)
router.patch('/user', authMiddleware, userController.updateUser)
router.patch('/user/:id/follow', authMiddleware, userController.follow)
router.patch('/user/:id/unfollow', authMiddleware, userController.unfollow)
router.get('/suggestionsUser', authMiddleware, userController.suggestionsUser)

module.exports = router