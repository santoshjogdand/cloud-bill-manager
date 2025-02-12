import { Customer } from "../models/customer.model.js"
import { Organization } from "../models/organization.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/AsyncHandler.js"

const createCustomer = asyncHandler(async(req,res)=>{
    console.log(req.body)
    const {
        name,
        email,
        phone,
        address
    } = req.body
    if(!name || !email || !phone || !address){
        throw new ApiError(202, "all fields are required!");
    }
    const organization = req.org._id

    const existedCustomer = await Customer.findOne({
        organization: req.org._id,
        $or: [{ email },{ phone }]
    })
    if(existedCustomer){
        throw new ApiError(409,"Customer already exists with this email or phone number under your organization!")
    }
    const customer  = await Customer.create({
        name,
        email,
        phone,
        address,
        organization
    })
    const cretedCustomer = await Customer.findById(customer._id).select("-email -phone -address")
    if(createCustomer){
        return res.status(200).json(new ApiResponse(200,cretedCustomer,"Customer created successfully"))
    }
    throw new ApiError(501,"Problem encountered while creating a customer")
    throw new ApiError(500,"Something went wrong!!")    

})

const getCustomers =asyncHandler(async(req,res)=>{
    console.log(req.body)
    const orgId = req.org._id

    if(!req.body.customerName){

        console.log(orgId)
        const customers = await Customer.find({
                organization: orgId,
        },"name address email")

        return res.status(200).json(new ApiResponse(201, customers, "All customers!"))
    }
    
    const customerName = req.body.customerName
    console.log(customerName)
    const customers = await Customer.find({
        organization: orgId,
        name: {
            $regex: customerName,
            $options: 'i'
        }
    },"name")
    return res.status(200).json(new ApiResponse(201, customers, "Customers fetched!"))

})

export {createCustomer,getCustomers}