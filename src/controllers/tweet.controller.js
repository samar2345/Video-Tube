import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { application } from "express"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const{content}=req.body
    console.log("req.body:",req.body)
    console.log("content: ",content)
    if(!content?.trim()){
        throw new ApiError(400,"Content is required")
    }
    const userId=req.user._id
    if(!userId){
        throw new ApiError(401,"Unauthorized. user must be logged in to create a tweet")
    }
    const createdTweet=await Tweet.create({
        content:content.trim(),
        owner:userId
    })
    return res.
    status(201)
    .json(
        new ApiResponse(201,createdTweet,"Tweet created successfully")
    )
    
})

// const getUserTweets = asyncHandler(async (req, res) => {
//     // TODO: get user tweets
//     // const user= await User.findById(req.user._id)
//     // if(!user){
//     //     throw new ApiError(401,"Unauthorized. user must be logged in to create a tweet")
//     // }
    
//     const tweets=await Tweet.aggregate([
//         {
//             $match:{
//                 owner: new mongoose.Types.ObjectId(req.user._id)
//             }
//         },
//         {
//             $lookup:{
//                 from:"users",
//                 localField:"owner",
//                 foreignField:"_id",
//                 as:"tweetedBy",
//             }
//         },
//         {
//             $project:{
//                 content:1,
//                 createdAt:1,
//                 "tweetedBy.username":1,
//                 "tweetedBy.email":1
//             }
//         },
//         {
//             $unwind:"$tweetedBy"
//         }
//     ])

//     return res
//     .status(200)
//     .json(
//         new ApiResponse(200,tweets,"Tweets of speicific user retreived successfully")
//     )
// })

const getUserTweets = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
        throw new ApiError(400, "Invalid User ID");
    }

    console.log("User ID from request:", req.user._id);

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "tweetedBy",
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                "tweetedBy.username": 1,
                "tweetedBy.email": 1
            }
        },
        {
            $unwind: "$tweetedBy"
        }
    ]);

    console.log("Aggregated Tweets:", tweets);

    if (!tweets.length) {
        console.warn("No tweets found for the user.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweets, "Tweets of specific user retrieved successfully")
        );
})


const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {content}=req.body
    const tweetId=req.params.tweetId
    const userId=req.user._id

    console.log("tweet id : ",tweetId)
    if(!content?.trim()){
        throw new ApiError(400,"Content is required")
    }

    if (!tweetId) {
        throw new ApiError(404, "Tweet not found or you are not authorized to update it.");
    }
    console.log(tweetId)
    const updatedTweet=await Tweet.findOneAndUpdate(
        {
            _id:tweetId,
            owner:userId
        },{
            content
        },
        {
            new:true,
            runValidators:true
        }
    )
    console.log("Updated tweet : ",updatedTweet)

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedTweet,"Tweet updated successfully")
    )
    



})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const userId=req.user._id
    const tweetId=req.params.tweetId

    if (!tweetId) {
        throw new ApiError(404, "Tweet not found or you are not authorized to delete it.");
    }

    const tweet=await Tweet.findOneAndDelete(
        {
            _id:tweetId,
            owner:userId
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,tweet,"Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}