"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
type Decision="UNREVIEWED"|"SELECTED"|"HOLD"|"REJECTED"|"REQUEST_RESEARCH";
type Edition="none"|"daily"|"weekly";
type Item={item_id:string;source_id:string;title:string;original_url:string;published_at_utc:string|null;first_seen_at_utc:string;topic:string;fact_check_status:string;decision:Decision;intended_edition:Edition;note:string;revision:number};
type Source={source_id:string;display_name:string;enabled:number;rights_gate:string};
type Payload={ok:true;generated_at_utc:string;metrics:{total_items:number;selected:number;last_success_utc:string|null};items:Item[];sources:Source[]};
function safeLink(value:string):string|null{try{const u=new URL(value);return u.protocol==="https:"?u.href:null;}catch{return null;}}
function friendlyError(value:string):string{const msgs:Record<string,string>={revision_conflict:"Ktoś zapisał już nowszą wersję. Odśwież listę.",writes_disabled:"Zapis jest wyłączony na serwerze LH.pl.",write_not_configured:"Brakuje konfiguracji zapisu API.",forbidden:"Nie masz uprawnień do tej operacji.",upstream_unavailable:"Brak łączności z API LH.pl."};return msgs[value]??"Nie udało się wykonać operacji ("+value+").";}
export function Desk(){
 const [data,setData]=useState<Payload|null>(null);
 const [busy,setBusy]=useState(false);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [selected,setSelected]=useState("");
 const [filter,setFilter]=useState<Decision|"all">("all");
 const [query,setQuery]=useState("");
 const [decision,setDecision]=useState<Decision>("UNREVIEWED");
 const [edition,setEdition]=useState<Edition>("none");
 const [note,setNote]=useState("");
 const refresh=useCallback(async()=>{
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/items",{cache:"no-store"});
   const json=await r.json() as Payload & {code?:string};
   if(!r.ok||json.ok!==true||!Array.isArray(json.items))throw new Error(json.code??"read_failed");
   setData(json);setSelected(old=>old||json.items[0]?.item_id||"");
  }catch(e){setError(friendlyError(e instanceof Error?e.message:"read_failed"));}
  finally{setBusy(false);}
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 const item=useMemo(()=>data?.items.find(v=>v.item_id===selected)??null,[data,selected]);
 useEffect(()=>{if(!item)return;setDecision(item.decision);setEdition(item.intended_edition??"none");setNote(item.note??"");setNotice("");},[item?.item_id]);
 const visible=(data?.items??[]).filter(v=>(filter==="all"||v.decision===filter)&&(v.title+" "+v.source_id).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 async function save(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!item||saving)return;
  setSaving(true);setNotice("");
  try{
   const r=await fetch("/api/decisions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({item_id:item.item_id,revision:Number(item.revision),decision,intended_edition:edition,note})});
   const response=await r.json() as {ok?:boolean;code?:string;revision?:number};
   if(!r.ok||response.ok!==true||typeof response.revision!=="number")throw new Error(response.code??"save_failed");
   setData(old=>old?{...old,items:old.items.map(x=>x.item_id===item.item_id?{...x,decision,intended_edition:edition,note,revision:response.revision!}:x)}:old);
   setNotice("Decyzja zapisana z historią zmian. Publikacja nie została uruchomiona.");
  }catch(ex){setNotice(friendlyError(ex instanceof Error?ex.message:"save_failed"));}
  finally{setSaving(false);}
 }
 return <main className="shell">
  <section className="intro"><div><p className="eyebrow">ARCHITEKTURA W RUCHU / PRIVATE REVIEW</p><h1>Radar decyzji</h1><p>Wiadomości technologiczne to kandydaci do analizy. Wybór materiału nie oznacza weryfikacji faktów ani zgody na publikację.</p></div><button className="quiet" disabled={busy} onClick={()=>void refresh()}>{busy?"Ładowanie…":"Odśwież dane"}</button></section>
  {error?<div className="notice error" role="alert">{error}</div>:null}
  <div className="stats"><div><small>Pozycje w radarze</small><strong>{data?.metrics.total_items??"—"}</strong></div><div><small>Wybrane do analizy</small><strong>{data?.metrics.selected??"—"}</strong></div><div><small>Ostatnie pobranie UTC</small><strong className="date">{data?.metrics.last_success_utc??"—"}</strong></div></div>
  <div className="workspace"><section className="queue"><header><h2>Kolejka materiałów <span>{visible.length}</span></h2><p>Wyniki z niezależnej bazy ArchitectMentor</p></header><div className="filters"><input aria-label="Szukaj materiału" placeholder="Szukaj tematu lub źródła" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Filtr decyzji" value={filter} onChange={e=>setFilter(e.target.value as Decision|"all")}><option value="all">Wszystkie decyzje</option><option value="UNREVIEWED">Bez decyzji</option><option value="SELECTED">Wybrane</option><option value="HOLD">Odłożone</option><option value="REQUEST_RESEARCH">Do sprawdzenia</option><option value="REJECTED">Odrzucone</option></select></div><div className="itemlist">{visible.length?visible.map(v=><button type="button" aria-pressed={selected===v.item_id} className={"item "+(selected===v.item_id?"active":"")} onClick={()=>setSelected(v.item_id)} key={v.item_id}><span className="item-meta">{v.source_id} · {v.topic}</span><span className="item-title">{v.title}</span><span className="item-bottom">{v.published_at_utc?.slice(0,16)??"Brak daty"} UTC <em>{v.decision}</em></span></button>):<p className="empty">Brak materiałów spełniających filtr.</p>}</div></section>
  <section className="editor">{item?<><header><p className="eyebrow">RĘCZNA DECYZJA REDAKCYJNA</p><h2>{item.title}</h2><p>{item.source_id} · {item.first_seen_at_utc} UTC</p></header><div className="evidence"><span>Status faktów: <b>{item.fact_check_status}</b></span>{safeLink(item.original_url)?<a target="_blank" rel="noopener noreferrer" href={safeLink(item.original_url)??undefined}>Sprawdź źródło pierwotne ↗</a>:<span>Brak poprawnego linku</span>}</div><form onSubmit={save}><div className="twocol"><label>Decyzja<select value={decision} onChange={e=>setDecision(e.target.value as Decision)}><option value="UNREVIEWED">Bez decyzji</option><option value="SELECTED">Wybierz do analizy</option><option value="HOLD">Odłóż</option><option value="REQUEST_RESEARCH">Zleć sprawdzenie</option><option value="REJECTED">Odrzuć</option></select></label><label>Planowana edycja<select value={edition} onChange={e=>setEdition(e.target.value as Edition)}><option value="none">Brak / magazyn</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label></div><label>Notatka redaktora<textarea rows={8} maxLength={2000} placeholder="Ocena wpływu na architekturę, status GA/preview, region, źródła i wątpliwości…" value={note} onChange={e=>setNote(e.target.value)}/></label><div className="editor-bottom"><span>Wersja {item.revision}</span><button disabled={saving}>{saving?"Zapisywanie…":"Zapisz decyzję"}</button></div><p className="warning">Zapis tworzy ślad audytowy; nie tworzy artykułu, newslettera ani publikacji.</p><p className="notice" role="status">{notice}</p></form></>:<div className="empty">Wybierz materiał z kolejki. Dane źródłowe muszą być najpierw dostępne z LH.pl.</div>}</section></div>
  <footer>ArchitectMentor Radar · wyłącznie panel wewnętrzny · {data?.sources.filter(s=>Number(s.enabled)===1).length??"—"} aktywnych źródeł</footer>
 </main>;
}
