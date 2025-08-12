import { Router } from "express";
import { register, login, me, validateRegister, validateLogin } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();
r.post("/register", validateRegister, register);
r.post("/login", validateLogin, login);
r.get("/me", requireAuth, me);
export default r;
