// tests/seed.js
import bcrypt from 'bcryptjs';
import User from '../src/models/user.js';
import Recipe from '../src/models/recipe.js';
import Comment from '../src/models/Comment.js';

export async function seedUser({ email='u@test.com', password='Secret123', name='Tester', verified=true } = {}) {
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email, name, password: hash, emailVerified: verified
  });
  return user;
}

export async function seedRecipe({ title='Tacos', createdBy, published=true } = {}) {
  const r = await Recipe.create({
    title, category:'Mexicana', time:'20 min', difficulty:'Fácil',
    portions:2, story:'', ingredients:[{ qty:'2', unit:'pz', name:'tortilla'}],
    steps:['calentar','servir'], tags:['rapido'], imageUrl:'',
    published, createdBy
  });
  return r;
}

export async function seedComment({ recipe, user, text='Muy rico!' } = {}) {
  return Comment.create({ recipe, user, text });
}
