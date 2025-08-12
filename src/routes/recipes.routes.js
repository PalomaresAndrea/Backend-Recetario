import { Router } from "express";
import {
  createRecipe, listRecipes, getOne, updateRecipe, removeRecipe,
  toggleFavorite, getFeatured, validateCreateRecipe, listQueryValidators
} from "../controllers/recipes.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const r = Router();
r.get("/featured", getFeatured);
r.get("/", listQueryValidators, listRecipes);
r.get("/:id", getOne);
r.post("/", requireAuth, validateCreateRecipe, createRecipe);
r.patch("/:id", requireAuth, updateRecipe);
r.delete("/:id", requireAuth, removeRecipe);
r.post("/:id/favorite", requireAuth, toggleFavorite);
export default r;
