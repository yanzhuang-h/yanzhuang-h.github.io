const maxBytes = 8192;
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const controlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;

async function readLetter(request) {
  if (Number(request.headers.get('Content-Length')) > maxBytes) return { status: 413 };
  const reader = request.body?.getReader();
  if (!reader) return { status: 400 };
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return { status: 413 };
      }
      text += decoder.decode(value, { stream: true });
    }
    const data = JSON.parse(text + decoder.decode());
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { status: 400 };
    return { data };
  } catch {
    return { status: 400 };
  } finally {
    reader.releaseLock();
  }
}

export async function handleLetters(request, env, headers, day) {
  if (request.method === 'GET') {
    const { results } = await env.LETTERS_DB.prepare(
      "SELECT message, signature, day AS date FROM guestbook_letters " +
      "WHERE visibility = 'public' AND status = 'approved' ORDER BY rowid DESC LIMIT 50"
    ).all();
    return Response.json({ letters: results }, { headers });
  }

  const reply = status => new Response(null, { status, headers });
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return reply(415);
  }
  const { data, status } = await readLetter(request);
  if (status) return reply(status);
  if (data.website) return reply(201);
  const { signature = '', visibility = 'private', submissionId = crypto.randomUUID() } = data;
  if (typeof data.message !== 'string' || typeof signature !== 'string' ||
      !['private', 'public'].includes(visibility) || typeof submissionId !== 'string' || !uuidV4.test(submissionId)) {
    return reply(400);
  }
  const message = data.message.replace(/\r\n?/g, '\n').trim();
  const name = signature.trim();
  if (!message || Array.from(message).length > 1000 || Array.from(name).length > 40 ||
      controlCharacters.test(message) || controlCharacters.test(name) || /[\r\n]/u.test(name)) {
    return reply(400);
  }
  // A single allowance per Cloudflare location, without a per-visitor key.
  const { success } = await env.LETTER_LIMIT.limit({ key: 'guestbook-submissions' });
  if (!success) {
    headers.set('Retry-After', '60');
    return reply(429);
  }

  const db = env.LETTERS_DB;
  const id = submissionId.toLowerCase();
  const review = visibility === 'public' ? 'pending' : 'private';
  const result = await db.prepare(
    'INSERT INTO guestbook_letters (id, day, signature, message, visibility, status) ' +
    'VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING'
  ).bind(id, day, name, message, visibility, review).run();
  if (!result.meta.changes) {
    // A lost response can be retried. Reusing the id must never change the letter or its consent.
    const same = await db.prepare(
      'SELECT 1 FROM guestbook_letters WHERE id = ? AND signature = ? AND message = ? AND visibility = ?'
    ).bind(id, name, message, visibility).first();
    if (!same) return reply(409);
  }
  return reply(201);
}
