:root{
  --bg:#0f1721; --panel:#0b1220; --card:#0f1726; --muted:#9aa3ad; --accent:#0ea5a4; --danger:#ef4444;
  --glass: rgba(255,255,255,0.03);
}
*{box-sizing:border-box}
body{margin:0;font-family:Inter, system-ui, Arial, sans-serif;background:var(--bg);color:#e6eef6}
header{padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;flex-direction:column;gap:8px}
header h1{margin:0;font-size:18px}
.top-meta{display:flex;justify-content:space-between;align-items:center;gap:12px}
.top-meta .top-actions{display:flex;gap:8px;align-items:center}
button{background:var(--accent);color:#022;border:0;padding:8px 10px;border-radius:8px;cursor:pointer;font-weight:600}
button.ghost{background:transparent;border:1px solid rgba(255,255,255,0.04);color:var(--muted)}
button.danger{background:var(--danger);color:white}
.small-muted{font-size:12px;color:var(--muted)}
.two-col{display:flex;gap:16px;padding:16px;align-items:flex-start}
.panel-left{flex:0 0 460px;max-height:72vh;overflow:auto;padding-right:6px}
.panel-right{flex:1;max-width:740px}
.card{background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));border-radius:12px;padding:12px;border:1px solid rgba(255,255,255,0.03)}
.compact-list{display:flex;flex-direction:column;gap:10px;padding:6px}
.compact-item{background:var(--card);padding:10px;border-radius:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;border:1px solid rgba(255,255,255,0.03)}
.compact-left{display:flex;flex-direction:column;gap:4px}
.tag{font-size:11px;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,0.03);color:var(--muted)}
.small{font-size:12px}
.mini-stats{display:flex;gap:8px;flex-wrap:wrap}
.mini-stat{font-size:12px;color:var(--muted);padding:4px 6px;border-radius:6px;background:rgba(255,255,255,0.02)}
.row{display:flex;gap:8px;align-items:center}
.cols-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.cols-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.grid-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:8px}
label{font-size:12px;color:var(--muted)}
input,select{background:transparent;border:1px solid rgba(255,255,255,0.04);padding:8px;border-radius:8px;color:#e6eef6}
input[type="number"]{text-align:right}
.divider{height:1px;background:rgba(255,255,255,0.02);margin:10px 0}
.right{text-align:right}
.panel-left h2{margin:0 0 6px 0}
footer{padding:12px;text-align:center;color:var(--muted)}
.danger{background:var(--danger)}
@media (max-width:1000px){ .two-col{flex-direction:column} .panel-left{flex-basis:auto} .panel-right{max-width:100%} }
