import { body, validationResult } from "express-validator";
import Comment from "../models/Comment.js";

export const validateComment = [body("text").isLength({ min: 1, max: 2000 }).withMessage("Comentario requerido")];

export async function listComments(req, res) {
  const recipe = req.params.id;
  const items = await Comment.find({ recipe }).populate("user", "name").sort({ createdAt: -1 });
  res.json(items);
}

export async function addComment(req, res) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  const comment = await Comment.create({ recipe: req.params.id, user: req.user._id, text: req.body.text });
  res.status(201).json(comment);
}

export async function removeComment(req, res) {
  const c = await Comment.findById(req.params.commentId);
  if (!c) return res.status(404).json({ error: "No encontrado" });
  if (String(c.user) !== String(req.user._id)) return res.status(403).json({ error: "Prohibido" });
  await c.deleteOne();
  res.json({ ok: true });
}
