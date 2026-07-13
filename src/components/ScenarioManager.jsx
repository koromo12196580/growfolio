import React, { useEffect, useState } from "react";
import { listSimulations, saveSimulation, loadSimulation, deleteSimulation } from "../storage/storageAdapter.js";

// 保存・名前を付けて保存・読み込み・削除のUI。②の対応。
// 実際のストレージ処理はstorage/storageAdapter.jsに分離してあるので、
// このコンポーネントはUIの状態管理だけを担当する(将来Supabase化してもこのファイルはほぼ変更不要)。
export default function ScenarioManager({ getCurrentData, onLoad }) {
  const [scenarios, setScenarios] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [currentName, setCurrentName] = useState("");
  const [savingAsNew, setSavingAsNew] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [message, setMessage] = useState("");

  const refresh = async () => {
    const list = await listSimulations();
    setScenarios(list);
  };

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(t);
  }, [message]);

  const handleSave = async () => {
    if (!currentId) { setSavingAsNew(true); setNameDraft(""); return; }
    const meta = await saveSimulation({ id: currentId, name: currentName, data: getCurrentData() });
    setMessage(`「${meta.name}」を保存しました`);
    refresh();
  };

  const handleSaveAsConfirm = async () => {
    const name = nameDraft.trim() || `プラン ${new Date().toLocaleDateString("ja-JP")}`;
    const meta = await saveSimulation({ name, data: getCurrentData() });
    setCurrentId(meta.id);
    setCurrentName(meta.name);
    setSavingAsNew(false);
    setMessage(`「${meta.name}」として保存しました`);
    refresh();
  };

  const handleLoad = async (id, name) => {
    const data = await loadSimulation(id);
    if (!data) return;
    onLoad(data);
    setCurrentId(id);
    setCurrentName(name);
    setMessage(`「${name}」を読み込みました`);
  };

  const handleDelete = async (id) => {
    await deleteSimulation(id);
    if (currentId === id) { setCurrentId(null); setCurrentName(""); }
    setConfirmDeleteId(null);
    refresh();
  };

  return (
    <div className="ip-card">
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 10 }}>保存済みプラン</div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <span className="ip-note">
          {currentId ? `現在編集中: ${currentName}` : "まだ保存されていません(新規プラン)"}
        </span>
      </div>

      {savingAsNew ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
          <input
            className="ip-input" style={{ width: 220 }} placeholder="プラン名を入力"
            value={nameDraft} onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveAsConfirm(); }}
          />
          <button className="ip-btn" onClick={handleSaveAsConfirm}>保存する</button>
          <button className="ip-btn ip-btn-ghost" onClick={() => setSavingAsNew(false)}>キャンセル</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <button className="ip-btn" onClick={handleSave}>保存</button>
          <button className="ip-btn ip-btn-ghost" onClick={() => { setSavingAsNew(true); setNameDraft(""); }}>
            名前を付けて保存
          </button>
        </div>
      )}

      {message && <div className="ip-note" style={{ color: "var(--tsumitate)", marginBottom: 10 }}>{message}</div>}

      {scenarios.length === 0 ? (
        <div className="ip-note">保存されたプランはまだありません。</div>
      ) : (
        <div>
          {scenarios.map((s) => (
            <div key={s.id} className="ip-plan-row">
              <span style={{ fontWeight: currentId === s.id ? 700 : 400, color: currentId === s.id ? "var(--navy)" : "var(--ink)" }}>
                {s.name}
              </span>
              <span className="ip-note">{new Date(s.updatedAt).toLocaleString("ja-JP")}</span>
              <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
                <button className="ip-btn ip-btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => handleLoad(s.id, s.name)}>
                  読み込み
                </button>
                {confirmDeleteId === s.id ? (
                  <>
                    <button className="ip-btn" style={{ background: "var(--warn)", fontSize: 12, padding: "6px 12px" }} onClick={() => handleDelete(s.id)}>
                      本当に削除
                    </button>
                    <button className="ip-btn ip-btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => setConfirmDeleteId(null)}>
                      キャンセル
                    </button>
                  </>
                ) : (
                  <button className="ip-btn ip-btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => setConfirmDeleteId(s.id)}>
                    削除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
