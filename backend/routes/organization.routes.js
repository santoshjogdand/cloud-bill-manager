import { Router } from "express";
import {register,login,logout} from "../controllers/organization.controller.js";
import {createCustomer,getCustomers} from "../controllers/customer.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(register)
router.route("/login").post(login)
router.route("/logout").post(logout)

//secure routes
router.route("/createCustomer").post(verifyJwt,createCustomer)
router.route("/getCustomers").post(verifyJwt,getCustomers)

export default router