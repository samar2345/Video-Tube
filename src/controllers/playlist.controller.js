import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    
    
    //TODO: create playlist
    if(!(name && description)){
        throw new ApiError(400,"Name and description, both required")
    }
    console.log("req.body : ",req.body)

    const ownerId=req.user._id

    const existingPlaylist=await Playlist.findOne({
        name:name,
        owner:ownerId
    })
    if (existingPlaylist) {
        throw new ApiError(400, "A playlist with this name already exists");
    }

    const playlist=await Playlist.create({
        name,
        description,
        owner:ownerId,
        video:[]
    })
    
    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created successfully")
    );

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if (!userId) {
        throw new ApiError(400, "User ID is missing");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid User ID");
    }

    const userPlaylists=await Playlist.find({
        owner:userId
    })

    if (!userPlaylists || userPlaylists.length === 0) {
        throw new ApiError(404, "No playlists found for the user");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,userPlaylists,"User playlists retreived successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is missing");
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    const playlist=await Playlist.findById(
        playlistId
    ).populate(
        {
            path:"video",
            select:"videoFile thumbnail description duration views owner"
        }
    ).populate(
        {
            path:"owner",
            select:"username fullName avatar email"
        }
    )

    if (!playlist ) {
        throw new ApiError(404, "No playlist found by the playlist id");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist fetched successfully using playlist id")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is missing");
    }

    // const videoLocalPath=req.files?.video[0].path
    // if(!videoLocalPath){
    //     throw new ApiError(400,'Video file is required on local server')
    // }
    // const video=await uploadOnCloudinary(videoLocalPath)

    if(!videoId) {
        throw new ApiError(400, "Video ID is missing");
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found with given playlist id");
    }

    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video with given video id does not exist");
    }

    if (playlist.video.includes(videoId)) {
        throw new ApiError(400, "Video is already in the playlist");
    }

    playlist.video.push(videoId)
    await playlist.save()

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist successfully")
    );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is missing");
    }

    if (!videoId) {
        throw new ApiError(400, "Video ID is missing");
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video with given video id does not exist");
    }

    let playlist=await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found with given playlist id");
    }

    if (!playlist.video.includes(videoId)) {
        throw new ApiError(400, "Video does not exist in the playlist");
    }
    
    playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{video:videoId}
        },
        {
            new:true
        }
    )

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video removed from the playlist successfully")
    );


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is missing");
    }
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    const playlist=await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found with given playlist id");
    }

    
    await playlist.deleteOne()

    return res.status(200).json(
        new ApiResponse(200, null, "Playlist deleted successfully")
    );

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is missing");
    }
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    if (!name && !description) {
        throw new ApiError(400, "No fields provided for update");
    }

    const updatedPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        {$set:{
            ...(name && { name }), // Add the `name` field only if `name` exists in the request body
            ...(description && { description }), // Add the `description` field only if `description` exists in the request body
        }},{
            new:true
        }
    )
    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}