import { Router } from "express";
import { register, login, logout,sendOTP,verifyOTP,resetPassword} from "../controllers/organization.controller.js";
import {createCustomer,getCustomer,allCustomers,updateCustomer,removeCustomer} from "../controllers/customer.controller.js";
import { addUOM, addProduct, getUOMS, getProducts, findProduct,updateProduct,removeProduct }from "../controllers/inventory.controller.js";
import {createInvoice,removeInvoice} from "../controllers/invoice.controller.js"
import verifyJwt from "../middlewares/auth.middleware.js";

const router = Router()

//organization auth routes
router.route("/register").post(register)
router.route("/login").post(login)
router.route("/logout").post(logout)
router.route("/sendOTP").post(sendOTP)
router.route("/verifyOTP").post(verifyOTP)
router.route("/resetPassword").post(resetPassword)

//secure routes
//Customer Routes
router.route("/createCustomer").post(verifyJwt,createCustomer);
router.route("/customer/:customerID")
    .put(verifyJwt, updateCustomer)   // Update customer by ID
    .delete(verifyJwt, removeCustomer); // Remove customer by ID

router.route("/Customers").post(verifyJwt,getCustomer).get(verifyJwt,allCustomers);

//Inventory routes
router.route("/addProduct").post(verifyJwt,addProduct)
router.route("/product/:product_id")
    .put(verifyJwt, updateProduct)   // Update product by ID
    .delete(verifyJwt, removeProduct); // Remove product by ID
router.route("/getProducts").get(verifyJwt,getProducts).post(verifyJwt,findProduct);

//UOM
router.route("/addUOM").post(verifyJwt,addUOM)
router.route("/getUOMS").get(verifyJwt,getUOMS)

//Invoice routes
router.route("/createInvoice").post(verifyJwt,createInvoice);
router.route("/removeinvoice/:invoice_id").delete(verifyJwt,removeInvoice);

export default router