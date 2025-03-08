import { Router } from "express";
import { 
    initiateRegistration,
    verifyRegistrationOTP,
    resendRegistrationOTP,
    login, 
    logout, 
    sendOTP, 
    verifyOTP, 
    resetPassword 
} from "../controllers/organization.controller.js";

import { 
    createCustomer, 
    getCustomer, 
    allCustomers, 
    updateCustomer, 
    removeCustomer 
} from "../controllers/customer.controller.js";

import { 
    addUOM, 
    addProduct, 
    getUOMS, 
    getProducts, 
    findProduct, 
    updateProduct, 
    removeProduct 
} from "../controllers/inventory.controller.js";

import { 
    createInvoice, 
    removeInvoice, 
    getAllInvoice, 
    getInvoice 
} from "../controllers/invoice.controller.js";

import verifyJwt from "../middlewares/auth.middleware.js";

const router = Router();

// Organization authentication routes with OTP verification for registration
router.route("/register/initiate").post(initiateRegistration);
router.route("/register/verify").post(verifyRegistrationOTP);
router.route("/register/resend-otp").post(resendRegistrationOTP);

// Legacy route for backward compatibility (optional - can be removed if not needed)
router.route("/register").post(initiateRegistration);

// Other authentication routes
router.route("/login").post(login);
router.route("/logout").post(logout);

// Password reset routes
router.route("/sendOTP").post(sendOTP);
router.route("/verifyOTP").post(verifyOTP);
router.route("/resetPassword").post(resetPassword);

// Secure routes
// Customer Routes
router.route("/createCustomer").post(verifyJwt, createCustomer);
router.route("/customer/:customerID")
    .put(verifyJwt, updateCustomer)   // Update customer by ID
    .delete(verifyJwt, removeCustomer); // Remove customer by ID

router.route("/Customers")
    .post(verifyJwt, getCustomer)      // Search for a specific customer
    .get(verifyJwt, allCustomers);      // Get all customers

// Inventory routes
router.route("/addProduct").post(verifyJwt, addProduct);
router.route("/product/:product_id")
    .put(verifyJwt, updateProduct)     // Update product by ID
    .delete(verifyJwt, removeProduct);  // Remove product by ID

router.route("/getProducts")
    .get(verifyJwt, getProducts)       // Get all products
    .post(verifyJwt, findProduct);      // Search for a specific product

// Unit of Measure (UOM) routes
router.route("/addUOM").post(verifyJwt, addUOM);
router.route("/getUOMS").get(verifyJwt, getUOMS);

// Invoice routes
router.route("/createInvoice").post(verifyJwt, createInvoice);
router.route("/getInvoices")
    .get(verifyJwt, getAllInvoice)     // Get all invoices
    .post(verifyJwt, getInvoice);       // Get a specific invoice

router.route("/removeinvoice/:invoice_number").delete(verifyJwt, removeInvoice);

export default router;