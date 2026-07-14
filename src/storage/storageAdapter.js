// 保存プランのストレージ層。
// 今はlocalStorageで実装しているが、呼び出し側は非同期(Promiseベース)のAPIしか使わないため、
// 将来Supabaseなどのバックエンドに差し替える場合もこのファイルの中身を書き換えるだけで済む構成にしている。
//
// 保存データはユーザーIDで名前空間を分けている(ログインしているユーザーごとに別々に保存される)。
// Supabase移行時は、userIdをそのままテーブルの user_id カラムの絞り込み条件に使えばよい想定。
//
// 呼び出し側が使う関数はこの5つ:
//   listSimulations(userId) / saveSimulation({ userId, id, name, data }) /
//   loadSimulation(userId, id) / deleteSimulation(userId, id) / renameSimulation(userId, id, name)

const INDEX_KEY = (userId) => `firemap:scenario-index:${userId}`;
const ITEM_KEY = (userId, id) => `firemap:scenario:${userId}:${id}`;

function readIndex(userId) {
  try {
    const raw = localStorage.getItem(INDEX_KEY(userId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writeIndex(userId, index) {
  localStorage.setItem(INDEX_KEY(userId), JSON.stringify(index));
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `sc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// 保存済みプランの一覧(id/name/updatedAt)を新しい順に返す
export async function listSimulations(userId) {
  if (!userId) return [];
  return readIndex(userId).sort((a, b) => b.updatedAt - a.updatedAt);
}

// プランを保存する。idを渡せば上書き保存、渡さなければ新規保存になる。
export async function saveSimulation({ userId, id, name, data }) {
  if (!userId) throw new Error("saveSimulation: userId is required (ログインが必要です)");
  const scenarioId = id || generateId();
  const now = Date.now();
  localStorage.setItem(ITEM_KEY(userId, scenarioId), JSON.stringify(data));
  const index = readIndex(userId);
  const existingIdx = index.findIndex((s) => s.id === scenarioId);
  const meta = { id: scenarioId, name: name || "名称未設定", updatedAt: now };
  if (existingIdx >= 0) index[existingIdx] = meta; else index.push(meta);
  writeIndex(userId, index);
  return meta;
}

// 保存済みプランのデータ本体を読み込む
export async function loadSimulation(userId, id) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(ITEM_KEY(userId, id));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// プランを削除する
export async function deleteSimulation(userId, id) {
  if (!userId) return;
  localStorage.removeItem(ITEM_KEY(userId, id));
  writeIndex(userId, readIndex(userId).filter((s) => s.id !== id));
}

// プラン名だけを変更する
export async function renameSimulation(userId, id, name) {
  if (!userId) return null;
  const index = readIndex(userId);
  const idx = index.findIndex((s) => s.id === id);
  if (idx >= 0) {
    index[idx] = { ...index[idx], name };
    writeIndex(userId, index);
    return index[idx];
  }
  return null;
}
