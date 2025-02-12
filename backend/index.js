import {app} from "./app.js"
import connectDB from "./DB/database.js"
import dotenv from "dotenv";

dotenv.config({
    path: './.env'
})

connectDB().then(()=>{
    app.listen(8080,()=>{
        console.log("App listening on port 8080")
    })
}).catch((err)=>{
    console.log("Error while connecting DB",err)
})