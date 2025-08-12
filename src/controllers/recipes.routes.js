import { body, validationResult, query } from 'express-validator';
import Recipe from '../models/recipe.js';
import User from '../models/User.js';

export const validateCreateRecipe = [
  body('title').trim().notEmpty().withMessage('Título requerido'),
  body('ingredients').isArray({ min: 1 }).withMessage('Al menos 1 ingrediente'),
  body('steps').isArray({ min: 1 }).withMessage('Al menos 1 paso')
];

export const listQueryValidators = [
  query('q').optional().isString(),
  query('cat').optional().isString(),
  query('tag').optional().isString(),
  query('page').optional().toInt().isInt({ min: 1 }),
  query('limit').optional().toInt().isInt({ min: 1, max: 100 })
];

export async function createRecipe(req, res) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

  const r = await Recipe.create({
    ...req.body,
    createdBy: req.user._id
  });
  res.status(201).json(r);
}

export async function listRecipes(req, res) {
  const { q, cat, tag } = req.query;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 12);

  const filter = { published: true };
  if (cat) filter.category = cat;
  if (tag) filter.tags = tag;
  if (q) filter.$text = { $search: q };

  const cursor = Recipe.find(filter).sort({ createdAt: -1 });
  const total = await Recipe.countDocuments(filter);
  const items = await cursor.skip((page - 1) * limit).limit(limit).lean();

  res.json({ page, limit, total, items });
}

export async function getFeatured(_req, res) {
  const items = await Recipe.find({ published: true })
    .sort({ likes: -1, createdAt: -1 })
    .limit(10).lean();
  res.json(items);
}

export async function getOne(req, res) {
  const r = await Recipe.findById(req.params.id);
  if (!r) return res.status(404).json({ error: 'No encontrada' });
  res.json(r);
}

export async function updateRecipe(req, res) {
  const r = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!r) return res.status(404).json({ error: 'No encontrada' });
  res.json(r);
}

export async function removeRecipe(req, res) {
  const r = await Recipe.findByIdAndDelete(req.params.id);
  if (!r) return res.status(404).json({ error: 'No encontrada' });
  res.json({ ok: true });
}

export async function toggleFavorite(req, res) {
  const recipeId = req.params.id;
  const user = await User.findById(req.user._id);
  const idx = user.favorites.findIndex(id => String(id) === String(recipeId));
  if (idx >= 0) user.favorites.splice(idx, 1);
  else user.favorites.push(recipeId);
  await user.save();

  const likes = await User.countDocuments({ favorites: recipeId });
  await Recipe.findByIdAndUpdate(recipeId, { likes });

  res.json({ favorites: user.favorites, likes });
}
