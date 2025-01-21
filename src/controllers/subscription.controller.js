import mongoose, {isValidObjectId} from "mongoose"

import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const subscriberId=req.user._id
    // TODO: toggle subscription
    if(!channelId)
        {
            throw new ApiError(400,"Channel Id is missing")
        }
    
        if(!mongoose.Types.ObjectId.isValid(channelId))
                {
                    throw new ApiError(400,"Invalid channel id")
                }

    if(subscriberId.toString()===channelId.toString()){
        throw new ApiError(400,"You cannot subscribe to yourself")
    }
    const existingSubscription=await Subscription.findOne({
        channel:channelId,
        subscriber:subscriberId
    })

    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res.status(200).json(
            new ApiResponse(
                200,
                null,
                "Successfully unsubscribed from the channel"
            )
        );
    }
    else{
        const newSubsription= await Subscription.create(
            {
                subscriber:subscriberId,
                channel:channelId
            }
        )
        return res.status(200).json(
            new ApiResponse(
                201,
                newSubsription,
                "Successfully unsubscribed from the channel"
            )
        );
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId)
    {
        throw new ApiError(400,"Channel Id is missing")
    }

    if(!mongoose.Types.ObjectId.isValid(channelId))
            {
                throw new ApiError(400,"Invalid channel id")
            }
    
    const subscribers=await Subscription.find({
        channel:channelId
    }).populate(
        {
            path:"subscriber",
            select:"fullName username avatar"
        }
    )

    if(!subscribers || subscribers.length==0){
        throw new ApiError(404,"No subscribers found for this channel")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,subscribers,"Channel subscribers fetched successfully")
    )
    

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const subscriberId=channelId // basically the userId 

    if(!subscriberId)
        {
            throw new ApiError(400,"Subscriber Id is missing")
        }
    
        if(!mongoose.Types.ObjectId.isValid(subscriberId))
                {
                    throw new ApiError(400,"Invalid subscriber id")
                }
    
    const subscribedTo=await Subscription.find({
        subscriber:subscriberId
    }).populate({
        path:"channel",
        select:"fullName username avatar"
    })

    if(!subscribedTo || subscribedTo.length==0){
        throw new ApiError(404,"No channels subscribed to")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,subscribedTo,"Subscribed channels fetched successfully")
    )   
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}