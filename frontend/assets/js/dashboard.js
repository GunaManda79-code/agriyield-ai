(() => {
  const chart = document.getElementById("yield-chart");
  const status = document.getElementById("chart-status");
  if (!chart || !status) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  fetch("http://127.0.0.1:8000/api/history")
    .then(r => { if (!r.ok) throw new Error("History API unavailable"); return r.json(); })
    .then(data => {
      const rows = Array.isArray(data) ? data : (data.history || []);
      const records = rows.filter(x => Number.isFinite(Number(x.predicted_yield))).slice(0, 8).reverse();
      if (!records.length) {
        status.textContent = "No predictions yet";
        chart.innerHTML = '<div class="chart-placeholder">Make your first prediction to see your chart here.</div>';
        return;
      }
      const values = records.map(r => Number(r.predicted_yield));
      const max = Math.max(...values, 1);
      const min = Math.min(0, ...values);
      const span = Math.max(max - min, 1);
      const width = 720, height = 210, padL = 36, padR = 18, padT = 18, padB = 32;
      const innerW = width - padL - padR, innerH = height - padT - padB;
      const pts = values.map((v, i) => {
        const x = padL + (records.length === 1 ? innerW / 2 : i * innerW / (records.length - 1));
        const y = padT + innerH - ((v - min) / span) * innerH;
        return {x, y, v, row: records[i]};
      });
      const poly = pts.map(p => `${p.x},${p.y}`).join(" ");
      const bars = pts.map((p, i) => {
        const bw = Math.min(42, innerW / Math.max(records.length, 1) * .48);
        const bh = Math.max(3, (p.v / max) * (innerH - 6));
        const x = p.x - bw/2, y = padT + innerH - bh;
        const crop = esc(p.row.crop || "Crop");
        return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="6" fill="#3c8b55" opacity=".16"><title>${crop}: ${p.v} tonnes/hectare</title></rect>`;
      }).join("");
      const dots = pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="5.5" fill="#26764a" stroke="#fff" stroke-width="3"><title>${esc(p.row.crop)}: ${p.v} tonnes/hectare</title></circle>`).join("");
      const labels = pts.map(p => `<text x="${p.x}" y="${height-8}" text-anchor="middle" font-size="11" fill="#6d7e71">${esc((p.row.crop || "Crop").slice(0,8))}</text>`).join("");
      chart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Recent predicted yields in tonnes per hectare"><line x1="${padL}" y1="${padT+innerH}" x2="${width-padR}" y2="${padT+innerH}" stroke="#dce7dc"/>${bars}<polyline points="${poly}" fill="none" stroke="#26764a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}</svg>`;
      status.textContent = `${records.length} saved prediction${records.length === 1 ? "" : "s"}`;
    })
    .catch(() => {
      status.textContent = "Could not load history";
      chart.innerHTML = '<div class="chart-placeholder">Start the FastAPI server to load your saved prediction chart.</div>';
    });
})();