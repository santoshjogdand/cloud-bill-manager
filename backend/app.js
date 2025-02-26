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

const allowedOrigins = [
    "http://127.0.0.1:5500", 
    "http://localhost:5173", // Add other frontend URLs if needed
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

app.use("/api/v1/organization",organization)

app.use(errorHandler)

export {app};
