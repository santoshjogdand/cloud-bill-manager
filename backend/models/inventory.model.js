import {mongoose, Schema} from "mongoose";

const inventorySchema = Schema({
    organization_id: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization"
    },
    productName:{
        required: true,
        type: String,
        index: true,
        trim: true
    },
    category:{
        required: true,
        type: String,
        trim: true
    },
    quantity:{
        required: true,
        type: Number,
    },
    unitOfMeasure:{
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: "UnitOfMeasure"
    },
    price_per_unit:{
        required : true,
        type: Number,
    },
    cost_price_per_unit:{
        required : true,
        type: Number
    },
    tax_rate:{
        type: Number
    },
    tax_type:{
        type: String,
        trim: true
    },
    supplier:{
        type: String,
        trim: true
    },
    batch_number:{
        type: String,
        trim: true
    },
    manufacturer:{
        type: String,
        trim: true
    },
    reorder_quantity:{  
        type: Number
    },
    isActive:{
        type: Boolean,
        enum: [true, false]
    },
    description:{
        type: String,
        trim: true
    },
    discount :{
        type: Number
    },
    total_value:{
        type: Number
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    modifiedAt:{
        type: Date,
        default: Date.now
    } 

})

inventorySchema.pre("save",(next)=>{
    if(this.isModified()){
        this.total_value = this.cost_price_per_unit * this.quantity
        this.modifiedAt = Date.now
    }
})




export const Inventory = mongoose.model("Inventory", inventorySchema);