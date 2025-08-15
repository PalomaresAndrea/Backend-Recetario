import { Router } from 'express';
import Recipe from '../models/recipe.js';
import { requireAuth } from '../middlewares/auth.js';

const r = Router();

/* LISTAR */
r.get('/', async (req, res, next) => {
  try {
    const { q, cat } = req.query;
    const filter = {};
    if (cat) filter.category = cat;
    if (q) filter.title = { $regex: String(q), $options: 'i' };

    console.log('Recipes.find filter =>', filter); // debug
    const docs = await Recipe.find(filter).lean();
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

/* CREAR (para el botón "Subir") */
r.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const doc = await Recipe.create({
      title: body.title,
      category: body.category,
      time: body.time,
      difficulty: body.difficulty,
      portions: body.portions ?? 1,
      story: body.story ?? '',
      ingredients: body.ingredients ?? [],
      steps: body.steps ?? [],
      tags: body.tags ?? [],
      imageUrl: body.imageUrl ?? '',
      published: body.published ?? true,
      createdBy: req.user._id
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

/* OBTENER POR ID */
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
