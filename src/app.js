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
app.use(express.urlencoded({exntended:true,limit:"16kb"}))//extended object
app.use(express.static("public"))//for storing pdfs, images, so that anyone can acces it???
app.use(cookieParser())//used to read and update cookies on the browser of user

//routes import
import userRouter from './routes/user.routes.js'

//routes declaration
app.use("/api/v1/users",userRouter) //api/v1??


export {app}