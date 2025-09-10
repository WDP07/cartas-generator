// ====== Configuración / Defaults ======
const STORAGE_KEY = "cg_crm_v1";
const STAT_SCALE = 10; // 1 stat point = 10 budget points
const LEVEL_FACTOR = {1:0.8, 2:1.0, 3:1.2};
const ROLE_DEFAULT_PERCENT = { GK:0.25, DEF:0.25, MED:0.25, DC:0.25 }; // si hay más cartas, se repartirá el resto equitativamente

// perfiles de distribución por rol (porcentajes internos)
const ROLE_PROFILES = {
  GK: {def:0.35, skill:0.25, energy:0.15, train:0.1, atk:0.05, others:0.1},
  DEF:{def:0.35, train:0.2, disc:0.15, atk:0.15, energy:0.15},
  MED:{skill:0.30, atk:0.20, def:0.15, train:0.10, speed:0.10, moral:0.10, pop:0.05},
  DC: {atk:0.40, skill:0.20, speed:0.15, train:0.10, def:0.05, moral:0.10}
};

// estado
let state = {
  collection: null, // {name,size,scoreTotal, cards:[]}
};

// utilidades
const $ = id => document.getElementById(id);
function uid(){ return "C"+Math.random().toString(36).slice(2,9).toUpperCase(); }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateHeader(); }
function loadState(){ const raw = localStorage.getItem(STORAGE_KEY); state = raw ? JSON.parse(raw) : { collection: null }; updateUI(); }
function downloadJSON(obj, filename="cartas.json"){ const blob = new Blob([JSON.stringify(obj,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href); }

// ========== UI helpers ==========
function showMsg(txt){ alert(txt); }
function formatNum(n){ return Number(n).toFixed(0); }

// update header info
function updateHeader(){
  const info = $("collectionInfo");
  if(!state.collection) { info.textContent = "Sin colección activa"; return; }
  const used = state.collection.cards.reduce((s,c)=>s+ (c.budgetUsed||0),0);
  info.innerHTML = `${state.collection.name} — ${state.collection.cards.length}/${state.collection.size} cartas • Score: ${state.collection.scoreTotal} • Usado: ${used}/${state.collection.scoreTotal}`;
  $("statScaleLabel").textContent = STAT_SCALE;
}

// render card list (compact)
function renderCardsList(){
  const list = $("cardsList"); list.innerHTML = "";
  if(!state.collection) return;
  if(state.collection.cards.length === 0){
    list.innerHTML = `<div class="small-muted">No hay cartas. Crea una desde la derecha o autollená.</div>`;
    return;
  }
  state.collection.cards.forEach(c=>{
    const div = document.createElement("div"); div.className="compact-item";
    const left = document.createElement("div"); left.className="compact-left";
    const title = document.createElement("div"); title.innerHTML = `<strong style="font-size:13px">${c.name}</strong> <span class="tag">${c.type||c.tipoCarta||'Jugador'}</span>`;
    const meta = document.createElement("div"); meta.className="small-muted"; meta.textContent = `${c.position||''} | Nivel ${c.level||1}`;
    const mini = document.createElement("div"); mini.className="mini-stats";
    mini.innerHTML = `<span class="mini-stat">⚔️${c.atk||c.stat_atk||0}</span>
                      <span class="mini-stat">🛡️${c.def||c.stat_def||0}</span>
                      <span class="mini-stat">🔋${c.energy||c.stat_energy||0}</span>`;
    left.appendChild(title); left.appendChild(meta); left.appendChild(mini);
    const actions = document.createElement("div");
    const btnE = document.createElement("button"); btnE.className="ghost"; btnE.textContent="Editar";
    btnE.onclick = ()=> loadCardToEditor(c.id);
    const btnD = document.createElement("button"); btnD.className="danger"; btnD.textContent="Borrar";
    btnD.onclick = ()=> { if(confirm("Eliminar carta?")){ deleteCard(c.id); } };
    actions.appendChild(btnE); actions.appendChild(btnD);
    div.appendChild(left); div.appendChild(actions);
    list.appendChild(div);
  });
}

// ========== Budget / distribución ==========
function computeRoleBudget(roleCountMap, collectionScore, role, level){
  // roleCountMap: { GK:count, ... } ; default percentages: ROLE_DEFAULT_PERCENT
  const rolePercent = ROLE_DEFAULT_PERCENT[role] || 0.2;
  const base = collectionScore * rolePercent;
  return base * (LEVEL_FACTOR[level] || 1.0);
}

function budgetToStatsByProfile(budget, role){
  // budget -> returns stats based on ROLE_PROFILES distribution and STAT_SCALE conversion
  const profile = ROLE_PROFILES[role];
  if(!profile) {
    // default spread: divide between atk/def/skill/energy equally
    const per = budget/5;
    return {
      atk: Math.round(per/STAT_SCALE), def: Math.round(per/STAT_SCALE),
      skill: Math.round(per/STAT_SCALE), energy: Math.round(per/STAT_SCALE),
      disc:0, train:0, char:0, speed:0, end:0, moral:0, pop:0
    };
  }
  // map percentages to attribute keys used in UI
  // Some profile keys like 'others' we distribute evenly to leftover attributes
  const attrKeys = ["atk","def","skill","disc","train","char","speed","end","moral","pop","energy"];
  const statMap = {atk:0,def:0,skill:0,disc:0,train:0,char:0,speed:0,end:0,moral:0,pop:0,energy:0};
  let usedPercent = 0;
  for(const k in profile){
    if(k==="others"){ usedPercent += profile[k]; continue; }
    // map profile key to our statMap keys if exact or approximate
    let target = k;
    if(!(target in statMap)){
      // fallback mapping
      if(target==="reflex" || target==="reflejos") target="skill";
      else if(target==="power") target="atk";
    }
    statMap[target] = profile[k];
    usedPercent += profile[k];
  }
  // handle others: distribute to remaining keys equally
  const remaining = Math.max(0,1 - usedPercent);
  const remainingKeys = attrKeys.filter(k=> statMap[k]===0);
  const perRem = remainingKeys.length? remaining/remainingKeys.length : 0;
  remainingKeys.forEach(k=> statMap[k]=perRem);

  // finally convert budget percentages to stat points
  const stats = {};
  for(const k of attrKeys){
    const ptsBudget = budget * (statMap[k]||0);
    stats[k] = Math.max(0, Math.round(ptsBudget/STAT_SCALE));
  }
  return stats;
}

// ========== Card CRUD ==========
function createCardObject(opts = {}){
  const id = uid();
  const type = opts.type || "Jugador";
  const position = opts.position || (type==="Jugador"?"MED":"");
  const level = Number(opts.level || 1);
  // determine budget for this card from collection
  const role = position || "GEN";
  const collection = state.collection;
  const roleBudget = computeRoleBudget(null, collection.scoreTotal, role, level);
  // if there are multiple cards of same role, budgets will be further adjusted on generation step
  const budget = Math.round(roleBudget);
  // if user provided stats, use them and compute budgetUsed
  const stats = {
    atk: Number(opts.atk||opts.stat_atk||0),
    def: Number(opts.def||opts.stat_def||0),
    skill: Number(opts.skill||opts.stat_skill||0),
    disc: Number(opts.disc||opts.stat_disc||0),
    train: Number(opts.train||opts.stat_train||0),
    char: Number(opts.char||opts.stat_char||0),
    speed: Number(opts.spd||opts.stat_spd||0),
    end: Number(opts.end||opts.stat_end||0),
    moral: Number(opts.moral||opts.stat_moral||0),
    pop: Number(opts.pop||opts.stat_pop||0),
    energy: Number(opts.energy||opts.stat_energy||0),
  };
  const sumStats = Object.values(stats).reduce((s,v)=>s+v,0);
  const budgetUsed = sumStats * STAT_SCALE;
  const name = opts.name || `${position||type} ${id}`;
  const card = {
    id, name, type, position, level, budget, budgetUsed,
    // flatten main stats for small-list view
    atk: stats.atk, def: stats.def, energy: stats.energy,
    // full stats
    stats
  };
  // If no stats provided (all zeros) we auto-generate from budget
  const allZero = Object.values(stats).every(v=>v===0);
  if(allZero){
    const derived = budgetToStatsByProfile(budget, position);
    card.stats = {...card.stats, ...derived};
    card.atk = card.stats.atk; card.def = card.stats.def; card.energy = card.stats.energy;
    card.budgetUsed = Object.values(card.stats).reduce((s,v)=>s+v,0)*STAT_SCALE;
  }
  return card;
}

function addCard(card){
  if(!state.collection) { showMsg("Crea primero una colección"); return; }
  state.collection.cards.push(card);
  recalcCollectionUsed();
  saveState(); renderCardsList(); clearEditor();
}

function deleteCard(id){
  if(!state.collection) return;
  state.collection.cards = state.collection.cards.filter(c=>c.id!==id);
  recalcCollectionUsed(); saveState(); renderCardsList(); clearEditor();
}

function loadCardToEditor(id){
  const card = state.collection.cards.find(c=>c.id===id);
  if(!card) return;
  // fill editor
  $("cardType").value = card.type || "Jugador";
  $("position").value = card.position || "";
  $("cardName").value = card.name;
  $("level").value = card.level;
  // stats: fill inputs
  const s = card.stats || {};
  $("stat_atk").value = s.atk||card.atk||0;
  $("stat_def").value = s.def||card.def||0;
  $("stat_skill").value = s.skill||0;
  $("stat_disc").value = s.disc||0;
  $("stat_train").value = s.train||0;
  $("stat_char").value = s.char||0;
  $("stat_spd").value = s.speed||0;
  $("stat_end").value = s.end||0;
  $("stat_moral").value = s.moral||0;
  $("stat_pop").value = s.pop||0;
  $("stat_energy").value = s.energy||0;
  // store editing id
  $("btnSaveCard").dataset.editing = id;
  updateBudgetPreview();
}

// guardar/actualizar carta desde editor
function saveCardFromEditor(){
  if(!state.collection) { showMsg("Crea una colección primero"); return; }
  const editingId = $("btnSaveCard").dataset.editing;
  const payload = {
    type: $("cardType").value,
    position: $("position").value,
    name: $("cardName").value || "Sin nombre",
    level: Number($("level").value),
    stat_atk: Number($("stat_atk").value||0),
    stat_def: Number($("stat_def").value||0),
    stat_skill: Number($("stat_skill").value||0),
    stat_disc: Number($("stat_disc").value||0),
    stat_train: Number($("stat_train").value||0),
    stat_char: Number($("stat_char").value||0),
    stat_spd: Number($("stat_spd").value||0),
    stat_end: Number($("stat_end").value||0),
    stat_moral: Number($("stat_moral").value||0),
    stat_pop: Number($("stat_pop").value||0),
    stat_energy: Number($("stat_energy").value||0)
  };
  // compute budget target for this role/level
  const budget = computeRoleBudget(null, state.collection.scoreTotal, payload.position || "GEN", payload.level);
  // compute required budget from stats
  const statSum = payload.stat_atk + payload.stat_def + payload.stat_skill + payload.stat_disc + payload.stat_train + payload.stat_char + payload.stat_spd + payload.stat_end + payload.stat_moral + payload.stat_pop + payload.stat_energy;
  const requiredBudget = statSum * STAT_SCALE;
  if(requiredBudget > budget){
    if(!confirm(`Los atributos requieren ${requiredBudget} puntos budget y tu presupuesto es ${Math.round(budget)}. ¿Quieres auto-ajustar para encajar?`)){
      return;
    } else {
      // auto adjust proportionally
      const scale = (budget / requiredBudget);
      for(const k of ["stat_atk","stat_def","stat_skill","stat_disc","stat_train","stat_char","stat_spd","stat_end","stat_moral","stat_pop","stat_energy"]){
        payload[k] = Math.max(0, Math.round(payload[k] * scale));
      }
    }
  }
  // build card object (but keep id if editing)
  if(editingId){
    const idx = state.collection.cards.findIndex(c=>c.id===editingId);
    if(idx<0) return;
    const card = state.collection.cards[idx];
    card.name = payload.name;
    card.type = payload.type;
    card.position = payload.position;
    card.level = payload.level;
    card.stats = {
      atk: payload.stat_atk, def: payload.stat_def, skill: payload.stat_skill,
      disc: payload.stat_disc, train: payload.stat_train, char: payload.stat_char,
      speed: payload.stat_spd, end: payload.stat_end, moral: payload.stat_moral,
      pop: payload.stat_pop, energy: payload.stat_energy
    };
    card.atk = card.stats.atk; card.def = card.stats.def; card.energy = card.stats.energy;
    card.budget = Math.round(computeRoleBudget(null, state.collection.scoreTotal, card.position || "GEN", card.level));
    card.budgetUsed = Object.values(card.stats).reduce((s,v)=>s+v,0) * STAT_SCALE;
    state.collection.cards[idx] = card;
    recalcCollectionUsed(); saveState(); renderCardsList(); clearEditor();
    return;
  } else {
    // create new card
    const opts = {
      type: payload.type,
      position: payload.position,
      level: payload.level,
      name: payload.name,
      stat_atk: payload.stat_atk, stat_def: payload.stat_def, stat_skill: payload.stat_skill,
      stat_disc: payload.stat_disc, stat_train: payload.stat_train, stat_char: payload.stat_char,
      stat_spd: payload.stat_spd, stat_end: payload.stat_end, stat_moral: payload.stat_moral,
      stat_pop: payload.stat_pop, stat_energy: payload.stat_energy
    };
    const card = createCardObject(opts);
    addCard(card);
  }
}

// borrar edición / nuevo
function clearEditor(){
  $("btnSaveCard").dataset.editing = "";
  $("cardType").value = "Jugador"; $("position").value="GK"; $("cardName").value="";
  $("level").value=1;
  const stats = {stat_atk:50,stat_def:50,stat_skill:50,stat_disc:50,stat_train:50,stat_char:50,stat_spd:50,stat_end:50,stat_moral:50,stat_pop:20,stat_energy:50};
  for(const k in stats) $(k).value = stats[k];
  updateBudgetPreview();
}

// recalcular budget used total en colección
function recalcCollectionUsed(){
  if(!state.collection) return;
  state.collection.cards.forEach(c=>{
    c.budget = Math.round(computeRoleBudget(null, state.collection.scoreTotal, c.position || "GEN", c.level));
    c.budgetUsed = Object.values(c.stats||{}).reduce((s,v)=>s+v,0)*STAT_SCALE;
  });
}

// carga card y muestra presupuestos en editor
function updateBudgetPreview(){
  if(!state.collection){ $("playerBudget").textContent = "-"; $("budgetUsed").textContent="-"; return; }
  const editingId = $("btnSaveCard").dataset.editing;
  let budget = 0, used = 0;
  if(editingId){
    const c = state.collection.cards.find(x=>x.id===editingId);
    if(c){ budget = c.budget; used = c.budgetUsed; }
  } else {
    // preview for new: compute from selected position & level
    const pos = $("position").value || "GEN";
    const level = Number($("level").value||1);
    budget = Math.round(computeRoleBudget(null, state.collection.scoreTotal, pos, level));
    // compute current inputs sum
    const keys = ["stat_atk","stat_def","stat_skill","stat_disc","stat_train","stat_char","stat_spd","stat_end","stat_moral","stat_pop","stat_energy"];
    const sumStats = keys.reduce((s,k)=> s + Number($(k).value||0), 0);
    used = sumStats * STAT_SCALE;
  }
  $("playerBudget").textContent = `${Math.round(budget)}`;
  $("budgetUsed").textContent = `${Math.round(used)}`;
}

// ========== Collection management ==========
function createNewCollection(){
  const name = $("collectionName").value.trim() || `Colección ${new Date().toLocaleString()}`;
  const size = Math.max(1, Number($("collectionSize").value||10));
  const scoreTotal = Math.max(100, Number($("collectionScore").value||10000));
  state.collection = { name, size, scoreTotal, cards:[] };
  saveState(); renderCardsList(); updateHeader(); clearEditor();
  showMsg(`Colección "${name}" creada. Tamaño ${size}. Score ${scoreTotal}.`);
}

// autollenar según nivel: crea 4 básicas y el resto distribuido por posiciones aleatorias
function autofillCollection(level){
  if(!state.collection) { showMsg("Primero crea la colección"); return; }
  state.collection.cards = [];
  const basePositions = ["GK","DEF","MED","DC"];
  // create base four applying level
  basePositions.forEach((pos,i)=>{
    const name = `${pos} Base`;
    const card = createCardObject({ name, position: pos, level });
    // ensure budget-based stats
    const derived = budgetToStatsByProfile(card.budget, pos);
    card.stats = {...card.stats, ...derived};
    card.atk = card.stats.atk; card.def = card.stats.def; card.energy = card.stats.energy;
    card.budgetUsed = Object.values(card.stats).reduce((s,v)=>s+v,0)*STAT_SCALE;
    state.collection.cards.push(card);
  });
  // fill remaining positions randomly but try to balance
  const remain = Math.max(0, state.collection.size - state.collection.cards.length);
  const roles = ["GK","DEF","MED","DC"];
  for(let i=0;i<remain;i++){
    const pos = roles[Math.floor(Math.random()*roles.length)];
    const card = createCardObject({ name:`Jugador Random ${i+1}`, position:pos, level });
    const derived = budgetToStatsByProfile(card.budget, pos);
    card.stats = {...card.stats, ...derived};
    card.atk = card.stats.atk; card.def = card.stats.def; card.energy = card.stats.energy;
    card.budgetUsed = Object.values(card.stats).reduce((s,v)=>s+v,0)*STAT_SCALE;
    state.collection.cards.push(card);
  }
  recalcCollectionUsed(); saveState(); renderCardsList(); updateHeader(); clearEditor();
  showMsg(`Colección autollenada (${state.collection.cards.length} cartas).`);
}

// delete everything
function clearStorage(){
  if(!confirm("Borrar todo (localStorage)?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = { collection:null };
  updateUI();
}

// export/import
function exportCollection(){
  if(!state.collection){ showMsg("No hay colección activa"); return; }
  downloadJSON(state.collection, `${state.collection.name || "coleccion" }.json`);
}
function importCollection(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=> {
    try{
      const data = JSON.parse(reader.result);
      if(!data || !data.name) throw new Error("JSON inválido");
      state.collection = data;
      saveState(); renderCardsList(); updateHeader(); clearEditor();
      showMsg("Colección importada");
    }catch(e){ showMsg("Error importando: "+e.message); }
  };
  reader.readAsText(file);
}

// delete single card by id (already implemented above in deleteCard)

// auto-adjust attributes in editor based on budget preview
function autoAdjustEditorAttributes(){
  if(!state.collection) return;
  const pos = $("position").value || "GEN";
  const level = Number($("level").value||1);
  const budget = Math.round(computeRoleBudget(null, state.collection.scoreTotal, pos, level));
  const keys = ["stat_atk","stat_def","stat_skill","stat_disc","stat_train","stat_char","stat_spd","stat_end","stat_moral","stat_pop","stat_energy"];
  let sumStats = keys.reduce((s,k)=> s + Number($(k).value||0), 0);
  const requiredBudget = sumStats * STAT_SCALE;
  if(requiredBudget <= budget){ showMsg("Los atributos ya encajan en el presupuesto."); return; }
  const scale = budget / requiredBudget;
  keys.forEach(k=> { $(k).value = Math.max(0, Math.round(Number($(k).value||0) * scale)); });
  updateBudgetPreview();
  showMsg("Atributos ajustados proporcionalmente para encajar en el budget.");
}

// ========== bootstrap / eventos ==========
function updateUI(){
  updateHeader(); renderCardsList(); clearEditor();
}

window.addEventListener("load", ()=>{
  loadState();
  // buttons
  $("btnNewCollection").onclick = createNewCollection;
  $("btnAutoFill").onclick = ()=> autofillCollection(Number($("autoLevel").value||1));
  $("btnSaveCard").onclick = saveCardFromEditor;
  $("btnNew").onclick = clearEditor;
  $("btnDeleteCard").onclick = ()=> {
    const id = $("btnSaveCard").dataset.editing;
    if(!id) { showMsg("Nada seleccionado para eliminar"); return; }
    if(confirm("Borrar carta seleccionada?")) { deleteCard(id); }
  };
  $("btnAutoAdjust").onclick = autoAdjustEditorAttributes;
  $("btnExport").onclick = exportCollection;
  $("btnImport").onclick = ()=> $("fileImport").click();
  $("fileImport").onchange = (e)=> importCollection(e.target.files[0]);
  $("btnClearStorage").onclick = clearStorage;

  // update budget preview when inputs change
  const watched = ["position","level","stat_atk","stat_def","stat_skill","stat_disc","stat_train","stat_char","stat_spd","stat_end","stat_moral","stat_pop","stat_energy"];
  watched.forEach(id => { $(id).addEventListener("input", updateBudgetPreview); });

  // initial ui
  updateUI();
});
