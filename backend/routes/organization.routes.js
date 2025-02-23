import { Router } from "express";
import {register,login,logout} from "../controllers/organization.controller.js";
import {allCustomers, createCustomer,getCustomer} from "../controllers/customer.controller.js";
import { addUOM,addProduct,getUOMS, getProducts ,findProduct} from "../controllers/inventory.controller.js";
import {createInvoice} from "../controllers/invoice.controller.js"
import verifyJwt from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(register)
router.route("/login").post(login)
router.route("/logout").post(logout)

//secure routes
//Customer Routes
router.route("/createCustomer").post(verifyJwt,createCustomer);
router.route("/Customers").post(verifyJwt,getCustomer).get(verifyJwt,allCustomers);

//Inventory routes
router.route("/addProduct").post(verifyJwt,addProduct)
router.route("/getProducts").get(verifyJwt,getProducts).post(verifyJwt,findProduct);
router.route("/addUOM").post(verifyJwt,addUOM)
router.route("/getUOMS").get(verifyJwt,getUOMS)

//Invoice routes
router.route("/createInvoice").post(verifyJwt,createInvoice);

export default router