// Demo-only ephemeral vault for raw secrets.
// In-memory + sessionStorage mirror.
const memory = new Map<string, string>();
const SS_KEY = "api-secrets-vault-v1";

function loadFromSession() {
  try {
    const json = sessionStorage.getItem(SS_KEY);
    if (json) {
      const obj = JSON.parse(json) as Record<string, string>;
      for (const [k, v] of Object.entries(obj)) memory.set(k, v);
    }
  } catch {}
}
function saveToSession() {
  try {
    const obj: Record<string, string> = {};
    for (const [k, v] of memory.entries()) obj[k] = v;
    sessionStorage.setItem(SS_KEY, JSON.stringify(obj));
  } catch {}
}

loadFromSession();

export const secretsVault = {
  set(secretId: string, raw: string) {
    memory.set(secretId, raw);
    saveToSession();
  },
  get(secretId?: string) {
    if (!secretId) return null;
    return memory.get(secretId) ?? null;
  },
  remove(secretId?: string) {
    if (!secretId) return;
    memory.delete(secretId);
    saveToSession();
  },
  clearAll() {
    memory.clear();
    saveToSession();
  },
};
