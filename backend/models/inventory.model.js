import { mongoose, Schema} from "mongoose";

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
    stock_quantity:{
        required: true,
        type: Number,
    },
    unitOfMeasure:{
        type: String,
        trim: true,
        required: true
    },                      //kg
    alternate_unit:{
        type: String,
        trim: true          //gm
    },
    sales_price:{
        required : true,
        type: Number, 
    },                     // sales_price = any
    alternate_unit_sales_price:{
        type: Number            // ausp = sales_price / conversion_rate
    },
    cost_price:{
        required : true,
        type: Number       //Rs.200
    },
    alternate_unit_cost:{
        type: Number        //200/1000 = 0.2 (cost_price / conversion_rate)
    },
    conversion_rate:{          // 1(unitOfMeasure) = [conversion_rate](alternate_unit)
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
    description:{
        type: String,
        trim: true
    },
    discount :{
        type: Number  // eg: 10%
    },
    total_value:{
        type: Number  // = stock_quantity x cost_price 
    },
    discounted_price:{
        type: Number  // = sales_price - discount%
    },
    selling_price:{
        type: Number,
        required: true // = discounted_price + tax_rate
    },
    createdAt:{
        type: Date,
    },
    modifiedAt:{
        type: Date,
    } 

})

inventorySchema.pre("save",async function(next){
    if(this.isModified()){
        this.total_value = this.cost_price_per_unit * this.quantity
        this.selling_price = this.price_per_unit - (this.price_per_unit * this.discount/100) 
        this.modifiedAt = Date.now()
    }
    next()
})




export const Inventory = mongoose.model("Inventory", inventorySchema);