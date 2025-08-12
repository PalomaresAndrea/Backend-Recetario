import { body, validationResult } from "express-validator";
import User from "../models/user.js";
import { signToken } from "../middlewares/auth.js";

export const validateRegister = [
  body("name").isLength({ min: 2 }).withMessage("Nombre requerido"),
  body("email").isEmail().withMessage("Email inválido"),
  body("password").isLength({ min: 6 }).withMessage("Min 6 caracteres"),
];

export const validateLogin = [body("email").isEmail(), body("password").notEmpty()];

export async function register(req, res) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: "Email ya registrado" });
  const user = await User.create({ name, email, password });
  const token = signToken(user);
  res.status(201).json({ user, token });
}

export async function login(req, res) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) return res.status(401).json({ error: "Credenciales inválidas" });
  const token = signToken(user);
  res.json({ user: { ...user.toJSON(), password: undefined }, token });
}

export async function me(req, res) { res.json({ user: req.user }); }
