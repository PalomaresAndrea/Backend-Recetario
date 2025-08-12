import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true, index: true },
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:   { type: String, required: true, trim: true, maxlength: 2000 }
}, { timestamps: true });

export default mongoose.model('Comment', commentSchema);
