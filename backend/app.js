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
    origin: "http://localhost:5173",
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use("/api/v1/organization",organization)

app.use(errorHandler)

export {app};