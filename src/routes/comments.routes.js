import { Router } from "express";
import { listComments, addComment, removeComment, validateComment } from "../controllers/comments.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router({ mergeParams: true });
r.get("/", listComments);
r.post("/", requireAuth, validateComment, addComment);
r.delete("/:commentId", requireAuth, removeComment);
export default r;
