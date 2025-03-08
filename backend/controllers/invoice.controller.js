import { Invoice } from "../models/invoice.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Customer } from "../models/customer.model.js";
import { Inventory } from "../models/inventory.model.js";

const checkItemExists = async (item, organization) => {
    const existedItem = await Inventory.findOne({
        productName: {
            $regex: item.product_name,
            $options: "i"
        },
        organization
    });
    
    if (existedItem) {
        return true;
    }
    return false;
};

const validateItemsData = (item) => {
    const unitPrice = parseFloat(item.unit_price) || 0;
    const qty = parseInt(item.qty) || 0;
    const totalPrice = parseFloat(item.total_price) || 0;
    
    // Allow for small floating point differences
    const calculatedTotal = unitPrice * qty;
    const difference = Math.abs(calculatedTotal - totalPrice);
    
    // If difference is less than 0.01, consider it valid
    return difference < 0.01;
};

const validateTotal = (reqTotal, actualTotal) => {
    // Allow for small floating point differences
    const difference = Math.abs(parseFloat(reqTotal) - parseFloat(actualTotal));
    
    // If difference is less than 0.01, consider it valid
    return difference >= 0.01;
};

const createInvoice = asyncHandler(async (req, res) => {
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

    if (!line_items || !Array.isArray(line_items)) {
        throw new ApiError(402, "line_items must be an array");
    }

    if (line_items.length === 0) {
        throw new ApiError(402, "At least one line item is required");
    }

    const customerExists = await Customer.findOne({
        _id: customer_id,
        organization
    });
    
    if (!customerExists) {
        throw new ApiError(401, "Customer does not exist!");
    }
    
    const existedInvoice = await Invoice.findOne({
        organization,
        invoice_number
    });

    if (existedInvoice) {
        throw new ApiError(403, "Invoice already exists with this invoice number");
    }

    let isItemDataValid = true;
    let sumOfItemPrices_subtotal = 0;
    let sumOfItemTax = 0;
    let finalTotal = 0;

    for (const item of line_items) {
        isItemDataValid = validateItemsData(item);
        
        if (!isItemDataValid) {
            throw new ApiError(403, `Item validation error - incorrect data values for ${item.product_name || 'unknown item'}`);
        }
        
        sumOfItemPrices_subtotal += parseFloat(item.unit_price) * parseFloat(item.qty);
        sumOfItemTax += (parseFloat(item.unit_price) * parseFloat(item.qty)) * (parseFloat(item.tax) / 100);
    }

    finalTotal = Number((sumOfItemPrices_subtotal + sumOfItemTax) - discount/100*(sumOfItemPrices_subtotal + sumOfItemTax));
    
    // Round to 2 decimal places for comparison
    sumOfItemPrices_subtotal = Math.round(sumOfItemPrices_subtotal * 100) / 100;
    sumOfItemTax = Math.round(sumOfItemTax * 100) / 100;
    finalTotal = Math.round(finalTotal * 100) / 100;
    
    const reqSubTotal = Math.round(parseFloat(sub_total) * 100) / 100;
    const reqTaxAmount = Math.round(parseFloat(tax_amount) * 100) / 100;
    const reqTotalAmount = Math.round(parseFloat(total_amount) * 100) / 100;

    const subTotalValid = validateTotal(reqSubTotal, sumOfItemPrices_subtotal);
    const taxAmountValid = validateTotal(reqTaxAmount, sumOfItemTax);
    const totalAmountValid = validateTotal(reqTotalAmount, finalTotal);

    if (subTotalValid || taxAmountValid || totalAmountValid) {
        throw new ApiError(403, "Totals don't match calculated values. Please check your calculations.");
    }

    for (const item of line_items) {
        const ItemExists = await checkItemExists(item, organization);
        if (!ItemExists) {
            throw new ApiError(402, `Item ${item.product_name || 'unknown item'} not found in database`);
        }
    }
    
    const createdInvoice = await Invoice.create({
        organization,
        customer_id,
        customer_name,
        invoice_number,
        sub_total: sumOfItemPrices_subtotal,
        tax_amount: sumOfItemTax,
        total_amount: finalTotal,
        discount,
        payment_method,
        payment_status,
        line_items
    });

    const InvoiceData = {
        invoice: await Invoice.findById(createdInvoice?._id)
    };

    res.status(200).json(new ApiResponse(201, InvoiceData, "Invoice created!"));
});

const removeInvoice = asyncHandler(async (req, res) => {
    const organization = req.org._id;
    const { invoice_number } = req.params;
    console.log(invoice_number)
    // Check if invoice exists
    const invoice = await Invoice.findOne({ invoice_number: invoice_number, organization });
    if (!invoice) {
        throw new ApiError(404, "Invoice not found!");
    }

    // Remove invoice
    await Invoice.deleteOne({ invoice_number: invoice_number, organization });

    res.status(200).json(new ApiResponse(200, {}, "Invoice removed successfully!"));
});

// Get all invoices for the organization
const getAllInvoice = asyncHandler(async (req, res) => {
    const organization = req.org._id;

    const invoices = await Invoice.find({ organization });
    
    if (!invoices.length) {
        throw new ApiError(404, "No invoices found!");
    }

    res.status(200).json(new ApiResponse(200, invoices, "Invoices retrieved successfully"));
});

// Get a specific invoice by invoice number
const getInvoice = asyncHandler(async (req, res) => {
    const organization = req.org._id;
    const { invoice_number } = req.body;

    const invoice = await Invoice.find({ organization, invoice_number });

    if (!invoice || invoice.length === 0) {
        throw new ApiError(404, "Invoice not found!");
    }

    res.status(200).json(new ApiResponse(200, invoice, "Invoice retrieved successfully"));
});

export { createInvoice, removeInvoice, getAllInvoice, getInvoice };