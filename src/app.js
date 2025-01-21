import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
origin:process.env.CORS_ORIGIN
const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))//extended object
app.use(express.static("public"))//for storing pdfs, images, so that anyone can acces it???
app.use(cookieParser())//used to read and update cookies on the browser of user

//routes import
import userRouter from './routes/user.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import likeRouter from './routes/like.routes.js'
import commentRouter from './routes/comment.routes.js'
import videoRouter from './routes/video.routes.js'


//routes declaration
app.use("/api/v1/users",userRouter) //api/v1??
app.use("/api/v1/tweets",tweetRouter)
app.use("/api/v1/playlists",playlistRouter)
app.use("/api/v1/subscriptions",subscriptionRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/comments",commentRouter)
app.use("/api/v1/videos",videoRouter)



export {app}