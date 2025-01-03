//not understood code


import { asyncHandler } from "../utils/aysncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js" //User can directly talk to the db, as it is created using mongoose
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { jwt } from "jsonwebtoken";

const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false}) //save refresh token to database

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
        username:username.toLowerCase
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
            $set:{
                refreshToken:undefined  
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

const refreshAccessToken=asyncHandler(async()=>{
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


export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}