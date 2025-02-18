import { mongoose, Schema } from "mongoose";

const unitOfMeasureSchema = new mongoose.Schema({
    uom: {
        type: String,
        required: true,//kg
        trim: true,
        lowercase: true
    },
    uomName: {
        type: String,
        required: true,//kilograms
        trim: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
    },
    is_global: {
        type: Boolean,
        required: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
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

// Middleware to update modifiedAt field before saving
unitOfMeasureSchema.pre('save', async function (next) {
    if (this.isModified()) {
        this.modifiedAt = Date.now();
    }
    next();
});

export const UnitOfMeasure = mongoose.model('UnitOfMeasure', unitOfMeasureSchema);