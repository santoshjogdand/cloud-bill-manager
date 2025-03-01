import { mongoose, Schema } from "mongoose";

const lineItemsSchema = Schema({
    sr_no:{
        type: Number
    },
    product_name:{
       type: String
    },
    QTY: {
        type: String
    },
    nos:{
        type: Number
    },
    tax:{
        type: Number
    },
    unit_price:{
        type: Number
    },
    total_price :{
        type: Number
    }
})

const invoiceSchema = Schema({
    organization: {
        required: true,
        type: Schema.Types.ObjectId,
        ref: "Organization"
    },
    customer_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Customer"
    },
    customer_name:{
        type: String
    },
    invoice_number:{
        type: String,
        required: true,
        unique: true  
    },
    sub_total: {
        type: Number,
        required: true
    },
    tax_amount: {
        type: Number,
        required: true
    },
    total_amount: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        enum: ["Cash", "Credit Card", "UPI", "Bank Transfer"],
    },
    payment_status: {
        type: String,
        enum: ["Paid", "Pending", "Cancelled"]
    },
    line_items: [lineItemsSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
})

export const Invoice = mongoose.model("Invoice",invoiceSchema)