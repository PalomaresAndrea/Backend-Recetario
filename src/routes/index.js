import { Router } from "express";
import auth from "./auth.routes.js";
import recipes from "./recipes.routes.js";
import comments from "./comments.routes.js";

const api = Router();
api.use("/auth", auth);
api.use("/recipes", recipes);
api.use("/recipes/:id/comments", comments);
export default api;
