import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';

const categories = new Hono();

// GET /api/categories — list all categories (public)
categories.get('/', async (c) => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, description, icon')
    .order('name', { ascending: true });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data });
});

export default categories;
