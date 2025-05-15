//not understood code


import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js" //User can directly talk to the db, as it is created using mongoose
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false}) //save refresh token to database, validataeBeforeSave:false is used to skip something, eg. the password field(as it is requird compusloriy when we create/update an user document), as we are not updating password here

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh tokens")
        
    }
}

const registerUser=asyncHandler(async(req,res)=>{
    //  res.status(200).json({
    //     messaage:"Hello World"  
    // })
    
    // LOGIC BUILDING
    //get user details from frontend
    //validation - not empty
    //check if user already exists:username, email
    //chek for images, check for avatar
    //upload them on cloudinary, check if avatar uploaded successfully by mullter on cloudinary or not
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res

    const {fullName,username,email,password}=req.body
    //  console.log("email : ",email)

    // if(!fullName){
    //     throw new ApiError(400,"fullname required")
    // }

    if(
        [fullName,email,username,password].some((field)=>field?.trim()===""
    )){
        throw new ApiError(400,"all fields are required")
    }

    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,'User already exists with given username or email')
    }
    //console.log(req.files ) console.log(req.boody)
    const avatarLocalPath=req.files?.avatar[0]?.path
    //const coverImageLocalPath=req.files?.coverImage[0]?.path


    //Because we are not checking if coverImage is there or not like avatarLocalPath
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,'Avatar file is required on local server')
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath) 

    if(!avatar){
        throw new ApiError(400,'Avatar file is required on cloudinary')
    }

    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )
     
})

const loginUser=asyncHandler(async(req,res)=>{
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie

    const {email,username,password}=req.body
    if(!(username ||email) ){
        throw new ApiError(400,"username or email is required")
    }

    const user=await User.findOne(
        {
            $or:[{username},{email}]
        }
    )
    
    if(!user){
        throw new ApiError(404,"User does not exist")
    } 
    
    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid credentials")
    }
    
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken") //optional,doubt : refreshToken toh user ko bhi bhejne ka hota hai na, to exclude q kiya response se

    const options={ 
        httpOnly:true,
        secure: true
        //Now cookie can be modified only by server, not by frontend
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(  
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken // when user wants to save accessToken,refreshToken on its own, for eg: wants to store it in local storage, or mobile application cookies arent stored so for it, etc    
            },
            "User logged in successfully"
        )
    )
})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // $set:{
            //     refreshToken:undefined  
            // } 
            // Check why did we changed this, doubt

            $unset:{
                refreshToken:1 // this removes the field from document
            }
        },
        {
            new:true
        }
    )
    const options={ 
        httpOnly:true,
        secure: true
        
    }   

    //now clear cookies
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User Logged out")
    )

})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unautorized request")
    }

    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user=await User.findById(decodedToken._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,newRefreshToken}= await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,newRefreshToken},
                "Access Token refreshed successfuly"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message ||"Invalid refresh token")
    }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword,confPassword}=req.body
    const user=await User.findById(req.user._id)
    const isPasswordCorrect=user.isPasswordCorrect(oldPassword)

    if(confPassword!== newPassword){

    }
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed succcessfully"
        )
    )

})

const getCurrentUser=asyncHandler((async(req,res)=>{
    return res.
    status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        )
    )
})) 

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName, email}=req.body
    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user=User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email:email
            }
        },
        {
            new:true, //returns data after updation
        }
    ).select("-password") // why do we alwaays exclude password

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Account details successfully updated"
        )
    )
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath= req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file necessary")
    }

    const avatar=uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Error whlle uploading avatar")
    }

    user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    )
    //todo : delete the avatar image
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar updated successfully"
        )
    )
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath= req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image file necessary")
    }

    const coverImage=uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Error whlle uploading cover image")
    }

    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Cover image updated successfully"
        )
    )
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params
    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }
    console.log(username)

    const channel=await User.aggregate([
        {
            $match:{
                username:username.toLowerCase()
            }
            
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]}, //$in can check in both arrays and object
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                avatar:1,
                coverImage:1,
                email:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
            }
        }
    ])
    console.log("User channel profile using aggregation : ",channel)

    if(!channel?.length){
        throw new ApiError(404,"channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel[0],
            "User channel fetched channel successfully"
        )
    )
})

const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]

                        }
                    },
                    {
                        //$lookup gives array, so for better response to frontend we overwritted owner with just 1st value from array of owners
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}