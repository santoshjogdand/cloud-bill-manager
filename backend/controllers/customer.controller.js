import { Customer } from "../models/customer.model.js";
import { Organization } from "../models/organization.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;

  if (!name || !name.trim() || 
      !email || !email.trim() || 
      !phone || !phone.toString().trim() || 
      !address || !address.trim()) {
    throw new ApiError(400, "All fields are required!");
  }

  const organization = req.org._id;
  const existedCustomer = await Customer.findOne({
    organization: req.org._id,
    $or: [{ email }, { phone }]
  });

  if (existedCustomer) {
    throw new ApiError(409, "Customer already exists with this email or phone number under your organization!");
  }

  const customer = await Customer.create({
    name,
    email,
    phone,
    address,
    organization
  });

  const createdCustomer = await Customer.findOne({ _id: customer._id, organization: organization }).select("-email -phone -address");

  return res.status(201).json(new ApiResponse(201, createdCustomer, "Customer created successfully"));
});

const getCustomer = asyncHandler(async (req, res) => {
  const orgId = req.org._id;
  const customerName = req.body.customerName;

  const customers = await Customer.find({
    organization: orgId,
    name: {
      $regex: customerName,
      $options: 'i'
    }
  }, "name address email phone");

  return res.status(200).json(new ApiResponse(200, customers, "Customers fetched!"));
});

const allCustomers = asyncHandler(async (req, res) => {
  const orgId = req.org._id;

  const customers = await Customer.find({
    organization: orgId
  }, "name address email phone");

  return res.status(200).json(new ApiResponse(200, customers, "All customers!"));
});

const updateCustomer = asyncHandler(async (req, res) => {
  const organization = req.org._id;
  const { customerID } = req.params;
  const { name, email, phone, address } = req.body;

  if (!customerID) {
    throw new ApiError(400, "Customer ID is required");
  }

  const updatedCustomer = await Customer.findOneAndUpdate(
    { _id: customerID, organization },
    { name, email, phone, address },
    { new: true, runValidators: true }
  );

  if (!updatedCustomer) {
    throw new ApiError(404, "Customer not found");
  }

  return res.status(200).json(new ApiResponse(200, updatedCustomer, "Customer record updated successfully"));
});

const removeCustomer = asyncHandler(async (req, res) => {
  const organization = req.org._id;
  const { customerID } = req.params;

  if (!customerID) {
    throw new ApiError(400, "Customer ID is required");
  }

  const removedCustomer = await Customer.findOneAndDelete({ _id: customerID, organization });

  if (!removedCustomer) {
    throw new ApiError(404, "Customer not found");
  }

  return res.status(200).json(new ApiResponse(200, removedCustomer, "Customer record removed successfully"));
});

export { createCustomer, getCustomer, allCustomers, updateCustomer, removeCustomer };