
const express = require("express");
const PostRouter = express.Router();

const PostController = require("../Controllers/PostController");
const uploadPost = require("../Middleware/uploadPost");

PostRouter.post(
    "/createPost",
    uploadPost.single("file"),
    PostController.createPost
);

PostRouter.get("/allPosts", PostController.allPosts);

PostRouter.put("/likePost/:id", PostController.likePost);

PostRouter.post("/commentPost/:id", PostController.commentPost);

PostRouter.post("/sharePost/:id", PostController.sharePost);

PostRouter.delete("/deletePost/:id", PostController.deletePost);

PostRouter.put("/updatePost/:id",uploadPost.single("file"),PostController.updatePost);

module.exports = PostRouter;
