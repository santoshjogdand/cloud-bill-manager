import { Inventory } from "../models/inventory.model.js";
import { UnitOfMeasure } from "../models/unitofmeasure.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const addProduct = asyncHandler(async (req, res) => {
    const organization = req.org._id
    const {
        productName,
        category,
        stock_quantity,
        unitOfMeasure,
        alternate_unit,
        sales_price,
        cost_price,
        conversion_rate,
        tax_rate,
        tax_type,
        supplier,
        batch_number,
        manufacturer,
        reorder_quantity,
        description,
        discount
    } = req.body;

    const existingProduct = await Inventory.findOne({
        productName,
        organization
    })
    console.log(existingProduct)
    if (existingProduct) {
        throw new ApiError(409, "Product already exists with this name")
    }

    if (
        !productName?.trim() ||
        !category?.trim() ||
        !unitOfMeasure?.trim() ||
        sales_price == null || sales_price <= 0 ||
        cost_price == null || cost_price <= 0 ||
        stock_quantity == null || stock_quantity < 0 ||
        tax_rate == null || tax_rate < 0 ||
        !tax_type?.trim()
    ) {
        throw new ApiError(202, "All fields are required! Ensure productName, category, unitOfMeasure, and tax_type are non-empty. Prices must be greater than 0, stock_quantity must be ≥ 0, and tax_rate must be ≥ 0.");
    }
    if (alternate_unit?.trim() &&
        !(conversion_rate >= 0)) {
        throw new ApiError(202, "Conversion rate is required for alternate unit!")
    }
    if (alternate_unit?.trim()) {
        var alternate_unit_cost = Number(cost_price) / Number(conversion_rate)
        var alternate_unit_sales_price = Number(sales_price) / Number(conversion_rate)
    }
    if (discount > 0) {
        var discounted_price = Number(sales_price) - Number((discount / 100) * sales_price)
        var selling_price = Number(discounted_price) + Number((tax_rate / 100) * discounted_price)
    } else {
        var selling_price = Number(sales_price)
    }

    const total_stock_value = Number(stock_quantity) * Number(cost_price)
    const Product = await Inventory.create({
        organization,
        productName,
        category,
        stock_quantity,
        unitOfMeasure,
        alternate_unit,
        sales_price,
        cost_price,
        conversion_rate,
        tax_rate,
        tax_type,
        supplier,
        batch_number,
        manufacturer,
        reorder_quantity,
        description,
        discount,
        discounted_price,
        alternate_unit_cost,
        alternate_unit_sales_price,
        selling_price,
        total_stock_value
    });

    const createdProduct = await Inventory.findById(Product?._id).select("productName")
    if (createdProduct) {
        return res.status(200).json(new ApiResponse(201, createdProduct, "new product created"))
    }

    throw new ApiError(501, "Problem encountered while creating a product")


});

const getProducts = asyncHandler(async (req, res) => {
    const organization = req.org._id
    const Products = await Inventory.find({
        organization
    })
    return res.status(200).json(new ApiResponse(201, Products, "All products"))

});

const findProduct = asyncHandler(async (req, res) => {
    const organization = req.org._id;
    const productToFind = req.body.productName;
    console.log(productToFind)
    const fetchedProducts = await Inventory.find({
        organization,
        productName: {
            $regex: productToFind,
            $options: "i"
        }
    });
    const products = {
        Products: fetchedProducts
    }
    return res.status(200).json(new ApiResponse(201, products, "Products fetched!"));
});

const addUOM = asyncHandler(async (req, res) => {
    const {
        uom,
        uomName,
        description
    } = req.body
    const organization = req.org._id
    const is_global = true

    const existedUOM = await UnitOfMeasure.findOne({
        organization,
        uom
    })

    if (existedUOM) {
        throw new ApiError(409, "Unit of measure already exists");
    }

    const UOM = await UnitOfMeasure.create({
        uom,
        uomName,
        description,
        is_global,
        organization
    })
    const createdUOM = await UnitOfMeasure.findById(UOM._id).select("-uomName -description -is_global -organization");
    if (createdUOM) {
        return res.status(200).json(new ApiResponse(200, createdUOM, "Unit of measure created successfully"))
    }
    throw new ApiError(501, "Problem encountered while creating a UOM")
});

const getUOMS = asyncHandler(async (req, res) => {
    const orgID = req.org._id;
    if (!orgID) {
        throw new ApiError(501, "Unauthorized access")
    }
    console.log("++++++++", orgID)
    const UOMS = await UnitOfMeasure.find({ organization: orgID }).select("uom -_id");
    console.log("++++++++", UOMS)
    if (UOMS) {
        return res.status(200).json(new ApiResponse(201, UOMS, "Unit of measures from inventory"))
    } else {
        throw new ApiError(501, "UOM not found!")
    }
});

const updateProduct = asyncHandler(async (req, res) => {
    const organization = req.org._id;
    const {
        _id,
        productName,
        category,
        stock_quantity,
        unitOfMeasure,
        alternate_unit,
        sales_price,
        cost_price,
        conversion_rate,
        tax_rate,
        tax_type,
        supplier,
        batch_number,
        manufacturer,
        reorder_quantity,
        description,
        discount,
        discounted_price,
        alternate_unit_cost,
        alternate_unit_sales_price,
        selling_price,
        total_stock_value
    } = req.body;

    if (!_id) {
        throw new ApiError(400, "Product _id is required");
    }

    const updatedProduct = await Inventory.findOneAndUpdate(
        { _id, organization },
        {
            productName,
            category,
            stock_quantity,
            unitOfMeasure,
            alternate_unit,
            sales_price,
            cost_price,
            conversion_rate,
            tax_rate,
            tax_type,
            supplier,
            batch_number,
            manufacturer,
            reorder_quantity,
            description,
            discount,
            discounted_price,
            alternate_unit_cost,
            alternate_unit_sales_price,
            selling_price,
            total_stock_value
        },
        { new: true, runValidators: true }
    );

    if (!updatedProduct) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(new ApiResponse(200, updatedProduct, "Product record updated successfully"));
});

const removeProduct = asyncHandler(async (req, res) => {
    const organization = req.org._id;
    const { product_id } = req.params; // Change to params for cleaner request

    if (!product_id) {
        throw new ApiError(400, "Product ID is required");
    }

    const removedProduct = await Inventory.findOneAndDelete({ _id: product_id, organization });

    if (!removedProduct) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(new ApiResponse(200, removedProduct, "Product record removed successfully"));
});


export { addUOM, addProduct, getUOMS, getProducts, findProduct,updateProduct,removeProduct }