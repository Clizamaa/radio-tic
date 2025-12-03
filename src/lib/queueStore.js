const g = globalThis;
if (!g.__radioQueue) {
  g.__radioQueue = {
    queue: [],
    nowPlaying: null,
    history: [],
    startedAt: null,
  };
}
let { queue, nowPlaying, history, startedAt } = g.__radioQueue;

export function getState() {
  return { nowPlaying, queue, history, startedAt };
}

export function addRequest({ nickname, videoId, title, thumbnailUrl }) {
  const item = {
    id: Date.now(),
    videoId,
    title,
    thumbnailUrl: thumbnailUrl || "",
    nickname,
    createdAt: new Date().toISOString(),
  };
  // Regla de negocio: evitar solicitudes consecutivas de la misma canción
  const lastVideoId = queue.length > 0 ? queue[queue.length - 1]?.videoId : nowPlaying?.videoId;
  if (lastVideoId && lastVideoId === videoId) {
    // No alteramos el estado; simplemente devolvemos el actual
    g.__radioQueue = { queue, nowPlaying, history, startedAt };
    return getState();
  }
  if (!nowPlaying) {
    nowPlaying = item;
    startedAt = Date.now();
  } else {
    queue.push(item);
  }
  g.__radioQueue = { queue, nowPlaying, history, startedAt };
  return getState();
}

export function advance() {
  if (nowPlaying) {
    history.push(nowPlaying);
  }
  if (queue.length > 0) {
    nowPlaying = queue.shift();
    startedAt = Date.now();
  } else {
    nowPlaying = null;
    startedAt = null;
  }
  g.__radioQueue = { queue, nowPlaying, history, startedAt };
  return getState();
}

export function previous() {
  if (history.length === 0) {
    return getState();
  }
  if (nowPlaying) {
    queue.unshift(nowPlaying);
  }
  nowPlaying = history.pop();
  startedAt = Date.now();
  g.__radioQueue = { queue, nowPlaying, history, startedAt };
  return getState();
}

export function removeFromQueue(id) {
  // Eliminar solo desde la cola; no afecta nowPlaying
  const before = queue.length;
  queue = queue.filter((item) => item.id !== id);
  // Si no hubo cambios, devolver estado sin modificar
  g.__radioQueue = { queue, nowPlaying, history, startedAt };
  return getState();
}
