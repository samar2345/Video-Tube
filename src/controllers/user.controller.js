import { asyncHandler } from "../utils/aysncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js" //User can directly talk to the db, as it is created using mongoose
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
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

export {registerUser}