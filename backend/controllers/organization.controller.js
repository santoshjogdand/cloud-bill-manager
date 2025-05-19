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

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Email template for registration OTP
const getRegistrationOtpEmailTemplate = (otp, orgName) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification OTP</title>
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
            <p>Thank you for registering ${orgName}. Please verify your email with the OTP below:</p>
            <div class="otp-code">${otp}</div>
            <p>This OTP is valid for 10 minutes. Do not share it with anyone.</p>
            <div class="footer">If you didn't register for CloudBill Manager, please ignore this email.</div>
        </div>
    </body>
    </html>
    `;
};

// Step 1: Initiate Registration
const initiateRegistration = asyncHandler(async (req, res) => {
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

    // Validate required fields
    if (
        [name, email, phone, ownername, address, category, password].some((field) => typeof field === 'string' && field.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // Check if organization already exists
    const existedOrganization = await Organization.findOne({
        $or: [{ email }, { phone }, { GSTIN }]
    })

    if (existedOrganization) {
        if(existedOrganization.isVerified == true){
            throw new ApiError(409, "The organization already exists with the provided email, phone number, or GSTIN.")
        }else{
            const deletedorg = await Organization.deleteOne(existedOrganization)
            console.log(deletedorg)
        }
    }


    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    
    // Store registration data and OTP in a temporary document
    const pendingRegistration = await Organization.create({
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
        password,
        otp,
        otpExpires: Date.now() + 10 * 60 * 1000, // OTP expires in 10 mins
        isVerified: false // Account is not verified yet
    });

    // Send OTP via Email
    await transporter.sendMail({
        from: `"CloudBill Manager" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "CloudBill Manager - Email Verification",
        html: getRegistrationOtpEmailTemplate(otp, name),
    });

    // Create token for registration flow
    const registrationToken = jwt.sign(
        { organizationId: pendingRegistration._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "5m" }
    );

    // Set registration token in cookie
    const registrationCookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 5 * 60 * 1000 // 10 minutes
    };

    return res.status(200)
        .cookie("registrationToken", registrationToken, registrationCookieOptions)
        .json(new ApiResponse(200, { email }, "Registration initiated. Please verify your email with the OTP sent."));
});

// Step 2: Verify OTP and Complete Registration
const verifyRegistrationOTP = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const registrationToken = req.cookies.registrationToken;

    if (!registrationToken) {
        throw new ApiError(400, "Registration session expired. Please start again.");
    }

    // Verify JWT Token
    let decodedToken;
    try {
        decodedToken = jwt.verify(registrationToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Registration session expired. Please start again.");
    }

    // Find the pending registration
    const organization = await Organization.findById(decodedToken.organizationId);
    
    if (!organization) {
        throw new ApiError(404, "Registration data not found. Please start again.");
    }

    // Verify OTP
    if (organization.otp !== otp || organization.otpExpires < Date.now()) {
        throw new ApiError(400, "Invalid or expired OTP. Please try again.");
    }

    // Mark organization as verified and clear OTP data
    organization.isVerified = true;
    organization.otp = undefined;
    organization.otpExpires = undefined;
    await organization.save();

    // Generate access token for immediate login
    const accessToken = await organization.generateAccessToken();
    
    // Find the verified organization for response
    const verifiedOrg = await Organization.findById(organization._id).select("-password -refreshToken -otp -otpExpires");

    return res.status(201)
        .clearCookie("registrationToken")
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(201, verifiedOrg, "Organization registered and verified successfully!"));
});

// Resend OTP if needed
const resendRegistrationOTP = asyncHandler(async (req, res) => {
    const registrationToken = req.cookies.registrationToken;

    if (!registrationToken) {
        throw new ApiError(400, "Registration session expired. Please start again.");
    }

    // Verify JWT Token
    let decodedToken;
    try {
        decodedToken = jwt.verify(registrationToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Registration session expired. Please start again.");
    }

    // Find the pending registration
    const organization = await Organization.findById(decodedToken.organizationId);
    
    if (!organization) {
        throw new ApiError(404, "Registration data not found. Please start again.");
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    organization.otp = otp;
    organization.otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 mins
    await organization.save();

    // Send OTP via Email
    await transporter.sendMail({
        from: `"CloudBill Manager" <${process.env.EMAIL_USER}>`,
        to: organization.email,
        subject: "CloudBill Manager - Email Verification (Resend)",
        html: getRegistrationOtpEmailTemplate(otp, organization.name),
    });

    // Create new registration token
    const newRegistrationToken = jwt.sign(
        { organizationId: organization._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "10m" }
    );

    // Set registration token in cookie
    const registrationCookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 10 * 60 * 1000 // 10 minutes
    };

    return res.status(200)
        .clearCookie("registrationToken")
        .cookie("registrationToken", newRegistrationToken, registrationCookieOptions)
        .json(new ApiResponse(200, { email: organization.email }, "New OTP sent. Please verify your email."));
});

// Keep your existing login, logout, password reset functions
const login = asyncHandler(async (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const formattedIP = ip === "::1" ? "127.0.0.1" : ip;
    console.log("IP Address:", formattedIP);

    const { email, password } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required!")
    }

    const organization = await Organization.findOne({
        email
    })
    if (!organization) {
        throw new ApiError(404, "Email is not associated with organization!")
    }
    
    // Check if organization is verified
    if (!organization.isVerified) {
        throw new ApiError(403, "Account not verified. Please verify your email first.")
    }
    
    const isPasswordCorrect = await organization.isPasswordCorrect(password)
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials!")
    }
    const loggedInOrg = await Organization.findById(organization._id).select("-createdAt -password -updatedAt -__v ")
    const accessToken = await loggedInOrg.generateAccessToken()
    return res.status(200).clearCookie("accessToken",options)
        .clearCookie("authenticated",options)
        .cookie("authenticated",true, options)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200, loggedInOrg, "Organization logged in successfully!!"));
});

const logout = asyncHandler(async (req, res, next) => {
    const incomingToken = req.cookies.accessToken
    const decodedToken = jwt.verify(
        incomingToken,
        process.env.ACCESS_TOKEN_SECRET
    )
    const org = await Organization.findById(decodedToken._id).select("-password")
    return res.status(200).clearCookie("authenticated").clearCookie("accessToken").json(new ApiResponse(200, { loggedOutBy: org.name }, "Organization logged out!"))
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

// Send OTP for password reset
const sendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Check if organization exists
    const org = await Organization.findOne({ email });
    if (!org) throw new ApiError(404, "Organization not found!");

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    org.otp = otp;
    org.otpExpires = Date.now() + 5 * 60 * 1000; // OTP expires in 5 mins
    await org.save();
    console.log("OTP: SEND::", otp)
    // Send OTP via Email    
    await transporter.sendMail({
        from: `"CloudBill Manager" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Cloud bill manager password Reset OTP",
        html: getOtpEmailTemplate(otp),
    });

    res.status(200).json({ message: "OTP sent to email!" });
});

// Verify OTP for password reset
const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    // Check if organization exists
    const org = await Organization.findOne({ email });
    if (!org || org.otp !== otp || org.otpExpires < Date.now()) {
        throw new ApiError(404, "Invalid or expired OTP!")
    }

    // Generate JWT Token (valid for 5 mins)
    const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5m" });

    const otpOptions = {
        httpOnly: true,    // Prevent JavaScript access
        secure: true,      // http can also work
        sameSite: "none",  // allows any site
        maxAge: 5 * 60 * 1000 // 5 minutes
    }

    res.status(200).cookie("otpAuthToken", token, otpOptions).json({ "message": "Otp verified successfully" })
});

const getPasswordChangeTemplate = (name, ip) => {
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
            <p>If you didn't reset your password, please contact our support team immediately.</p>
            <div class="footer">Thank you for using CloudBill Manager.</div>
        </div>
    </body>
    </html>
`;
}

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const { newPassword } = req.body;
    console.log(req.cookies)
    const token = req.cookies.otpAuthToken
    console.log(token)
    // Verify JWT Token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const org = await Organization.findOne({ email: decoded.email });

    if (!org) throw new ApiError(400, "Token is required or organization does not exists");

    // Hash and Update Password
    org.password = newPassword
    org.otp = undefined; // Clear OTP
    org.otpExpires = undefined;
    await org.save();
    await transporter.sendMail({
        from: `"CloudBill Manager" <${process.env.EMAIL_USER}>`,
        to: org.email,
        subject: "Cloud bill manager password change successful",
        html: getPasswordChangeTemplate(org.name, ip),
    });
    return res.status(200).clearCookie("otpAuthToken").json({ message: "Password reset successful!" });
});

export { 
    initiateRegistration, 
    verifyRegistrationOTP, 
    resendRegistrationOTP, 
    login, 
    logout, 
    sendOTP, 
    verifyOTP, 
    resetPassword 
}