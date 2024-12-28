import express from 'epxress'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import CORS_ORIGIN from '.../.env'
const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({exntended:true,limit:"16kb"}))//extended object
app.use(express.static("public"))//for storing pdfs, images, so that anyone can acces it???

app.use(cookieParser())//used to read and update cookies on the browser of user
export {app}