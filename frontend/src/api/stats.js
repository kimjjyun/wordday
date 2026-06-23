// 익명 방문 집계 (운영자 통계용). 사용자 경험에 절대 영향 주지 않도록 fire-and-forget.
const API = import.meta.env.VITE_API_URL;

export function trackVisit(kind = 'guest') {
  try {
    let vid = localStorage.getItem('wd_vid');
    if (!vid) {
      vid = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('wd_vid', vid);
    }
    const today = new Date().toISOString().slice(0, 10);
    const gateKey = `wd_vd_${kind}`;
    if (localStorage.getItem(gateKey) === today) return; // 오늘 이미 집계됨
    localStorage.setItem(gateKey, today);

    fetch(`${API}/stats/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: vid, kind }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* 무시 */
  }
}
