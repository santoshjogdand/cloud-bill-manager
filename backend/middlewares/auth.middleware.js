import { asyncHandler } from "../utils/AsyncHandler.js"
import jwt from "jsonwebtoken"
import { Organization } from "../models/organization.model.js"
import ApiError from "../utils/ApiError.js"


const verifyJwt = asyncHandler(async (req,res,next) =>{
    console.log("JWT verification")
    const incomingToken  = req.cookies.accessToken;
    console.log(incomingToken)
    const decondedToken = jwt.verify(
        incomingToken,
        process.env.ACCESS_TOKEN_SECRET
    );
    const org = await Organization.findById(decondedToken?._id).select("-password")
    if(!org){
        throw new ApiError(401,"Unauthorized access!")
    }

    req.org = org
    console.log(org)
    next()
})

export default verifyJwt