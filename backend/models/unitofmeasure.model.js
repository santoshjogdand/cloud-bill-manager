const mongoose = require('mongoose');

const unitOfMeasureSchema = new mongoose.Schema({
    uomCode: {
        type: String,
        required: true,
        trim: true
    },
    uomName: {
        type: String,
        required: true,
        trim: true
    },
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
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
unitOfMeasureSchema.pre('save', function (next) {
    if (this.isModified()) {
        this.modifiedAt = Date.now();
    }
    next();
});

export const UnitOfMeasure = mongoose.model('UnitOfMeasure', unitOfMeasureSchema);
