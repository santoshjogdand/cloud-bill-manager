import { Invoice } from "../models/invoice.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Customer } from "../models/customer.model.js";
import { Inventory } from "../models/inventory.model.js";

const checkItemExists = async (item,organization,) =>{
    const existedItem = await Inventory.findOne({
        productName : {
            $regex: item.product_name,
            $options: "i"
        },
        organization
    })
    if(existedItem){
        return true
    }
    return false
}
const validateItemsData = (item)=>{
    const NumbersOfQTY = item.nos
    const unitPrice = item.unit_price
    const totalPrice = item.total_price
    //check if unitPrice * NumbersOfQTY = totalPrice
    if(Number(unitPrice) * Number(NumbersOfQTY) == Number(totalPrice)){
        return true
    }
    return false
}
const validateTotal = (reqTotal, actualTotal)=>{
    if(Number(reqTotal) != Number(actualTotal)){
        return true
    }
    return false
}
const createInvoice = asyncHandler(async (req,res)=>{
    const organization = req.org._id;
    const {
        customer_id,
        customer_name,
        invoice_number,
        sub_total,
        tax_amount,
        total_amount,
        discount,
        payment_method,
        payment_status,
        line_items
    } = req.body;

    if (!Array.isArray(line_items)) {
        throw new ApiError(402,"line_items must be an array")
    }

    console.log(req.body)

    const customerExistes = await Customer.find({
        _id: customer_id,
        organization,
        name:{
            $regex: customer_name,
            $options: "i"
        }

    })
    console.log(customerExistes)
    if(!customerExistes){
        throw new ApiError(401,"Customer doesnot exists!");
    }
    const existedInvoice = await Invoice.findOne({
        organization,
        invoice_number
    });

    if(existedInvoice){
        throw new ApiError(403,"Invoice already exists with invoice number")
    }

    let isItemDataValid = true, sumOfItemPrices_subtotal = 0, sumOfItemTax = 0, finalTotal = 0;

    line_items.forEach(item => {
        
        isItemDataValid = validateItemsData(item)
        if(!isItemDataValid){
            throw new ApiError(403,"Item validation error - incorrect data values!")
        }else{
            sumOfItemPrices_subtotal += Number(item.total_price)
            
            sumOfItemTax += Number(item.total_price) * (Number(item.tax) / 100)
        }
    });
    console.log("SMITP: ",sumOfItemPrices_subtotal)
    console.log("sumOfItemTax: ",sumOfItemTax)

    finalTotal = Number((sumOfItemPrices_subtotal + sumOfItemTax) - (Number(discount) / 100))
    
    console.log("FinalTotal:",finalTotal)
    if(
        ((validateTotal(total_amount,finalTotal) && validateTotal(sub_total,sumOfItemPrices_subtotal) && validateTotal(tax_amount,sumOfItemTax)))
    ){

        throw new ApiError(403,"There is problem encountered in data sent by client, data checks for totals found incorrect data.")
    }

    
    for (const item of line_items) {
        const ItemExists = await checkItemExists(item, organization);
        if (!ItemExists) {
            throw new ApiError(402, "Item does not found in database, please try to add items in inventory");
        }
    }
    
    const createdInvoice = await Invoice.create({
        organization,
        customer_id,
        customer_name,
        invoice_number,
        sub_total,
        tax_amount,
        total_amount,
        discount,
        payment_method,
        payment_status,
        line_items
    })

    const InvoiceData = {
        invoice : await Invoice.findById(createdInvoice?._id)
    }

    res.status(200).json(new ApiResponse(201,InvoiceData,"Invoice created!"))

})

export {createInvoice}