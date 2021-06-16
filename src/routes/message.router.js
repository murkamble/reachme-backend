const router = require('express').Router()
const messageController = require('../controllers/message.controller')
const authMiddleware = require('../middleware/auth.middleware')

router.post('/message', authMiddleware, messageController.createMessage)
router.get('/conversations', authMiddleware, messageController.getConversations)
router.get('/message/:id', authMiddleware, messageController.getMessages)
router.delete('/message/:id', authMiddleware, messageController.deleteMessages)
router.delete('/conversation/:id', authMiddleware, messageController.deleteConversation)

module.exports = router