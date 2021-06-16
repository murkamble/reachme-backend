const router = require('express').Router()
const postController = require('../controllers/post.controller')
const authMiddleware = require('../middleware/auth.middleware')

router.route('/posts')
    .post(authMiddleware, postController.createPost)
    .get(authMiddleware, postController.getPosts)

router.route('/post/:id')
    .patch(authMiddleware, postController.updatePost)
    .get(authMiddleware, postController.getPost)
    .delete(authMiddleware, postController.deletePost)

router.patch('/post/:id/like', authMiddleware, postController.likePost)
router.patch('/post/:id/unlike', authMiddleware, postController.unLikePost)
router.get('/user_posts/:id', authMiddleware, postController.getUserPosts)
router.get('/post_discover', authMiddleware, postController.getPostsDicover)
router.patch('/savePost/:id', authMiddleware, postController.savePost)
router.patch('/unSavePost/:id', authMiddleware, postController.unSavePost)
router.get('/getSavePosts', authMiddleware, postController.getSavePosts)

module.exports = router