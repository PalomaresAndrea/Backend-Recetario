import { Router } from 'express';
import Recipe from '../models/recipe.js';
import { requireAuth } from '../middlewares/auth.js';

const r = Router();

// LISTAR (público)  GET /api/recipes?q=&cat=
r.get('/', async (req, res, next) => {
  try {
    const { q, cat } = req.query;
    const filter = {};
    if (cat) filter.category = cat;
    if (q) filter.title = { $regex: String(q), $options: 'i' };
    const docs = await Recipe.find(filter).lean();
    res.json(docs);
  } catch (err) { next(err); }
});

// BUSCAR por POST (público)  POST /api/recipes/search  body { q?, cat? }
r.post('/search', async (req, res, next) => {
  try {
    const { q, cat } = req.body || {};
    const filter = {};
    if (cat) filter.category = cat;
    if (q) filter.title = { $regex: String(q), $options: 'i' };
    const docs = await Recipe.find(filter).lean();
    res.json(docs);
  } catch (err) { next(err); }
});

// CREAR (protegido)  POST /api/recipes
r.post('/', requireAuth, async (req, res, next) => {
  try {
    const payload = { ...req.body, createdBy: req.user._id };
    const doc = await Recipe.create(payload);
    res.status(201).json(doc);
  } catch (err) { next(err); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const doc = await Recipe.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Recipe not found' });
    res.json(doc);
  } catch (err) { next(err); }
});

export default r;
