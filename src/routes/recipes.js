// src/routes/recipes.js
import { Router } from 'express';
import Recipe from '../models/Recipe.js';

const r = Router();

/**
 * GET /api/recipes
 * Query:
 *  - q: texto en título (regex)
 *  - cat: categoría exacta
 */
r.get('/', async (req, res, next) => {
  try {
    const { q, cat } = req.query;
    const filter = {};
    if (cat) filter.category = cat;
    if (q) filter.title = { $regex: String(q), $options: 'i' };

    const docs = await Recipe.find(filter).lean();
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

/**
 * (Opcional) GET /api/recipes/:id
 */
r.get('/:id', async (req, res, next) => {
  try {
    const doc = await Recipe.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Recipe not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

export default r;
