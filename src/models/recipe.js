import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  qty: { type: String, trim: true },
  unit: { type: String, trim: true },
  name: { type: String, trim: true, required: true }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true, trim: true },
  category: { type: String, index: true, trim: true },
  time: { type: String, trim: true },
  difficulty: { type: String, trim: true },
  portions: { type: Number, default: 1, min: 1 },
  story: { type: String, default: '' },
  ingredients: { type: [ingredientSchema], default: [] },
  steps: { type: [String], default: [] },
  tags: { type: [String], index: true, default: [] },
  imageUrl: { type: String, default: '' },
  published: { type: Boolean, default: true },
  likes: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

recipeSchema.index({ title: 'text', story: 'text', tags: 'text' });

// El nombre del modelo puede ser 'Recipe' (convención)
export default mongoose.model('recipe', recipeSchema);
