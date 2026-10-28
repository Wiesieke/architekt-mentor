"use strict";
(function () {
 const byId=id=>document.getElementById(id);
 const csrf=document.querySelector('meta[name="am-desk-csrf"]')?.content??"";
 const labels={DRAFT:"Szkic",IN_REVIEW:"Do akceptacji",APPROVED:"Zatwierdzony · nieopublikowany"};
 let drafts=[],current=null,writable=false,loaded=false,dirty=false,working=false;
 function node(tag,cls,text) {
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(text!==undefined)e.textContent=String(text);
  return e;
 }
 function add(parent,tag,cls,text) {
  const e=node(tag,cls,text);parent.appendChild(e);return e;
 }
 function httpsUrl(s) {
  try {const u=new URL(String(s));return u.protocol==="https:"&&!u.username&&!u.password?u.href:null;}
  catch{return null;}
 }
 function notice(message,error=false) {
  const box=byId("drafts-alert");box.textContent=message;
  box.classList.toggle("hidden",!message);box.classList.toggle("error",error);
 }
 function errorMessage(code) {
  const messages={
   login_required:"Sesja wygasła. Zaloguj się ponownie.",
   csrf_failed:"Sesja wygasła. Odśwież stronę.",
   writes_disabled:"Zapis jest wyłączony w konfiguracji LH.pl.",
   migration_004_required:"Brak odczytu szkiców. Sprawdź migrację 004 i połączenie z bazą ArchitectMentor.",
   save_unavailable:"Błąd zapisu szkicu. Sprawdź migrację 004 i ustawienia bazy.",
   revision_conflict:"W międzyczasie zmieniono szkic. Wczytaj najnowszą wersję przed ponowną edycją.",
   approved_locked:"Zatwierdzony tekst jest zablokowany. Użyj „Wznów edycję”, aby cofnąć akceptację.",
   not_in_review:"Tekst nie jest obecnie przekazany do akceptacji.",
   not_approved:"Nie można wznowić edycji tego tekstu.",
   draft_incomplete:"Do akceptacji potrzebny jest lead (min. 40 znaków), tekst (min. 150 znaków) i poprawny link źródłowy.",
   review_confirmation_required:"Zaznacz wszystkie trzy oświadczenia przed akceptacją.",
   source_link_required:"Materiał nie ma poprawnego linku HTTPS do źródła. Nie można przekazać go do akceptacji.",
   invalid_title:"Tytuł musi mieć 5–240 znaków.",
   invalid_lead:"Lead może mieć najwyżej 2000 znaków.",
   invalid_body:"Tekst może mieć najwyżej 20 000 znaków.",
   origin_forbidden:"Niedozwolone pochodzenie żądania.",
   item_not_found:"Materiał nie istnieje w Radarze.",
  };
  return messages[code]||("Operacja się nie udała ("+(code||"nieznany błąd")+").");
 }
 function setTab(which) {
  const radar=which==="radar";
  byId("radar-view").classList.toggle("hidden",!radar);
  byId("drafts-view").classList.toggle("hidden",radar);
  for(const [id,active] of [["tab-radar",radar],["tab-drafts",!radar]]) {
   const b=byId(id);b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));
  }
  if(!radar&&!loaded)void refreshList();
 }
 async function request(action,options) {
  const resp=await fetch("drafts-api.php?action="+encodeURIComponent(action)+(options?.id?"&item_id="+encodeURIComponent(options.id):""),{
   method:options?.payload?"POST":"GET",credentials:"same-origin",cache:"no-store",
   headers:options?.payload?{"Content-Type":"application/json","X-CSRF-Token":csrf}:{},
   body:options?.payload?JSON.stringify(options.payload):undefined,
  });
  let data;
  try {data=await resp.json();}
  catch{throw new Error("unreadable_response");}
  if(resp.status===401){location.assign("index.php");throw new Error("login_required");}
  if(!resp.ok||data.ok!==true)throw new Error(data.code||"request_failed");
  return data;
 }
 function renderList() {
  const root=byId("drafts-list");root.replaceChildren();
  byId("drafts-count").textContent=String(drafts.length);
  if(!drafts.length) {
   add(root,"p","muted empty","Nie ma jeszcze szkiców. W Radarze wybierz materiał i kliknij „Utwórz szkic”.");
   return;
  }
  for(const item of drafts) {
   const b=add(root,"button","item"+(current?.item_id===item.item_id?" active":""));
   b.type="button";
   add(b,"span","item-meta",item.source_id+" · "+(labels[item.status]??item.status));
   add(b,"span","item-title",item.title);
   add(b,"span","item-bottom","Wersja "+item.revision+" · "+item.updated_at_utc+" UTC");
   b.addEventListener("click",()=>void openDraft(item.item_id));
  }
 }
 async function refreshList(silent=false) {
  try {
   const data=await request("list");
   drafts=data.drafts;
   writable=data.write_enabled===true;loaded=true;
   renderList();
   if(!silent)notice("");
  } catch(e) {
   if(!silent)notice(errorMessage(e instanceof Error?e.message:"read_failed"),true);
  }
 }
 async function openDraft(id) {
  if(working)return;
  if(dirty&&!window.confirm("Masz niezapisane zmiany. Odrzucić je i otworzyć inny materiał?"))return;
  notice("");working=true;
  try {
   const data=await request("load",{id});
   current=data.draft;dirty=false;
   renderList();renderEditor();
  } catch(e) {notice(errorMessage(e instanceof Error?e.message:"load_failed"),true);}
  finally{working=false;}
 }
 function field(parent,labelText,tag,name,value,maxLength,rows=0) {
  const label=add(parent,"label","",labelText);
  const control=add(label,tag);
  control.name=name;control.value=String(value??"");control.maxLength=maxLength;
  if(rows)control.rows=rows;
  control.addEventListener("input",()=>{dirty=true;updateApprovalGuard();});
  return control;
 }
 function updateApprovalGuard() {
  const approve=byId("approve-draft");
  if(approve)approve.disabled=!writable||dirty||working||!["facts","rights","final"].every(k=>byId("confirm-"+k)?.checked);
  const banner=byId("draft-unsaved");
  if(banner)banner.textContent=dirty?"Niezapisane zmiany. Akceptacja wymaga ponownego przekazania tekstu do oceny.":"";
 }

 // Markdown is rendered through DOM text nodes only. Raw HTML is never interpreted.
 function inlineText(parent,value) {
  for(const part of String(value).split(/(\*\*[^*]+\*\*)/g)) {
   if(!part)continue;
   if(part.startsWith("**")&&part.endsWith("**"))add(parent,"strong","",part.slice(2,-2));
   else parent.appendChild(document.createTextNode(part));
  }
 }
 function renderArticleBody(parent,raw) {
  let paragraph=[],list=null,listType="";
  const flush=()=>{
   if(!paragraph.length)return;
   const p=add(parent,"p");inlineText(p,paragraph.join(" "));
   paragraph=[];
  };
  for(const line of String(raw??"").replace(/\r\n?/g,"\n").split("\n")) {
   const value=line.trim();
   if(!value){flush();list=null;listType="";continue;}
   const heading=/^(#{1,3})\s+(.+)$/.exec(value);
   if(heading) {
    flush();list=null;listType="";
    const h=add(parent,"h"+String(heading[1].length+1));
    inlineText(h,heading[2]);continue;
   }
   const marker=/^(?:([-*])|(\d+)[.)])\s+(.+)$/.exec(value);
   if(marker) {
    flush();
    const type=marker[2]?"ol":"ul";
    if(!list||listType!==type){list=add(parent,type);listType=type;}
    const li=add(list,"li");inlineText(li,marker[3]);continue;
   }
   list=null;listType="";paragraph.push(value);
  }
  flush();
 }
 function articleElement(d,values) {
  const root=node("article","export-article");
  add(root,"h1","",values.title);
  add(root,"p","article-lead",values.lead_text);
  const body=add(root,"div","article-body");
  renderArticleBody(body,values.body_text);
  const source=httpsUrl(d.source_url);
  if(source) {
   const credit=add(root,"p","source-credit");
   add(credit,"span","","Źródło pierwotne: ");
   const link=add(credit,"a","","GitHub / materiał źródłowy");
   link.href=source;link.target="_blank";link.rel="noopener noreferrer";
  }
  return root;
 }
 function makeSlug(title) {
  const clean=String(title).normalize("NFD").replace(/[\u0300-\u036f]/g,"")
   .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,65);
  return clean||"artykul";
 }
 function safeMarkdownText(value) {
  return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
 }
 function exportContent(d,format) {
  if(d.status!=="APPROVED"||!d.draft_id)throw new Error("not_approved");
  const source=httpsUrl(d.source_url);
  if(format==="html") {
   const article=articleElement(d,{title:d.title,lead_text:d.lead_text,body_text:d.body_text});
   return {content:"<!-- ArchitectMentor: ręczny eksport zatwierdzonego artykułu; bez automatycznej publikacji. -->\n"+article.outerHTML+"\n",
    type:"text/html;charset=utf-8",ext:"html"};
  }
  if(format==="md") {
   const md="# "+safeMarkdownText(d.title)+"\n\n"
    +safeMarkdownText(d.lead_text)+"\n\n"
    +safeMarkdownText(d.body_text)+"\n\n"
    +(source?"Źródło pierwotne: "+source+"\n":"");
   return {content:md,type:"text/markdown;charset=utf-8",ext:"md"};
  }
  throw new Error("invalid_export");
 }
 function downloadApproved(d,format) {
  try {
   const result=exportContent(d,format);
   const blob=new Blob([result.content],{type:result.type});
   const href=URL.createObjectURL(blob);
   const a=document.createElement("a");
   a.href=href;a.download="architectmentor-"+makeSlug(d.title)+"-"+d.item_id.slice(0,8)+"."+result.ext;
   a.style.display="none";
   document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(href),30000);
   notice("Przygotowano plik "+result.ext.toUpperCase()+". Pobieranie nie publikuje artykułu.");
  }catch(error){
   notice("Nie udało się pobrać pliku. Spróbuj ponownie lub sprawdź ustawienia przeglądarki.",true);
  }
 }
 function editorialDetails(parent,d,url) {
  const panel=add(parent,"aside","editorial-details");
  add(panel,"h3","","Metryka redakcyjna");
  const fields=[
   ["Status tekstu",labels[d.status]??d.status],
   ["Status faktów w Radarze",d.fact_check_status||"nieustalony"],
   ["Źródło w Radarze",d.source_id||"brak"],
   ["Wersja",String(d.revision)],
   ["Zatwierdził",d.approved_by||"jeszcze nie zatwierdzono"],
   ["Data akceptacji UTC",d.approved_at_utc||"—"],
  ];
  const dl=add(panel,"dl","editorial-grid");
  for(const [name,value] of fields) {
   add(dl,"dt","",name);add(dl,"dd","",value);
  }
  if(url){
   const p=add(panel,"p","source-link");
   add(p,"span","","Link źródłowy: ");
   const a=add(p,"a","","Otwórz oryginalny komunikat ↗");
   a.href=url;a.target="_blank";a.rel="noopener noreferrer";
  }
  if(d.fact_check_status!=="verified")
   add(panel,"p","muted","Uwaga: zatwierdzenie redakcyjne nie zmienia automatycznie statusu weryfikacji faktów w Radarze.");
 }
 function renderEditor() {
  const root=byId("draft-editor");root.replaceChildren();
  if(!current){add(root,"p","muted empty","Wybierz szkic lub utwórz go z materiału w Radarze.");return;}
  const d=current,approved=d.status==="APPROVED";
  const header=add(root,"header");
  add(header,"p","eyebrow","SZKICE ARTYKUŁÓW / REDAKCJA RĘCZNA");
  add(header,"h2","",d.title);
  add(header,"p","muted",labels[d.status]??d.status);
  const evidence=add(root,"div","evidence");
  add(evidence,"span","","Źródło: "+d.source_id+" · fakt-check: "+d.fact_check_status);
  const url=httpsUrl(d.source_url);
  if(url) {
   const a=add(evidence,"a","","Otwórz źródło ↗");
   a.href=url;a.target="_blank";a.rel="noopener noreferrer";
  } else add(evidence,"b","","Brak wiarygodnego adresu HTTPS");
  editorialDetails(root,d,url);
  const form=add(root,"form","draft-form");form.noValidate=true;
  const title=field(form,"Tytuł artykułu","input","title",d.title,240);
  const lead=field(form,"Lead / wprowadzenie","textarea","lead_text",d.lead_text,2000,5);
  const body=field(form,"Treść artykułu (tekst autorski)","textarea","body_text",d.body_text,20000,18);
  title.disabled=approved;lead.disabled=approved;body.disabled=approved;
  add(form,"p","muted rating-hint","Tekst wklejony z ChatGPT trzeba sprawdzić z pierwotnym źródłem. Nie kopiuj cudzych artykułów. Żaden szkic nie jest wysyłany do API AI.");
  const tip=add(form,"p","warning","Status „Zatwierdzony” oznacza wyłącznie wewnętrzną akceptację. Nie ma połączenia z systemem publikacji.");
  tip.setAttribute("role","note");
  const status=add(form,"div","editor-bottom");
  add(status,"span","muted","Wersja "+d.revision+(d.approved_by?" · zaakceptował: "+d.approved_by:""));
  const copy=add(status,"button","quiet","Kopiuj brief do ChatGPT");
  copy.type="button";
  copy.addEventListener("click",async()=>{
   const prompt=[
    "Przygotuj oryginalny, merytoryczny szkic artykułu po polsku do ArchitectMentor.",
    "Nie twierdź, że coś zostało zweryfikowane, jeśli nie wynika to ze źródła.",
    "Wyraźnie oddziel fakty od opinii i wskaż elementy wymagające ręcznego sprawdzenia.",
    "Nie kopiuj dłuższych fragmentów materiału źródłowego.",
    "Podaj: tytuł, lead (2–3 zdania), treść z nagłówkami oraz listę kwestii do weryfikacji.",
    "Temat: "+d.source_title,
    "Źródło pierwotne: "+(url||"BRAK — najpierw znajdź wiarygodne źródło"),
    "Status faktów w Radarze: "+d.fact_check_status,
    "To materiał wyłącznie do wewnętrznej oceny. Nie publikuj.",
   ].join("\n");
   try {
    await navigator.clipboard.writeText(prompt);
    notice("Brief skopiowany. Wklej go do ChatGPT, a gotowy tekst przenieś do pól szkicu.");
   }catch{notice("Schowek jest niedostępny. Skopiuj brief w przeglądarce obsługującej schowek HTTPS.",true);}
  });
  const buttons=add(form,"div","draft-actions");
  const previewBtn=add(buttons,"button","quiet","Podgląd artykułu");
  previewBtn.type="button";
  previewBtn.addEventListener("click",()=>{
   const previous=root.querySelector(".draft-preview");
   if(previous){previous.remove();previewBtn.textContent="Podgląd artykułu";return;}
   const preview=add(root,"section","draft-preview");
   add(preview,"p","eyebrow","PODGLĄD REDAKCYJNY / BEZ PUBLIKACJI");
   add(preview,"p","muted","Podgląd struktury tekstu. Ostateczny wygląd zależy od motywu WordPress.");
   if(dirty)add(preview,"p","warning","Pokazano niezapisane zmiany — przed zatwierdzeniem najpierw zapisz tekst.");
   preview.appendChild(articleElement(d,{title:title.value,lead_text:lead.value,body_text:body.value}));
   previewBtn.textContent="Zamknij podgląd";
   preview.scrollIntoView({behavior:"smooth",block:"nearest"});
  });
  for(const ctrl of [title,lead,body])ctrl.addEventListener("input",()=>{
   const previous=root.querySelector(".draft-preview");
   if(previous){previous.remove();previewBtn.textContent="Podgląd artykułu";}
  });
  if(approved) {
   for(const format of ["html","md"]) {
    const download=add(buttons,"button","quiet","Pobierz "+format.toUpperCase());
    download.type="button";
    download.addEventListener("click",()=>downloadApproved(d,format));
   }
  }else add(form,"p","muted rating-hint","Eksport HTML i Markdown będzie dostępny po ręcznej akceptacji artykułu.");
  if(!approved) {
   const save=add(buttons,"button","quiet","Zapisz szkic");save.type="button";save.disabled=!writable;
   save.addEventListener("click",()=>void saveDraft(false));
   const review=add(buttons,"button","","Przekaż do akceptacji");review.type="button";review.disabled=!writable;
   review.addEventListener("click",()=>void saveDraft(true));
  } else {
   const reopen=add(buttons,"button","quiet","Wznów edycję (cofnij akceptację)");
   reopen.type="button";reopen.disabled=!writable;
   reopen.addEventListener("click",()=>void mutate("reopen",{
    item_id:d.item_id,revision:d.revision
   },"Wznowić edycję? To cofnie poprzednią akceptację i zostanie zapisane w historii."));
  }
  if(d.status==="IN_REVIEW") {
   const section=add(form,"div","approval-panel");
   add(section,"h3","","Ręczna akceptacja redakcyjna");
   add(section,"p","muted","Przed zatwierdzeniem zweryfikuj źródła, daty, fakty i prawa do wykorzystanych treści.");
   const checks=[
    ["facts","Sprawdziłem źródło, datę i najważniejsze twierdzenia."],
    ["rights","Sprawdziłem oryginalność tekstu i prawa do wykorzystanych materiałów."],
    ["final","Przeczytałem ostateczną wersję i świadomie ją akceptuję."],
   ];
   for(const [key,label] of checks) {
    const line=add(section,"label","draft-check");
    const input=add(line,"input");input.type="checkbox";input.id="confirm-"+key;
    add(line,"span","",label);input.addEventListener("change",updateApprovalGuard);
   }
   const approve=add(section,"button","","Zatwierdź ręcznie");approve.id="approve-draft";
   approve.type="button";approve.disabled=true;
   approve.addEventListener("click",()=>void mutate("approve",{
    item_id:d.item_id,revision:d.revision,
    confirm_facts:true,confirm_rights:true,confirm_final:true
   },"Potwierdzasz ręczną akceptację ostatecznego tekstu? To NIE opublikuje artykułu."));
  }
  const unsaved=add(form,"p","save-feedback");unsaved.id="draft-unsaved";unsaved.setAttribute("role","status");
  const feedback=add(form,"p","save-feedback");feedback.id="draft-feedback";feedback.setAttribute("role","status");
  async function saveDraft(submitReview) {
   if(working||!writable)return;
   if(submitReview&&!window.confirm("Przekazać ten tekst do ręcznej akceptacji? Nie uruchamia to publikacji."))return;
   await mutate("save",{
    item_id:d.item_id,revision:d.revision,title:title.value,lead_text:lead.value,
    body_text:body.value,submit_review:submitReview,
   });
  }
  async function mutate(action,payload,confirmText) {
   if(working||!writable)return;
   if(confirmText&&!window.confirm(confirmText))return;
   working=true;notice("");
   try {
    const outcome=await request(action,{payload});
    dirty=false;
    await refreshList(true);
    const fresh=await request("load",{id:d.item_id});
    current=fresh.draft;renderList();renderEditor();
    notice(outcome.status==="APPROVED"
     ?"Szkic został ręcznie zatwierdzony. Nie opublikowano go."
     :outcome.status==="IN_REVIEW"
      ?"Szkic przekazany do ręcznej akceptacji. Nie opublikowano go."
      :"Szkic i historia zmian zostały zapisane. Nie opublikowano go.");
   } catch(e) {
    byId("draft-feedback").textContent=errorMessage(e instanceof Error?e.message:"save_unavailable");
   } finally {
    working=false;
   }
  }
  updateApprovalGuard();
 }
 byId("tab-radar").addEventListener("click",()=>setTab("radar"));
 byId("tab-drafts").addEventListener("click",()=>setTab("drafts"));
 byId("drafts-reload").addEventListener("click",()=>void refreshList());
 window.addEventListener("am:draft-from-item",e=>{
  const id=e.detail?.item_id;
  if(typeof id!=="string"||!/^[a-f0-9]{64}$/.test(id))return;
  setTab("drafts");void openDraft(id);
 });
})();
