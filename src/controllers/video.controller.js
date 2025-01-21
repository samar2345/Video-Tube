import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"



//doubt, not understood


    const getAllVideos = asyncHandler(async (req, res) => {
        const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;
        //TODO: get all videos based on query, sort, pagination
        // Parse page and limit as numbers
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
    
        const matchStage = {
            $match: {},
        };
    
        // If a userId is provided, filter videos by the owner
        if (userId) {
            matchStage.$match.owner = new mongoose.Types.ObjectId(userId);
        }
    
        // If a query string is provided, perform a text search on title or description
        if (query) {
            matchStage.$match.$or = [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
            ];
        }
    
        // Aggregation pipeline
        const videos = await Video.aggregate([
            matchStage,
            {
                $lookup: {
                    from: "users", // The collection where user data is stored
                    localField: "owner", // Owner field in the video
                    foreignField: "_id", // Matching field in the users collection
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
                    owner: { $first: "$owner" }, // Simplify owner to a single object instead of an array
                },
            },
            {
                $sort: { [sortBy]: sortType === "asc" ? 1 : -1 }, // Sorting
            },
            {
                $skip: (pageNumber - 1) * pageSize, // Pagination: Skip records
            },
            {
                $limit: pageSize, // Pagination: Limit records
            },
        ]);
    
        // Get total count of videos (useful for pagination)
        const totalVideos = await Video.countDocuments(matchStage.$match);
    
        // Prepare the response
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    videos,
                    totalVideos,
                    currentPage: pageNumber,
                    totalPages: Math.ceil(totalVideos / pageSize)
                },
                "Videos fetched successfully"
            )
        );
    });


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    const owner = req.user._id
    // TODO: get video, upload to cloudinary, create video
    if (!(title && description)) {
        throw new ApiError(200, "Both title and description are required")
    }

    console.log("req.body : ",req.body)

    // console.log("req.files?.video?.[0]?.path : ",req.files?.video?.[0]?.path)
    const videoLocalPath = req.files?.videoFile?.[0]?.path
    if (!videoLocalPath) {
        throw new ApiError(400, 'Video file is required on local server')
    }
    const videoCloudinary = await uploadOnCloudinary(videoLocalPath)
    if (!videoCloudinary) {
        throw new ApiError(400, 'Video file is required on cloudinary')
    }
    const videoURL = videoCloudinary.url;


    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path
    if (!thumbnailLocalPath) {
        throw new ApiError(400, 'Thumbail file is required on local server')
    }
    const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnailCloudinary) {
        throw new ApiError(400, 'Thumbail file is required on cloudinary')
    }
    const thumbnailURL = thumbnailCloudinary.url;

    const videoDuration = videoCloudinary.duration //in seconds

    const newVideo = await Video.create({
        title,
        description,
        videoFile: videoURL,
        thumbnail: thumbnailURL,
        duration: videoDuration,
        owner,
        isDefault: req.body.isDefault ?? true, // how to toggle isDefault later?? doubt 
        //views?? doubt
    })

    return res.status(201).json(
        new ApiResponse(201, newVideo, "Video published successfully")
    );

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError(400, "Video ID is missing");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video=await Video.findById(videoId).populate({
        path:"owner",
        select:"username fullName avatar email"
    })
    if (!video) {
        throw new ApiError(404, "Video with given videoId not found");
    }
    video.views += 1;
    await video.save();


    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video fetched successfully")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!videoId) {
        throw new ApiError(400, "Video ID is missing");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Optional: Check if the user is the owner of the video
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    const {title,description}=req.body

    const updates={}

    if(title) updates.title=title
    if(description) updates.description=description

    if(req.files?.thumbnail?.[0]?.path){
        const newThumbnailLocalPath=req.files?.thumbnail?.[0]?.path
    if (!newThumbnailLocalPath) {
        throw new ApiError(400, 'New Thumbail file is required on local server')
    }
    const newThumbnailCloudinary = await uploadOnCloudinary(newThumbnailLocalPath)
    if (!newThumbnailCloudinary) {
        throw new ApiError(400, 'New Thumbail file is required on cloudinary')
    }
    const newThumbnailURL = newThumbnailCloudinary.url;

    updates.newThumbnailURL=newThumbnailURL
    }

    const updatedVideo=await Video.findByIdAndUpdate(
        videoId,
        updates,
        {
            new:true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedVideo,"Video Updated successfully")
    )

})



//delete from cloudinary part remaining, doubt
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!videoId) {
        throw new ApiError(400, "Video ID is missing");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    
    
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    } 
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    // // Optional: Delete associated files from Cloudinary   DOUBT 
    // await deleteFromCloudinary(video.videoFile); // Video file
    // await deleteFromCloudinary(video.thumbnail); // Thumbnail

    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(200,null,"Video deleted successfully")
    )
})


//doubt what exactly this button will be used??

    const togglePublishStatus = asyncHandler(async (req, res) => {
        const { videoId } = req.params;
    
        // Step 1: Validate videoId
        if (!videoId) {
            throw new ApiError(400, "Video ID is missing");
        }
    
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            throw new ApiError(400, "Invalid video ID");
        }
    
        // Step 2: Find the video
        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(404, "Video not found");
        }
    
        // Step 3: Check ownership (Optional)
        if (video.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You are not authorized to update this video");
        }
    
        // Step 4: Toggle the isDefault status
        video.isDefault = !video.isDefault;
    
        // Step 5: Save the updated video
        await video.save();
    
        // Step 6: Send a response
        return res.status(200).json(
            new ApiResponse(200, video, "Publish status toggled successfully")
        );
    });
    


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}