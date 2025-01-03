// import { ApiError } from "../utils/ApiError.js";
// import { asyncHandler } from "../utils/aysncHandler.js";
// import jwt from "jsonwebtoken"
// import { User } from "../models/user.model.js";

// export const verifyJWT = asyncHandler(async(req, _, next) => {
//     try {
//         const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        // console.log("Request Cookies:", req.cookies);
        // console.log("Authorization Header:", req.header("Authorization"));
//         // console.log(token);
//         if (!token) {
//             throw new ApiError(401, "Unauthorized request")
//         }
    
//         const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
//         const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
//         if (!user) {
            
//             throw new ApiError(401, "Invalid Access Token")
//         }
    
//         req.user = user;
//         next()
//     } catch (error) {
//         throw new ApiError(401, error?.message || "Invalid access token")
//     }
    
// })
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/aysncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// _ because res object is not used in this method
export const verifyJWT=asyncHandler(async(req,_,next)=>{
    try {
        const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","") // 2nd part is used for mobile application
        console.log("Request Cookies:", req.cookies);
        console.log("Authorization Header:", req.header("Authorization"));
        console.log("Token : ",token)
        if(!token){
            throw new ApiError(401,"Unauthorized Request")
    
        }
        
    
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user= await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            //todo : discuss about frontend
            throw new ApiError(401,"Invalid access token")
        }
    
        req.user=user
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid accesss token")
    }
})