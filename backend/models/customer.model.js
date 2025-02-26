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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
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
});

customerSchema.index({ email: 1, organization: 1 }, { unique: true });

customerSchema.pre("save", async function(next) {
    if (this.isModified()) {
        this.modifiedAt = Date.now();
    }
    next();
});

export const Customer = mongoose.model("Customer", customerSchema);
