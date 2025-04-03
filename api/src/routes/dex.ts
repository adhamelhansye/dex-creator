import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  dexSchema,
  dexStorage,
  generateId,
  type DexConfig,
} from '../models/dex';

const dexRoutes = new Hono();

// Get all DEXes
dexRoutes.get('/', c => {
  return c.json(Object.values(dexStorage));
});

// Get a specific DEX
dexRoutes.get('/:id', c => {
  const id = c.req.param('id');
  const dex = dexStorage[id];

  if (!dex) {
    return c.json({ message: 'DEX not found' }, 404);
  }

  return c.json(dex);
});

// Create a new DEX
dexRoutes.post('/', zValidator('json', dexSchema), c => {
  const data = c.req.valid('json');
  const id = generateId();
  const timestamp = new Date().toISOString();

  const newDex: DexConfig = {
    id,
    name: data.name,
    description: data.description,
    logo: data.logo,
    theme: {
      primaryColor: data.theme.primaryColor,
      secondaryColor: data.theme.secondaryColor,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  dexStorage[id] = newDex;

  return c.json(newDex, 201);
});

// Update a DEX
dexRoutes.put('/:id', zValidator('json', dexSchema), c => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  if (!dexStorage[id]) {
    return c.json({ message: 'DEX not found' }, 404);
  }

  const updatedDex: DexConfig = {
    ...dexStorage[id],
    name: data.name,
    description: data.description,
    logo: data.logo,
    theme: {
      primaryColor: data.theme.primaryColor,
      secondaryColor: data.theme.secondaryColor,
    },
    updatedAt: new Date().toISOString(),
  };

  dexStorage[id] = updatedDex;

  return c.json(updatedDex);
});

// Delete a DEX
dexRoutes.delete('/:id', c => {
  const id = c.req.param('id');

  if (!dexStorage[id]) {
    return c.json({ message: 'DEX not found' }, 404);
  }

  delete dexStorage[id];

  return c.json({ message: 'DEX deleted successfully' });
});

export default dexRoutes;
