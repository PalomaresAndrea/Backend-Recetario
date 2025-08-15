import { Router } from 'express';
import Recipe from '../models/recipe.js';
import { requireAuth } from '../middlewares/auth.js';

const r = Router();

const toES = (doc) => ({
  id: String(doc._id),
  titulo: doc.title,
  categoria: doc.category,
  tiempo: doc.time,
  dificultad: doc.difficulty,
  porciones: doc.portions,
  historia: doc.story,
  ingredientes: (doc.ingredients||[]).map(i => ({ qty:i.qty, unit:i.unit, name:i.name })),
  pasos: doc.steps || [],
  tags: doc.tags || [],
  imagen: doc.imageUrl,
  publicado: doc.published,
  likes: doc.likes,
  autor: doc.createdBy?.name || doc.createdBy?.email || 'Anónimo',
});

// GET /api/recipes   ?q=&cat=
r.get('/', async (req, res, next) => {
  try {
    const { q, cat } = req.query;
    const filter = {};
    if (cat) filter.category = cat;
    if (q) filter.title = { $regex: String(q), $options: 'i' };
    const docs = await Recipe.find(filter).populate('createdBy','name email').lean();
    res.json(docs.map(toES));
  } catch (e) { next(e); }
});

// POST /api/recipes/search   { q?, cat? }
r.post('/search', async (req, res, next) => {
  try {
    const { q, cat } = req.body || {};
    const filter = {};
    if (cat) filter.category = cat;
    if (q) filter.title = { $regex: String(q), $options: 'i' };
    const docs = await Recipe.find(filter).populate('createdBy','name email').lean();
    res.json(docs.map(toES));
  } catch (e) { next(e); }
});

// POST /api/recipes (protegido)
r.post('/', requireAuth, async (req, res, next) => {
  try {
    const b = req.body || {};
    const payload = {
      title:      b.titulo     ?? b.title,
      category:   b.categoria  ?? b.category,
      time:       b.tiempo     ?? b.time,
      difficulty: b.dificultad ?? b.difficulty,
      portions:   b.porciones  ?? b.portions,
      story:      b.historia   ?? b.story,
      ingredients:b.ingredientes ?? b.ingredients,
      steps:      b.pasos      ?? b.steps,
      tags:       b.tags,
      imageUrl:   b.imagen     ?? b.imageUrl,
      createdBy:  req.user._id,
    };
    const doc = await Recipe.create(payload);
    res.status(201).json(toES(doc));
  } catch (e) { next(e); }
});

// GET /api/recipes/:id
r.get('/:id', async (req, res, next) => {
  try {
    const doc = await Recipe.findById(req.params.id).populate('createdBy','name email').lean();
    if (!doc) return res.status(404).json({ error: 'Recipe not found' });
    res.json(toES(doc));
  } catch (e) { next(e); }
});

export default r;
