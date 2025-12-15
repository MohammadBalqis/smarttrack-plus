import Joi from "joi";

/* ==========================================================
   🔐 LOGIN VALIDATION
   ✔ email + password
   ✔ OR phone + password
   ❌ NOT email-only anymore
========================================================== */
export const loginSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().min(5).optional(),
  password: Joi.string().required(),
}).or("email", "phone");

/* ==========================================================
   🟢 CUSTOMER REGISTER (KEEP AS YOU WANT)
========================================================== */
export const registerCustomerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  phone: Joi.string().min(5).required(),
  password: Joi.string().min(6).required(),
});
