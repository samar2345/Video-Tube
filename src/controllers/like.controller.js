import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId=req.user._id
    //TODO: toggle like on video

    if(!videoId){
        throw new ApiError(400,"Video id is missing")
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Video id is invalid")
    }

    const alreadyLiked= await Like.findOne({
        video:videoId,
        likedBy:userId
    })

    if(alreadyLiked){
        await Like.findByIdAndDelete(alreadyLiked._id)
        return res.
        status(200)
        .json(
            new ApiResponse(200,null,"Unliked video successfully")
        )
    }
    else{
        const newLike = await Like.create(
            {
                video:videoId,
                likedBy:userId
            }
        )
        return res.
        status(200)
        .json(
            new ApiResponse(200,newLike,"Liked video successfully")
        )
    }

    

    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const userId=req.user._id

    if(!commentId){
        throw new ApiError(400,"Comment id is missing")
    }

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Comment id is invalid")
    }

    const alreadyLiked= await Like.findOne({
        comment:commentId,
        likedBy:userId
    })

    if(alreadyLiked){
        await Like.findByIdAndDelete(alreadyLiked._id)
        return res.
        status(200)
        .json(
            new ApiResponse(200,null,"Unliked comment successfully")
        )
    }
    else{
        const newLike = await Like.create(
            {
                comment:commentId,
                likedBy:userId
            }
        )
        return res.
        status(200)
        .json(
            new ApiResponse(200,newLike,"Liked comment successfully")
        )
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId=req.user._id

    if(!tweetId){
        throw new ApiError(400,"Tweet id is missing")
    }

    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new ApiError(400,"Tweet id is invalid")
    }

    const alreadyLiked= await Like.findOne({
        tweet:tweetId,
        likedBy:userId
    })

    if(alreadyLiked){
        await Like.findByIdAndDelete(alreadyLiked._id)
        return res.
        status(200)
        .json(
            new ApiResponse(200,null,"Unliked tweet successfully")
        )
    }
    else{
        const newLike = await Like.create(
            {
                tweet:tweetId,
                likedBy:userId
            }
        )
        return res.
        status(200)
        .json(
            new ApiResponse(200,newLike,"Liked tweet successfully")
        )
    }
}
)

// const getLikedVideos = asyncHandler(async (req, res) => {
//     //TODO: get all liked videos

//     const userId=req.user._id
//     const likedVideos=await Like.find({
//         likedBy:userId,
//         // type:"video"
//     }).populate({
//         path:"video",
//         select:"videoFile thumbnail description duration views owner",
//         populate: {
//             path: "owner", // Populate the owner field from the Video model
//             select: "username fullName avatar email", // Select specific fields from the User model
//         },
//     })

//     if(!likedVideos || likedVideos.length==0){
//         throw new ApiError(404,"No liked videos found for the user")
//     }

//     return res
//     .status(200)
//     .json(
//         new ApiResponse(200,likedVideos,"Videos liked by user fetched successfully")
//     )

// })

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId=req.user._id
    const likedVideos=await Like.find({
        likedBy:userId,
        // video!=undefined
        // type:"video"
    }).populate({
        path:"video",
        select:"videoFile thumbnail description duration views owner",
        populate: {
            path: "owner", // Populate the owner field from the Video model
            select: "username fullName avatar email", // Select specific fields from the User model
        },
    })

    if(!likedVideos || likedVideos.length==0){
        throw new ApiError(404,"No liked videos found for the user")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,likedVideos,"Videos liked by user fetched successfully")
    )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}