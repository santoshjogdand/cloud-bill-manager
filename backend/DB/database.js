import mongoose from "mongoose";

const connectDB= async()=>{
    try{
        const connectionInstance  = await mongoose.connect(`${process.env.MONGO_URI}`)
        console.log("DB Connection Successful",connectionInstance.connection.host)

    }catch(err){
        console.log("ERR in db connection: ",err) 
    }
}

export default connectDB;