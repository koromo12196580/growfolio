// 保存プランのストレージ層。
// 今はlocalStorageで実装しているが、呼び出し側は非同期(Promiseベース)のAPIしか使わないため、
// 将来Supabaseなどのバックエンドに差し替える場合もこのファイルの中身を書き換えるだけで済む構成にしている。
//
// 呼び出し側が使う関数はこの5つだけ:
//   listSimulations() / saveSimulation({ id, name, data }) / loadSimulation(id) / deleteSimulation(id) / renameSimulation(id, name)

const STORAGE_PREFIX = "firemap:scenario:";
const INDEX_KEY = "firemap:scenario-index";

function readIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writeIndex(index) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `sc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// 保存済みプランの一覧(id/name/updatedAt)を新しい順に返す
export async function listSimulations() {
  return readIndex().sort((a, b) => b.updatedAt - a.updatedAt);
}

// プランを保存する。idを渡せば上書き保存、渡さなければ新規保存になる。
export async function saveSimulation({ id, name, data }) {
  const scenarioId = id || generateId();
  const now = Date.now();
  localStorage.setItem(STORAGE_PREFIX + scenarioId, JSON.stringify(data));
  const index = readIndex();
  const existingIdx = index.findIndex((s) => s.id === scenarioId);
  const meta = { id: scenarioId, name: name || "名称未設定", updatedAt: now };
  if (existingIdx >= 0) index[existingIdx] = meta; else index.push(meta);
  writeIndex(index);
  return meta;
}

// 保存済みプランのデータ本体を読み込む
export async function loadSimulation(id) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// プランを削除する
export async function deleteSimulation(id) {
  localStorage.removeItem(STORAGE_PREFIX + id);
  writeIndex(readIndex().filter((s) => s.id !== id));
}

// プラン名だけを変更する
export async function renameSimulation(id, name) {
  const index = readIndex();
  const idx = index.findIndex((s) => s.id === id);
  if (idx >= 0) {
    index[idx] = { ...index[idx], name };
    writeIndex(index);
    return index[idx];
  }
  return null;
}
