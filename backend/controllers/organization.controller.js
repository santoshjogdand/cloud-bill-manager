import { Organization } from "../models/organization.model.js"
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js";
import nodemailer from "nodemailer"

const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none" 
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
    
    if (!createdorganization) {
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

const logout = asyncHandler(async(req,res,next) =>{

    const incomingToken = req.cookies.accessToken
    const decodedToken = jwt.verify(
        incomingToken,
        process.env.ACCESS_TOKEN_SECRET
    )
    const org = await Organization.findById(decodedToken._id).select("-password")
    return res.status(200).clearCookie("accessToken").json(new ApiResponse(200,{loggedOutBy:org.name},"Oranization logged out!"))
})

//Forgot password

//transponder
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
// 📌 Step 1: Send OTP to Email
const sendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // 🔍 Check if organization exists
    const org = await Organization.findOne({ email });
    if (!org)throw new ApiError(404,"Organization not found!");

    // 🔢 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    org.otp = otp;
    org.otpExpires = Date.now() + 5 * 60 * 1000; // OTP expires in 5 mins
    await org.save();

    // ✉️ Send OTP via Email
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Cloud bill manager password Reset OTP",
        text: `Your OTP for password reset is: ${otp}`,
    });

    res.status(200).json({ message: "OTP sent to email!" });
});

// 📌 Step 2: Verify OTP
 const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    // 🔍 Check if organization exists
    const org = await Organization.findOne({ email });
    if (!org || org.otp !== otp || org.otpExpires < Date.now()) {
        throw new ApiError(404,"Invalid or expired OTP!")
    }

    // 🔑 Generate JWT Token (valid for 10 mins)
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "10m" });

    res.status(200).json({ message: "OTP verified!", token });
});

// 📌 Step 3: Reset Password
const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // 🔑 Verify JWT Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const org = await Organization.findOne({ email: decoded.email });

        if (!org) throw new ApiError(400, "Token is required or organization does not exists");

        // 🔒 Hash and Update Password
        org.password = newPassword
        org.otp = undefined; // Clear OTP
        org.otpExpires = undefined;
        await org.save();

        res.status(200).json({ message: "Password reset successful!" });
    } catch (error) {
        throw new ApiError(400,"Invalid or expired token!")
    }
});

export { register, login, logout,sendOTP,verifyOTP,resetPassword}