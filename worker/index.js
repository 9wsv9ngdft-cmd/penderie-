// ReLook — notifications du matin et du soir (Cloudflare Worker)
// Ce serveur ne connaît QUE l'adresse de notification du téléphone, les deux heures choisies et le fuseau horaire.
// Aucun vêtement, aucune photo, aucune donnée de la penderie ne lui est envoyée.
// Stockage : une seule clé KV « subs » (petit nombre d'abonnés) + la clé « vapid » (créée au premier appel).

const APP = 'https://9wsv9ngdft-cmd.github.io/penderie-/';
const ORIGINS = ['https://9wsv9ngdft-cmd.github.io', 'http://localhost:8765'];
const PUSH_HOSTS = /^(web\.push\.apple\.com|fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9-]+\.notify\.windows\.com)$/;
const MAX_SUBS = 500, WINDOW_MIN = 5;
const MSG = {
  am: { title: '☀️ ReLook', body: 'Ta tenue du jour est prête. On regarde ?' },
  pm: { title: '🌙 ReLook', body: 'Tu as porté quoi aujourd’hui ? Un toucher pour le noter.' },
  test: { title: '👋 ReLook', body: 'Les notifications marchent ! À demain matin.' },
};

/* ---------- petits outils ---------- */
const te = new TextEncoder();
const b64u = {
  enc: buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0)),
};
const cat = (...a) => { const n = a.reduce((s, x) => s + x.length, 0), o = new Uint8Array(n); let i = 0; for (const x of a) { o.set(x, i); i += x.length } return o };
const hkdf = async (salt, ikm, info, len) => new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info },
  await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']), len * 8));
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const okTz = tz => { try { new Intl.DateTimeFormat('fr-FR', { timeZone: tz }); return true } catch { return false } };

/* ---------- clés VAPID (créées une fois, gardées dans KV) ---------- */
async function vapid(env) {
  let v = await env.KV.get('vapid', 'json');
  if (!v) {
    const k = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    v = { pub: b64u.enc(await crypto.subtle.exportKey('raw', k.publicKey)), jwk: await crypto.subtle.exportKey('jwk', k.privateKey) };
    await env.KV.put('vapid', JSON.stringify(v));
  }
  return v;
}
async function vapidHeader(endpoint, v) {
  const aud = new URL(endpoint).origin;
  const h = b64u.enc(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const p = b64u.enc(te.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: APP })));
  const key = await crypto.subtle.importKey('jwk', v.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, te.encode(h + '.' + p));
  return `vapid t=${h}.${p}.${b64u.enc(sig)}, k=${v.pub}`;
}

/* ---------- chiffrement du message (RFC 8291, aes128gcm) ---------- */
export async function encrypt(sub, text, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const ua = b64u.dec(sub.keys.p256dh), auth = b64u.dec(sub.keys.auth);
  const as = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', as.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', ua, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, as.privateKey, 256));
  const ikm = await hkdf(auth, ecdh, cat(te.encode('WebPush: info\0'), ua, asPub), 32);
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, cat(te.encode(text), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}
async function send(env, s, kind, v) {
  const body = await encrypt(s.sub, JSON.stringify({ ...MSG[kind], url: APP + '#matin', kind }));
  const r = await fetch(s.sub.endpoint, { method: 'POST', body, headers: {
    Authorization: await vapidHeader(s.sub.endpoint, v), TTL: '3600', Urgency: 'high',
    'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream' } });
  return r.status;
}

/* ---------- abonnés ---------- */
const getSubs = async env => (await env.KV.get('subs', 'json')) || {};
const idOf = async ep => b64u.enc(await crypto.subtle.digest('SHA-256', te.encode(ep))).slice(0, 22);
function cleanSub(b) {
  const s = b && b.sub, k = s && s.keys;
  if (!s || typeof s.endpoint !== 'string' || s.endpoint.length > 1000 || !k || typeof k.p256dh !== 'string' || typeof k.auth !== 'string') return null;
  let u; try { u = new URL(s.endpoint) } catch { return null }
  if (u.protocol !== 'https:' || !PUSH_HOSTS.test(u.hostname)) return null;
  if (b64u.dec(k.p256dh).length !== 65 || b64u.dec(k.auth).length !== 16) return null;
  return {
    sub: { endpoint: s.endpoint, keys: { p256dh: k.p256dh, auth: k.auth } },
    am: HHMM.test(b.am) ? b.am : null, pm: HHMM.test(b.pm) ? b.pm : null,
    tz: typeof b.tz === 'string' && okTz(b.tz) ? b.tz : 'Europe/Paris', last: {},
  };
}

/* ---------- l'heure locale de chaque abonné ---------- */
function localNow(tz, d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(d).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: (+p.hour) * 60 + (+p.minute) };
}
export function due(s, d = new Date()) {
  const n = localNow(s.tz, d), out = [];
  for (const k of ['am', 'pm']) {
    if (!s[k] || (s.last || {})[k] === n.date) continue;
    const [h, m] = s[k].split(':').map(Number), t = h * 60 + m;
    if (n.min >= t && n.min < t + WINDOW_MIN) out.push([k, n.date]);
  }
  return out;
}

/* ---------- serveur ---------- */
function cors(req) {
  const o = req.headers.get('Origin');
  return { 'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0], 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
}
const json = (req, data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors(req) } });

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });
    const path = new URL(req.url).pathname;
    if (req.method === 'GET' && path === '/vapid') return json(req, { key: (await vapid(env)).pub });
    if (req.method !== 'POST') return json(req, { ok: true, service: 'ReLook notifications' });
    if (+(req.headers.get('Content-Length') || 0) > 4000) return json(req, { error: 'trop gros' }, 413);
    let b; try { b = await req.json() } catch { return json(req, { error: 'json' }, 400) }
    const subs = await getSubs(env);
    if (path === '/sub') {
      const s = cleanSub(b); if (!s) return json(req, { error: 'abonnement invalide' }, 400);
      const id = await idOf(s.sub.endpoint);
      if (!subs[id] && Object.keys(subs).length >= MAX_SUBS) return json(req, { error: 'complet' }, 503);
      if (subs[id]) s.last = subs[id].last || {};
      subs[id] = s; await env.KV.put('subs', JSON.stringify(subs));
      return json(req, { ok: true });
    }
    if (path === '/unsub' || path === '/test') {
      const id = typeof b.endpoint === 'string' ? await idOf(b.endpoint) : null;
      if (!id || !subs[id]) return json(req, { error: 'inconnu' }, 404);
      if (path === '/unsub') { delete subs[id]; await env.KV.put('subs', JSON.stringify(subs)); return json(req, { ok: true }) }
      const st = await send(env, subs[id], 'test', await vapid(env));
      return json(req, { ok: st < 300, status: st });
    }
    return json(req, { error: 'chemin' }, 404);
  },
  // toutes les minutes : qui doit recevoir sa notification maintenant ?
  async scheduled(_ev, env) {
    const subs = await getSubs(env); let changed = false; const v = await vapid(env);
    for (const [id, s] of Object.entries(subs)) {
      for (const [k, date] of due(s)) {
        try {
          const st = await send(env, s, k, v);
          if (st === 404 || st === 410) { delete subs[id]; changed = true; break } // abonnement expiré
          s.last = { ...(s.last || {}), [k]: date }; changed = true;
        } catch (e) { console.log('envoi', e && e.message) }
      }
    }
    if (changed) await env.KV.put('subs', JSON.stringify(subs));
  },
};
