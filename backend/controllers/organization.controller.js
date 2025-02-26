import { Organization } from "../models/organization.model.js"
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js";

const options = {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000) 
}


const register = asyncHandler(async (req, res, next) => {
    const { 
        name, 
        email, 
        phone, 
        ownername, 
        address, 
        GSTIN, 
        paymentOptions, 
        website, 
        category, 
        description, 
        terms_conditions, 
        password
    } = req.body;

    if (
        [name, email, phone, ownername, address, category, password].some((field) => typeof field === 'string' && field.trim() === "")
    ) {

        throw new ApiError(400,"All fields are required")
    }
    const existedOrganization = await Organization.findOne({
        $or: [{ email }, { phone }, {GSTIN}]
    })
    
    if (existedOrganization) {
        throw new ApiError(409,"The organization already exists with the provided email, phone number, and GSTIN.")
    }

    const organization = await Organization.create({
        name: name.toLowerCase(),
        email: email.toLowerCase(),
        phone,
        ownername,
        address,
        GSTIN,
        paymentOptions,
        website,
        category,
        description,
        terms_conditions,
        password
    })


    const createOrg = await Organization.findById(organization._id).select("-password -refreshToken ")
    if (createOrg) {
        return res.status(201).json(new ApiResponse(201,createOrg,"Organization created"))
    }
    
    if (!createOrg) {
        throw new ApiError(500, "Something went wrong while registering the organization")
    }

    throw new ApiError(500,"Something went wrong!!")
})

const login = asyncHandler(async (req,res,next)=>{
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const formattedIP = ip === "::1" ? "127.0.0.1" : ip;
    console.log("IP Address:", formattedIP);

    const {email, phone, password } = req.body;
    if(!email && !phone){
        throw new ApiError(400, "Email or phone number is required!")
    }

    const organization = await Organization.findOne({
        $or: [{email},{phone}]
    })
    if(!organization){
        throw new ApiError(404,"Email or phone number is not associated with organization!")
    }
    const isPasswordCorrect = await organization.isPasswordCorrect(password)
    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid credentials!")
    }
    const loggedInOrg = await Organization.findById(organization._id).select("-password -refreshToken")
    const accessToken = await loggedInOrg.generateAccessToken()
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .json(new ApiResponse(200,loggedInOrg,"Organization logged in successfully!!"))
    
})
const fetchOrganiztionInfo = asyncHandler(async (req,res,next)=>{
    const orgId = req.org._id;
    const organization = await Organization.findOne({
        _id: orgId
    })
    const loggedInOrg = await Organization.findById(organization._id).select("-password -refreshToken")
    return res.status(200).json(new ApiResponse(200,loggedInOrg,"Organization information!"))
    
})

const logout = asyncHandler(async(req,res,next) =>{

    const incomingToken = req.cookies.accessToken
    const decodedToken = jwt.verify(
        incomingToken,
        process.env.ACCESS_TOKEN_SECRET
    )
    const org = await Organization.findById(decodedToken._id).select("-password")
    return res.status(200).clearCookie("accessToken").json(new ApiResponse(200,{loggedOutBy:org.name},"Oranization logged out!"))
})

const checkAuth = asyncHandler(async(req,res)=>{
    res.status(200).json({ message: "Authenticated" });
});

export { register, login, logout, checkAuth,fetchOrganiztionInfo}