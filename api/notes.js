import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
    });
  }

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    return res.status(500).json({
      error: 'SERVER_CONFIGURATION_ERROR',
    });
  }

  const supabase = createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from('vault_notes')
    .select('id, title, content')
    .order('id', { ascending: true });

  if (error) {
    console.error('vault_notes read failed');
    return res.status(500).json({
      error: 'DATA_READ_FAILED',
    });
  }

  return res.status(200).json({
    notes: data,
  });
}
