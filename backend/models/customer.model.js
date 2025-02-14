import { mongoose, Schema } from "mongoose";

const customerSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the Organization
        ref: 'Organization', // The name of the Organization model
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    modifiedAt: {
        type: Date,
        default: Date.now

    }
})

customerSchema.pre("save",async function(next){
    if(this.isModified()){
        this.modifiedAt = Date.now()
    }
    next();
})


export const Customer = mongoose.model("Customer", customerSchema);