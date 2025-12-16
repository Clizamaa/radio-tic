const g = globalThis;

// Inicializar el mapa de salas si no existe
if (!g.__radioRooms) {
  g.__radioRooms = new Map();
}

// Limpieza automática: 2 minutos de inactividad
const INACTIVITY_TIMEOUT = 2 * 60 * 1000;

if (!g.__cleanupInterval) {
  g.__cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [code, room] of g.__radioRooms.entries()) {
      if (now - room.lastActive > INACTIVITY_TIMEOUT) {
        console.log(`Eliminando sala inactiva: ${code}`);
        g.__radioRooms.delete(code);
      }
    }
  }, 30000); // Revisar cada 30 segundos
}

/**
 * Estructura de una sala:
 * {
 *   queue: [],
 *   nowPlaying: null,
 *   history: [],
 *   startedAt: null,
 *   adminToken: "...",
 *   lastActive: number
 * }
 */

// Helper para generar código aleatorio
function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateAdminToken() {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

export function createRoom() {
  let code = generateRoomCode();
  // Asegurar unicidad (aunque es improbable colisión con 6 chars y pocas salas)
  while (g.__radioRooms.has(code)) {
    code = generateRoomCode();
  }
  const adminToken = generateAdminToken();
  const initialState = {
    queue: [],
    nowPlaying: null,
    history: [],
    startedAt: null,
    adminToken,
    lastActive: Date.now(),
    createdAt: Date.now(), // Timestamp de creación
  };
  g.__radioRooms.set(code, initialState);
  return { code, adminToken };
}

export function getAllRooms() {
  const rooms = [];
  for (const [code, room] of g.__radioRooms.entries()) {
    // Recopilar nicknames únicos de la cola y el historial para estimar "integrantes"
    const nicknames = new Set();
    if (room.nowPlaying?.nickname) nicknames.add(room.nowPlaying.nickname);
    room.queue.forEach(i => i.nickname && nicknames.add(i.nickname));
    room.history.forEach(i => i.nickname && nicknames.add(i.nickname));
    
    rooms.push({
      code,
      createdAt: room.createdAt || room.lastActive, // Fallback si es vieja
      lastActive: room.lastActive,
      queueLength: room.queue.length,
      nowPlaying: room.nowPlaying,
      members: Array.from(nicknames), // Lista de nicknames activos recientemente
      memberCount: nicknames.size
    });
  }
  // Ordenar por más recientes primero
  return rooms.sort((a, b) => b.createdAt - a.createdAt);
}

export function deleteRoomAdmin(roomCode) {
    return g.__radioRooms.delete(roomCode);
}

export function deleteRoom(roomCode, token) {
  const room = g.__radioRooms.get(roomCode);
  if (!room) return false;
  if (room.adminToken !== token) return false;
  
  g.__radioRooms.delete(roomCode);
  return true;
}

export function getRoomState(roomCode) {
  if (!roomCode) return null;
  const room = g.__radioRooms.get(roomCode);
  if (room) {
    room.lastActive = Date.now();
  }
  return room || null;
}

export function roomExists(roomCode) {
  return g.__radioRooms.has(roomCode);
}

// Helper para obtener sala o crear una por defecto si es necesario (para compatibilidad)
// En este caso, forzaremos el uso de roomCode, si no existe devolvemos null/error implícito.
function getRoom(roomCode) {
  const room = g.__radioRooms.get(roomCode);
  if (room) {
    room.lastActive = Date.now();
  }
  return room;
}

export function getState(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return null;
  return { ...room };
}

export function addRequest(roomCode, { nickname, videoId, title, thumbnailUrl }) {
  const room = getRoom(roomCode);
  if (!room) return null;

  const item = {
    id: Date.now(),
    videoId,
    title,
    thumbnailUrl: thumbnailUrl || "",
    nickname,
    createdAt: new Date().toISOString(),
  };

  const { queue, nowPlaying } = room;
  
  // Regla: evitar doble petición consecutiva
  const lastVideoId = queue.length > 0 ? queue[queue.length - 1]?.videoId : nowPlaying?.videoId;
  if (lastVideoId && lastVideoId === videoId) {
    return getState(roomCode);
  }

  if (!nowPlaying) {
    room.nowPlaying = item;
    room.startedAt = Date.now();
  } else {
    room.queue.push(item);
  }
  
  return getState(roomCode);
}

export function advance(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return null;

  if (room.nowPlaying) {
    room.history.push(room.nowPlaying);
  }
  if (room.queue.length > 0) {
    room.nowPlaying = room.queue.shift();
    room.startedAt = Date.now();
  } else {
    room.nowPlaying = null;
    room.startedAt = null;
  }
  return getState(roomCode);
}

export function previous(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return null;

  if (room.history.length === 0) {
    return getState(roomCode);
  }
  if (room.nowPlaying) {
    room.queue.unshift(room.nowPlaying);
  }
  room.nowPlaying = room.history.pop();
  room.startedAt = Date.now();
  return getState(roomCode);
}

export function removeFromQueue(roomCode, id) {
  const room = getRoom(roomCode);
  if (!room) return null;

  room.queue = room.queue.filter((item) => item.id !== id);
  return getState(roomCode);
}

export function reorderQueue(roomCode, orderIds) {
  const room = getRoom(roomCode);
  if (!room) return null;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return getState(roomCode);
  }

  const idToItem = new Map(room.queue.map((item) => [item.id, item]));
  const newQueue = [];
  for (const id of orderIds) {
    const item = idToItem.get(id);
    if (item) {
      newQueue.push(item);
      idToItem.delete(id);
    }
  }
  for (const item of idToItem.values()) {
    newQueue.push(item);
  }
  room.queue = newQueue;
  return getState(roomCode);
}
