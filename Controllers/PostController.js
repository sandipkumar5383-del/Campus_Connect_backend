
const Post = require("../Models/PostModel");
const mongoose = require("mongoose");

exports.createPost = async (req, res) => {
    try {
        const { userId, userName, userRole, content } = req.body;

        if (!userId || !userName || !userRole) {
            return res.status(400).json({
                message: "User details are required"
            });
        }

        if (!content?.trim() && !req.file) {
            return res.status(400).json({
                message: "Please write something or select a photo."
            });
        }

        const newPost = new Post({
            userId,
            userName,
            userRole,
            content: content?.trim() || "",
            file: req.file ? req.file.filename : "",
            fileType: req.file
                ? (req.file.mimetype === "application/pdf" ? "pdf" : "image")
                : null
        });

        await newPost.save();

        res.status(201).json({
            message: "Post created successfully",
            post: newPost
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Unable to create post",
            error: error.message
        });
    }
};

exports.allPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });

        res.status(200).json({ posts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// LIKE / UNLIKE POST
exports.likePost = async (req, res) => {
    try {
        const { userId } = req.body;
        const { id } = req.params;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Valid user ID is required" });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const alreadyLiked = post.likes.some(
            (likedUser) => likedUser.toString() === userId
        );

        if (alreadyLiked) {
            post.likes = post.likes.filter(
                (likedUser) => likedUser.toString() !== userId
            );
        } else {
            post.likes.push(userId);
        }

        await post.save();

        res.status(200).json({
            message: alreadyLiked ? "Post unliked" : "Post liked",
            liked: !alreadyLiked,
            likes: post.likes
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to like post",
            error: error.message
        });
    }
};


// ADD COMMENT
exports.commentPost = async (req, res) => {
    try {
        const { userId, userName, text } = req.body;
        const { id } = req.params;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Valid user ID is required" });
        }

        if (!userName || !text?.trim()) {
            return res.status(400).json({
                message: "User name and comment are required"
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        post.comments.push({
            userId,
            userName,
            text: text.trim()
        });

        await post.save();

        res.status(201).json({
            message: "Comment added successfully",
            comments: post.comments
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to add comment",
            error: error.message
        });
    }
};


// SHARE POST
exports.sharePost = async (req, res) => {
    try {
        const { userId } = req.body;
        const { id } = req.params;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Valid user ID is required" });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Count one share per user
        if (!post.shares.some((sharedUser) => sharedUser.toString() === userId)) {
            post.shares.push(userId);
            await post.save();
        }

        res.status(200).json({
            message: "Post shared successfully",
            shares: post.shares
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to share post",
            error: error.message
        });
    }
};


exports.deletePost = async (req, res) => {
    try {
        const { userId, userRole } = req.body;

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const isAdmin = userRole === "admin";

        const isOwner =
            String(post.userId) === String(userId);

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                message: "You cannot delete this post"
            });
        }

        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Post deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to delete post",
            error: error.message
        });
    }
};


exports.updatePost = async (req, res) => {
    try {
        const { userId, userRole, content } = req.body;

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const isAdmin = userRole === "admin";

        const isOwner =
            String(post.userId) === String(userId);

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                message: "You cannot edit this post"
            });
        }

        post.content = content || "";

        if (req.file) {
            post.file = req.file.filename;

            post.fileType = req.file.mimetype === "application/pdf"
                ? "pdf"
                : "image";
        }

        await post.save();

        res.status(200).json({
            message: "Post updated successfully",
            post
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to update post",
            error: error.message
        });
    }
};
