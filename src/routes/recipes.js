import { Router } from 'express';
import Recipe from '../models/recipe.js';
import { requireAuth } from '../middlewares/auth.js';

const r = Router();

// ---- helpers: mapear <-> español
const toSpanish = (d) => ({
  id: d._id?.toString(),
  titulo: d.title,
  categoria: d.category,
  tiempo: d.time,
  dificultad: d.difficulty,
  porciones: d.portions,
  historia: d.story,
  ingredientes: d.ingredients, // [{qty,unit,name}]
  pasos: d.steps,              // [string]
  tags: d.tags || [],
  imagen: d.imageUrl,
  publicado: d.published,
  likes: d.likes,
  autor: d.createdBy?.name || d.createdBy || 'Anónimo',
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

const fromSpanish = (b = {}) => ({
  title:       b.title       ?? b.titulo,
  category:    b.category    ?? b.categoria,
  time:        b.time        ?? b.tiempo,
  difficulty:  b.difficulty  ?? b.dificultad,
  portions:    b.portions    ?? b.porciones,
  story:       b.story       ?? b.historia,
  ingredients: b.ingredients ?? b.ingredientes,
  steps:       b.steps       ?? b.pasos,
  tags:        b.tags,
  imageUrl:    b.imageUrl    ?? b.imagen,
});

// LISTAR (público)  GET /api/recipes?q=&cat=
r.get('/', async (req, res, next) => {
  try {
    const { q, cat } = req.query;
    const filter = {};
    if (cat) filter.category = cat;
    if (q) filter.title = { $regex: String(q), $options: 'i' };

    const docs = await Recipe.find(filter).lean();
    res.json(docs.map(toSpanish));
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
    res.json(docs.map(toSpanish));
  } catch (err) { next(err); }
});

// CREAR (protegido)  POST /api/recipes
r.post('/', requireAuth, async (req, res, next) => {
  try {
    const payload = { ...fromSpanish(req.body), createdBy: req.user._id };
    const doc = await Recipe.create(payload);
    res.status(201).json(toSpanish(doc.toObject()));
  } catch (err) { next(err); }
});

// DETALLE (público)  GET /api/recipes/:id
r.get('/:id', async (req, res, next) => {
  try {
    const doc = await Recipe.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Recipe not found' });
    res.json(toSpanish(doc));
  } catch (err) { next(err); }
});

export default r;
