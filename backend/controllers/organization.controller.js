import { Organization } from "../models/organization.model.js"
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js";
import nodemailer from "nodemailer"
import dotenv from "dotenv";
dotenv.config();

const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
};

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

    const {email, password } = req.body;
    if(!email && !phone){
        throw new ApiError(400, "Email or phone number is required!")
    }

    const organization = await Organization.findOne({
        email
    })
    if(!organization){
        throw new ApiError(404,"Email or phone number is not associated with organization!")
    }
    const isPasswordCorrect = await organization.isPasswordCorrect(password)
    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid credentials!")
    }
    const loggedInOrg = await Organization.findById(organization._id).select("-createdAt -password -updatedAt -__v ")
    const accessToken = await loggedInOrg.generateAccessToken()
    return res.status(200).clearCookie("accessToken").clearCookie("authenticated")
    .cookie("accessToken", accessToken, options)
    .cookie("authenticated", true, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
    })
    .json(new ApiResponse(200, loggedInOrg, "Organization logged in successfully!!"));

    
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

const getOtpEmailTemplate = (otp) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                padding: 20px;
                text-align: center;
            }
            .email-container {
                max-width: 500px;
                margin: auto;
                background: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0px 0px 10px rgba(0,0,0,0.1);
            }
            .otp-code {
                font-size: 22px;
                font-weight: bold;
                color: #333;
                background: #f1f1f1;
                padding: 10px;
                display: inline-block;
                border-radius: 5px;
                margin: 15px 0;
            }
            .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <h2>CloudBill Manager</h2>
            <p>You requested a password reset. Use the OTP below to reset your password:</p>
            <div class="otp-code">${otp}</div>
            <p>This OTP is valid for 5 minutes. Do not share it with anyone.</p>
            <div class="footer">If you didn't request this, you can ignore this email.</div>
        </div>
    </body>
    </html>
    `;
};

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
    console.log("OTP: SEND::", otp)
    // ✉️ Send OTP via Email    
    await transporter.sendMail({
        from: `"CloudBill Manager" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Cloud bill manager password Reset OTP",
        html: getOtpEmailTemplate(otp),
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

    // 🔑 Generate JWT Token (valid for 5 mins)
    const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5m" });

    const otpOptions = {
        httpOnly: true,    // Prevent JavaScript access
        secure: true,      // http can also work
        sameSite: "none",// allows any site
        maxAge: 5 * 60 * 1000 // 5 minutes
    }

    res.status(200).cookie("otpAuthToken",token,otpOptions).json({"message":"Otp verified successfully"})
});

const getPasswordChangeTemplate = (name,ip) =>{
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                padding: 20px;
                text-align: center;
            }
            .email-container {
                max-width: 500px;
                margin: auto;
                background: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0px 0px 10px rgba(0,0,0,0.1);
            }
            .success-message {
                font-size: 18px;
                font-weight: bold;
                color: #2ecc71;
                margin: 15px 0;
            }
            .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <h2>CloudBill Manager</h2>
            <h3>Hey ${name}</h3>
            <p class="success-message">Your password has been successfully reset!</p>
            <p>By device on IP: ${ip}.</p>
            <p>If you didn’t reset your password, please contact our support team immediately.</p>
            <div class="footer">Thank you for using CloudBill Manager.</div>
        </div>
    </body>
    </html>
`;

}

// 📌 Step 3: Reset Password
const resetPassword = asyncHandler(async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const { newPassword } = req.body;
    console.log(req.cookies)
    const token  = req.cookies.otpAuthToken
    console.log(token)
        // 🔑 Verify JWT Token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const org = await Organization.findOne({ email: decoded.email });

        if (!org) throw new ApiError(400, "Token is required or organization does not exists");

        // 🔒 Hash and Update Password
        org.password = newPassword
        org.otp = undefined; // Clear OTP
        org.otpExpires = undefined;
        await org.save();
        await transporter.sendMail({
            from: `"CloudBill Manager" <${process.env.EMAIL_USER}>`,
            to: org.email,
            subject: "Cloud bill manager password change successfull",
            html: getPasswordChangeTemplate(org.name,ip ),
        }); 
        return res.status(200).clearCookie("otpAuthToken").json({ message: "Password reset successful!" });
});

export { register, login, logout,sendOTP,verifyOTP,resetPassword}