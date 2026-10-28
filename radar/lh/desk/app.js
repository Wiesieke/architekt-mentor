"use strict";
(function(){
 const byId=id=>document.getElementById(id);
 const csrf=document.querySelector('meta[name="am-desk-csrf"]')?.content??"";
 let dataset=null,selected="",query="",filter="all",priorityFilter="all",sortMode="newest",busy=false;
 const names={UNREVIEWED:"Bez decyzji",SELECTED:"Wybrane",HOLD:"Odłożone",REJECTED:"Odrzucone",REQUEST_RESEARCH:"Do sprawdzenia"};
 const allowedDecisions=Object.keys(names),editions={none:"Brak / magazyn",daily:"Daily",weekly:"Weekly"};
 const priorities={"0":"Bez priorytetu","1":"P3 · Obserwuj","2":"P2 · Ważne","3":"P1 · Pilne"};
 const impacts={"0":"Nieoceniony","1":"1 · Niski","2":"2 · Umiarkowany","3":"3 · Istotny","4":"4 · Wysoki","5":"5 · Przełomowy"};
 function el(tag,cls,text){
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=String(text);
  return node;
 }
 function add(parent,tag,cls,text){const child=el(tag,cls,text);parent.appendChild(child);return child;}
 function option(value,label){const o=el("option","",label);o.value=value;return o;}
 function message(code){
  const map={login_required:"Sesja wygasła. Zaloguj się ponownie.",csrf_failed:"Sesja wygasła. Odśwież stronę.",writes_disabled:"Zapis jest wyłączony na LH.pl — na razie tylko odczyt.",revision_conflict:"Istnieje nowsza wersja decyzji. Odśwież listę.",read_unavailable_check_migration_002:"Brak odczytu. Sprawdź migracje 002 i 003 oraz konfigurację bazy.",save_unavailable:"Zapis niedostępny — sprawdź migrację 003 i konfigurację.",origin_forbidden:"Żądanie pochodzi z innego adresu.",item_not_found:"Materiał nie istnieje."};
  return map[code]??("Operacja się nie udała ("+(code||"błąd") +").");
 }
 function alertText(value){
  const e=byId("global-alert");e.textContent=value;e.classList.toggle("hidden",!value);
 }
 function httpsUrl(value){
  try{const u=new URL(String(value));return u.protocol==="https:"&&!u.username&&!u.password?u.href:null;}catch{return null;}
 }
 function renderQueue(){
  if(!dataset)return;
  const list=byId("itemlist");list.replaceChildren();
  const q=query.toLocaleLowerCase();
  const visible=dataset.items.filter(x=>(filter==="all"||x.decision===filter)
   &&(priorityFilter==="all"||Number(x.priority??0)===Number(priorityFilter))
   &&(String(x.title)+" "+String(x.source_id)).toLocaleLowerCase().includes(q)).slice();
  if(sortMode==="priority")visible.sort((a,b)=>Number(b.priority??0)-Number(a.priority??0)
   ||Number(b.impact_score??0)-Number(a.impact_score??0)
   ||String(b.first_seen_at_utc).localeCompare(String(a.first_seen_at_utc)));
  byId("queue-count").textContent=String(visible.length);
  if(!visible.length){add(list,"p","muted empty","Brak materiałów spełniających filtr.");return;}
  for(const item of visible){
   const btn=add(list,"button","item"+(item.item_id===selected?" active":""));
   btn.type="button";btn.setAttribute("aria-pressed",String(item.item_id===selected));
   add(btn,"span","item-meta",item.source_id+" · "+item.topic);
   add(btn,"span","item-title",item.title);
   const bottom=add(btn,"span","item-bottom");
   add(bottom,"span","item-date",String(item.published_at_utc??"Brak daty").slice(0,16)+" UTC");
   const badges=add(bottom,"span","item-flags");
   add(badges,"span","priority-pill priority-"+Number(item.priority??0),priorities[String(item.priority??0)]??priorities["0"]);
   add(badges,"em","",names[item.decision]??item.decision);
   btn.addEventListener("click",()=>{selected=item.item_id;renderQueue();renderEditor();});
  }
 }
 function chooseField(parent,title,values,current,name){
  const label=add(parent,"label","",title),select=add(label,"select");
  select.name=name;
  for(const [value,text] of Object.entries(values))select.appendChild(option(value,text));
  select.value=current in values?current:Object.keys(values)[0];
  return select;
 }
 function renderEditor(){
  const root=byId("editor");root.replaceChildren();
  const item=dataset?.items.find(x=>x.item_id===selected);
  if(!item){add(root,"p","muted empty","Wybierz materiał z kolejki.");return;}
  const header=add(root,"header");
  add(header,"p","eyebrow","RĘCZNA DECYZJA REDAKCYJNA");
  add(header,"h2","",item.title);
  add(header,"p","muted",item.source_id+" · "+item.first_seen_at_utc+" UTC");
  const evidence=add(root,"div","evidence");
  const badge=add(evidence,"span","", "Status faktów: ");
  add(badge,"b","",item.fact_check_status);
  const url=httpsUrl(item.original_url);
  if(url){const a=add(evidence,"a","","Sprawdź źródło pierwotne ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";}
  else add(evidence,"span","","Brak poprawnego linku");
  const shortcut=add(root,"div","draft-shortcut");
  const makeDraft=add(shortcut,"button","quiet","Utwórz szkic artykułu →");
  makeDraft.type="button";
  makeDraft.addEventListener("click",()=>window.dispatchEvent(new CustomEvent("am:draft-from-item",{detail:{item_id:item.item_id}})));
  const form=add(root,"form");form.id="decision-form";
  const two=add(form,"div","twocol");
  const choice=chooseField(two,"Decyzja",names,item.decision,"decision");
  const edition=chooseField(two,"Planowana edycja",editions,item.intended_edition??"none","edition");
  const ranking=add(form,"div","twocol");
  const priority=chooseField(ranking,"Priorytet redakcyjny",priorities,String(item.priority??0),"priority");
  const impact=chooseField(ranking,"Wpływ na architekturę IT",impacts,String(item.impact_score??0),"impact_score");
  add(form,"p","muted rating-hint","Ocena jest ręczna i pomaga w selekcji. Nie oznacza weryfikacji faktów ani zgody na publikację.");
  const noteLabel=add(form,"label","","Notatka redaktora");
  const textarea=add(noteLabel,"textarea");
  textarea.rows=8;textarea.maxLength=2000;
  textarea.placeholder="Ocena wpływu, źródła, zastrzeżenia, status GA/preview…";
  textarea.value=String(item.note??"");
  const bottom=add(form,"div","editor-bottom");
  add(bottom,"span","muted","Wersja "+item.revision);
  const writable=dataset?.write_enabled===true;
  const save=add(bottom,"button","",writable?"Zapisz decyzję":"Zapis wyłączony");save.type="submit";save.disabled=!writable;
  add(form,"p","warning",writable?"Zapis tworzy historię rewizji, ale nie publikuje wiadomości.":"Tryb tylko do odczytu. Włączenie zapisu wymaga świadomej zgody i testu na LH.pl.");
  const feedback=add(form,"p","save-feedback");feedback.setAttribute("role","status");
  form.addEventListener("submit",async event=>{
   event.preventDefault();if(save.disabled)return;
   save.disabled=true;save.textContent="Zapisywanie…";feedback.textContent="";
   const payload={item_id:item.item_id,revision:Number(item.revision),decision:choice.value,intended_edition:edition.value,
    priority:Number(priority.value),impact_score:Number(impact.value),note:textarea.value};
   try{
    const response=await fetch("api.php?action=decision",{method:"POST",credentials:"same-origin",cache:"no-store",
      headers:{"Content-Type":"application/json","X-CSRF-Token":csrf},body:JSON.stringify(payload)});
    const json=await response.json();
    if(response.status===401){location.assign("index.php");return;}
    if(!response.ok||json.ok!==true||typeof json.revision!=="number")throw new Error(json.code??"save_failed");
    Object.assign(item,{decision:payload.decision,intended_edition:payload.intended_edition,
     priority:payload.priority,impact_score:payload.impact_score,note:payload.note,revision:json.revision});
    renderQueue();await refresh(false);
    const updatedFeedback=byId("editor").querySelector(".save-feedback");
    if(updatedFeedback)updatedFeedback.textContent="Ocena i decyzja zapisane z historią. Publikacja nie została uruchomiona.";
   }catch(error){feedback.textContent=message(error instanceof Error?error.message:"save_failed");}
   finally{save.disabled=false;save.textContent="Zapisz decyzję";}
  });
 }
 async function refresh(resetSelection=true){
  if(busy)return;busy=true;byId("reload").disabled=true;alertText("");
  try{
   const response=await fetch("api.php?action=items",{credentials:"same-origin",cache:"no-store"});
   const data=await response.json();
   if(response.status===401){location.assign("index.php");return;}
   if(!response.ok||data.ok!==true||!Array.isArray(data.items))throw new Error(data.code??"read_failed");
   dataset=data;
   if(resetSelection||!data.items.some(x=>x.item_id===selected))selected=data.items[0]?.item_id??"";
   byId("metric-total").textContent=String(data.metrics?.total_items??"—");
   byId("metric-selected").textContent=String(data.metrics?.selected??"—");
   byId("metric-high").textContent=String(data.metrics?.high_priority??"—");
   byId("metric-last").textContent=String(data.metrics?.last_success_utc??"—");
   byId("sources-count").textContent=String(data.sources?.filter(x=>Number(x.enabled)===1).length??"—");
   renderQueue();renderEditor();
  }catch(error){alertText(message(error instanceof Error?error.message:"read_failed"));}
  finally{busy=false;byId("reload").disabled=false;}
 }
 byId("reload").addEventListener("click",()=>refresh(false));
 byId("search").addEventListener("input",event=>{query=event.target.value;renderQueue();});
 byId("filter").addEventListener("change",event=>{filter=event.target.value;renderQueue();});
 byId("priority-filter").addEventListener("change",event=>{priorityFilter=event.target.value;renderQueue();});
 byId("sort").addEventListener("change",event=>{sortMode=event.target.value;renderQueue();});
 void refresh();
})();