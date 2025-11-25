let queue = [];
let nowPlaying = null;
let history = [];

export function getState() {
  return { nowPlaying, queue, history };
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
  if (!nowPlaying) {
    nowPlaying = item;
  } else {
    queue.push(item);
  }
  return getState();
}

export function advance() {
  if (nowPlaying) {
    history.push(nowPlaying);
  }
  if (queue.length > 0) {
    nowPlaying = queue.shift();
  } else {
    nowPlaying = null;
  }
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
  return getState();
}
