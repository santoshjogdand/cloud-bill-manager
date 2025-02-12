import express from "express"
import cookieParser from 'cookie-parser';
import cors from "cors"

const app = express()

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))


// routes
import organization from "./routes/organization.routes.js";

//middlewares
import errorHandler from "./middlewares/errorHandler.js"



app.use(cookieParser());
app.use(cors({
    origin: 'http://127.0.0.1:5500',  // Replace with your frontend URL
    credentials: true                 // Allow cookies
}))

app.use("/api/v1/organization",organization)

app.use(errorHandler)

export {app};