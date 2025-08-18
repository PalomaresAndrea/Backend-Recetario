// tests/recipes.routes.test.js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startMemoryMongo, stopMemoryMongo, clearDB, createTestApp } from './testUtils.js';
import { seedUser, seedRecipe } from './seed.js';
import { signToken } from '../src/middlewares/auth.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';
process.env.MAIL_DISABLED = 'true';

describe('routes/recipes', () => {
  let app, user, token;

  beforeAll(async () => { await startMemoryMongo(); app = createTestApp(); });
  beforeEach(async () => { 
    await clearDB(); 
    user = await seedUser();
    token = signToken(user);
  });
  afterAll(async () => { await stopMemoryMongo(); });

  it('GET /api/recipes devuelve array (200)', async () => {
    await seedRecipe({ createdBy: user._id, title:'Tacos al pastor' });
    await seedRecipe({ createdBy: user._id, title:'Ramen', published:false }); // sin published en tu GET de routes/recipes realmente no filtras published, pero ok
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/recipes requiere auth (401)', async () => {
    const res = await request(app).post('/api/recipes').send({ titulo:'Aguachile', ingredientes:[{name:'camarón'}], pasos:['mezclar'] });
    expect(res.status).toBe(401);
  });

  it('POST /api/recipes crea receta (201) y luego GET/:id (200)', async () => {
    const body = { 
      titulo:'Aguachile', categoria:'Mariscos', tiempo:'20 min', dificultad:'Fácil',
      ingredientes:[{qty:'1',unit:'kg',name:'camarón'}], pasos:['pelar','mezclar'], tags:['mariscos'], imagen:'http://x/img.jpg'
    };
    const create = await request(app).post('/api/recipes').set('Authorization', `Bearer ${token}`).send(body);
    expect(create.status).toBe(201);
    const id = create.body.id;

    const get = await request(app).get(`/api/recipes/${id}`);
    expect(get.status).toBe(200);
    expect(get.body.titulo).toBe('Aguachile');
  });

  it('POST /api/recipes/search filtra por q (200)', async () => {
    await seedRecipe({ createdBy: user._id, title:'Chilaquiles' });
    const res = await request(app).post('/api/recipes/search').send({ q:'chila' });
    expect(res.status).toBe(200);
    expect(res.body[0].titulo.toLowerCase()).toContain('chila');
  });
});
