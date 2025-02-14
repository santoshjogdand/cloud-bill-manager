import { mongoose, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const indiaStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep",
    "Delhi",
    "Puducherry",
    "Ladakh",
    "Lakshadweep"
  ];
  

const organizationSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true
        },
        phone: {
            type: [Number],
            required: true,
        },
        invoicePrefix: {
            type: String,
            required: true,
            default:  function () {
                return this.name ? this.name.slice(0, 2) : '';
            },
            trim: true,
            maxlength: 2,
            minlength: 1,
        },
        ownername: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: {
                street: {
                    type: String,
                    required: true,
                    trim: true
                },
                city: {
                    type: String,
                    required: true
                },
                state: {
                    type: String,
                    required: true,
                    enum: indiaStates
                },
                country: {
                    default: "India",
                    type: String,
                    required: true
                },
                zipcode: {
                    type: String,
                    required: true
                }

            },
            createdAt: Date.now
        },
        GSTIN: {
            type: String,
            trim: true,
            maxlength: 15,
            minlength: 5,
            validate: {
                validator: function(v) {
                  return v.length === 15;
                },
                message: 'GSTIN must be exactly 15 digits long.'
              } 
        },
        website: {
            type: String,
            trim: true
        },
        category: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        currency: {
            default: "Rupees",
            type: String,
            trim: true
        },
        terms_conditions: {
            type: [String],
            trim: true
        }
        ,
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        refreshToken:{
            type: String
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }
)

organizationSchema.pre("save",async function(next){
    if (this.isModified("password")) {
        // Hash the password if it is modified
        this.password = await bcrypt.hash(this.password, 10);
    }

    if (this.isModified()) {
        // Update the updatedAt field when any field is modified
        this.updatedAt = Date.now();
    }
    next()
})

organizationSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

organizationSchema.methods.generateAccessToken = async function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            ownername: this.ownername
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

organizationSchema.methods.generateRefreshToken = async function() {
    return jwt.sign({
        _id: this._id,
        email: this.email
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });
}

export const Organization = mongoose.model("Organization", organizationSchema)