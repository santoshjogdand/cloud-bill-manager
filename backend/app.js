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
    origin: '*',  // Allows requests from any origin
    credentials: true,  // If you need cookies, use 'Access-Control-Allow-Credentials'
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',  // Allow all HTTP methods
    allowedHeaders: 'Content-Type,Authorization', // Allow these headers
}));

app.use("/api/v1/organization",organization)

app.use(errorHandler)

export {app};