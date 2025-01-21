
import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!videoId) {
        throw new ApiError(400, "Video ID is missing");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Video ID is invalid");
    }

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    // Aggregation pipeline
    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "users", // Collection where user data is stored
                localField: "owner", // Field in comment model
                foreignField: "_id", // Field in user model
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                owner: { $first: "$owner" }, // Simplify owner to a single object
            },
        },
        {
            $sort: { createdAt: -1 }, // Sort comments by creation date (most recent first)
        },
        {
            $skip: (pageNumber - 1) * pageSize, // Pagination: Skip records for previous pages
        },
        {
            $limit: pageSize, // Pagination: Limit results to page size
        },
    ]);

    // Get total count of comments for the video
    const totalComments = await Comment.countDocuments({
        video: new mongoose.Types.ObjectId(videoId),
    });

    // Return response
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                totalComments,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalComments / pageSize),
            },
            "Comments fetched successfully"
        )
    );
});


const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content}=req.body;
    // const ownerId=req.user._id;
    // const {videoId,userId}=req.params;
    const {videoId}=req.params;
    const userId=req.user._id;
    if (!userId) {
            throw new ApiError(400, "User ID is missing");
        }
    
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "Invalid User ID");
        }

    if (!videoId) {
            throw new ApiError(400, "Video ID is missing");
        }
    
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            throw new ApiError(400, "Invalid video ID");
        }

    if(!content){
        throw new ApiError(400,"Content is needed");
    }

    const newComment=await Comment.create({
        content,
        // // owner:mongoose.Types.ObjectId(userId), because we are already checking above if userId is valid mongoose id
        // owner:userId,
        // // video:mongoose.Types.ObjectId(videoId)
        // video:videoId

        owner: new mongoose.Types.ObjectId(userId),
        video: new mongoose.Types.ObjectId(videoId),
    })
    return res.
    status(201)
    .json(
        new ApiResponse(201,newComment,"Comment added succcessfully")   
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    

    const {commentId}=req.params;
    const userId=req.user._id;

    // Validate inputs
    

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid or missing comment ID");
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid or missing user ID");
    }

    // Find the comment to check ownership
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the authenticated user is the owner of the comment
    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await comment.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
    );
});


const updateComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    // const { commentId } = req.params; // Extract commentId and userId from request params
    const {commentId}=req.params;
    const userId=req.user._id;

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid or missing comment ID");
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid or missing user ID");
    }

    // Find the comment to check ownership
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the authenticated user is the owner of the comment
    if (comment.owner.toString() !== userId.toString()) {
        console.log(" owner: ",comment.owner.toString())
        console.log(" current user : ",userId)
        throw new ApiError(403, "You are not authorized to update this comment");
    }
    return res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    );
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
