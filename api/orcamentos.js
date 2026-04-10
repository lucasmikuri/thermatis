export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const body = req.body;

    const row = {
      id: body.id ?? `orc-${Date.now()}`,
      nome: body.nome ?? null,
      telefone: body.telefone ?? null,
      email: body.email ?? null,
      servico: body.servico ?? null,
      mensagem: body.mensagem ?? null,
      status: body.status ?? 'novo',
      data: body.data ?? new Date().toISOString(),
      origem: body.origem ?? 'site'
    };

    const { data, error } = await supabase
      .from('orcamentos')
      .insert([row])
      .select();

    if (error) {
      return res.status(500).json({ error: `Supabase ${error.code}: ${error.message}` });
    }

    return res.status(200).json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}