import {Router} from 'express'
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from '../controllers/user.controller.js'
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },{
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser

)
router.route("/login").post(loginUser)

//secure routes, means user should be logged in
//use verifyJWT whenever only the logged in user can perform a task by going to a specific route 
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refreshToken").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser) //get is used as user wont be sending any data
router
.route("/update-account")
.patch(verifyJWT,updateAccountDetails) //for patch check the crash course of http

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)//doubt
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage) //iske single mai / q daala, doubt,solved

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)

export default router