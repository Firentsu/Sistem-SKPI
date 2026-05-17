/**
 * SSE Manager — kelola koneksi Server-Sent Events per user.
 * Satu user bisa punya beberapa tab/koneksi sekaligus (Set).
 */

const connections = new Map(); // user_id → Set<res>

export function subscribe(userId, res) {
  if (!connections.has(userId)) connections.set(userId, new Set());
  connections.get(userId).add(res);
}

export function unsubscribe(userId, res) {
  const set = connections.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) connections.delete(userId);
}

export function send(userId, data) {
  const set = connections.get(userId);
  if (!set || set.size === 0) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of [...set]) {
    try {
      res.write(payload);
    } catch {
      set.delete(res);
    }
  }
}
