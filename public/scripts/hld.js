if(window.mermaid) mermaid.initialize({ startOnLoad:false, theme:"neutral", securityLevel:"strict", flowchart:{ useMaxWidth:true } });
const $ = id => document.getElementById(id);
const briefEl=$("brief"), preview=$("preview"), statusEl=$("status"), genBtn=$("genBtn");
const pdfBtn=$("pdfBtn"), docxBtn=$("docxBtn"), mdBtn=$("mdBtn");
let lastMarkdown="";
function setExportsEnabled(on){ [pdfBtn,docxBtn,mdBtn].forEach(b=>b.disabled=!on); }
function setStatus(m,c){ statusEl.textContent=m; statusEl.className="status"+(c?(" "+c):""); }
function escapeHtml(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

async function renderMarkdown(raw){
  const blocks=[];
  const stripped=raw.replace(/```mermaid\s*([\s\S]*?)```/g,(_,c)=>{ blocks.push(c.trim()); return `\n\n%%MERMAID${blocks.length-1}%%\n\n`; });
  if(!window.marked || !window.DOMPurify) throw new Error("Nie udało się załadować modułu podglądu. Odśwież stronę i spróbuj ponownie.");
  let html=window.DOMPurify.sanitize(window.marked.parse(stripped,{breaks:false}), {USE_PROFILES:{html:true}});
  html=html.replace(/(?:<p>)?\s*%%MERMAID(\d+)%%\s*(?:<\/p>)?/g,(_,i)=>`<div class="diagram"><pre class="mermaid">${escapeHtml(blocks[+i])}</pre></div>`);
  preview.innerHTML=html;
  try{ if(window.mermaid) await mermaid.run({ querySelector:"#preview .mermaid" }); }
  catch(e){ document.querySelectorAll("#preview .mermaid").forEach(el=>{ if(!el.querySelector("svg")) el.innerHTML=`<div class="render-error">Błąd składni Mermaid.\n${escapeHtml(String(e.message||e))}</div>`; }); }
}

async function generate(){
  if(genBtn.disabled) return;
  const brief=briefEl.value.trim();
  if(!brief){ setStatus("Wpisz brief po lewej.","err"); return; }
  genBtn.disabled=true; setExportsEnabled(false); lastMarkdown="";
  const startedAt=Date.now();
  const progress=()=>setStatus(`Generuję HLD… ${Math.floor((Date.now()-startedAt)/1000)} s. Pełny dokument może wymagać kilku minut. Pozostaw tę stronę otwartą.`,"run");
  progress();
  const progressTimer=setInterval(progress,1000);
  preview.innerHTML='<p class="placeholder">Generuję…</p>';
  try{
    const res=await fetch("/api/generate",{
      method:"POST",
      headers:{ "content-type":"application/json" },
      body:JSON.stringify({
        brief,
        model:$("model").value,
        mode:$("mode").value,
        diagram:$("diagram").value,
        maxTokens:parseInt($("maxTokens").value,10)||4000,
        saveHld:$("saveHld").checked
      })
    });
    clearInterval(progressTimer);
    const data=await res.json();
    if(!res.ok){ throw new Error(data.error||("HTTP "+res.status)); }
    if(!data.text || !data.text.trim()){ throw new Error("Pusta odpowiedź."); }
    lastMarkdown=data.text;
    await renderMarkdown(data.text);
    setExportsEnabled(true);
    const u=data.usage||{};
    const storageNote = data.saved === true ? ` Zapisano (ID: ${data.recordId}).` : data.saved === false ? ` Nie udało się zapisać (kod: ${data.storageCode || "unknown"}); pobierz wynik na swoje urządzenie.` : " Wynik nie został zapisany.";
    setStatus(`Gotowe. Tokeny: wejście ${u.input_tokens??"?"}, wyjście ${u.output_tokens??"?"}.` + storageNote, data.saved === false ? "err" : "");
  }catch(e){
    preview.innerHTML='<p class="placeholder">—</p>';
    setStatus("Błąd: "+String(e.message||e),"err");
  }finally{ clearInterval(progressTimer); genBtn.disabled=false; }
}
genBtn.addEventListener("click",generate);
briefEl.addEventListener("keydown",e=>{ if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){ e.preventDefault(); generate(); }});

// ---------- EKSPORT ----------
function downloadBlob(blob, name){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download=name;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 30000);
}

// SVG diagramu -> PNG dataURL (DOCX/PDF nie renderują SVG)
function svgToPng(svg, scale=2){
  return new Promise((resolve,reject)=>{
    const rect=svg.getBoundingClientRect();
    let w=rect.width, h=rect.height;
    if((!w||!h) && svg.viewBox && svg.viewBox.baseVal){ w=svg.viewBox.baseVal.width; h=svg.viewBox.baseVal.height; }
    w=Math.ceil(w||800); h=Math.ceil(h||600);
    const clone=svg.cloneNode(true);
    clone.setAttribute("width",w); clone.setAttribute("height",h);
    const xml=new XMLSerializer().serializeToString(clone);
    const url="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(xml);
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement("canvas");
      c.width=w*scale; c.height=h*scale;
      const ctx=c.getContext("2d");
      ctx.fillStyle="#fff"; ctx.fillRect(0,0,c.width,c.height);
      ctx.drawImage(img,0,0,c.width,c.height);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror=reject;
    img.src=url;
  });
}

// klon podglądu z diagramami jako PNG
async function buildExportNode(){
  const clone=preview.cloneNode(true);
  const origWraps=preview.querySelectorAll(".diagram");
  const cloneWraps=clone.querySelectorAll(".diagram");
  for(let i=0;i<origWraps.length;i++){
    const svg=origWraps[i].querySelector("svg");
    if(svg){
      try{
        const dataUrl=await svgToPng(svg);
        const img=document.createElement("img");
        img.src=dataUrl; img.style.maxWidth="100%";
        cloneWraps[i].innerHTML=""; cloneWraps[i].appendChild(img);
      }catch(_){ /* zostaw jak jest */ }
    }
  }
  return clone;
}

async function exportPdf(){
  setStatus("Składam PDF…","run");
  try{
    const node=await buildExportNode();
    const wrap=document.createElement("div");
    wrap.style.cssText="position:fixed;left:-9999px;top:0;width:800px;background:#fff;padding:24px;font-family:Arial,sans-serif;color:#222";
    wrap.appendChild(node);
    document.body.appendChild(wrap);
    if(!window.html2pdf) throw new Error("Biblioteka PDF jest niedostępna.");
    await html2pdf().set({
      margin:[10,10,12,10], filename:"HLD.pdf",
      image:{type:"jpeg",quality:0.95},
      html2canvas:{scale:2,useCORS:true,backgroundColor:"#ffffff"},
      jsPDF:{unit:"mm",format:"a4",orientation:"portrait"},
      pagebreak:{mode:["css","legacy"]}
    }).from(wrap).save();
    document.body.removeChild(wrap);
    setStatus("PDF pobrany.","");
  }catch(e){ setStatus("Błąd PDF: "+String(e.message||e),"err"); }
}

async function exportDocx(){
  setStatus("Składam DOCX…","run");
  try{
    const node=await buildExportNode();
    const css="body{font-family:Arial,sans-serif;font-size:11pt;color:#222}"
      +"h1{color:#1F3864;font-size:18pt}h2{color:#1F3864;font-size:14pt}h3{font-size:12pt}"
      +"table{border-collapse:collapse;width:100%}th{background:#1F3864;color:#fff;padding:5px;text-align:left}"
      +"td{border:1px solid #999;padding:5px}blockquote{border-left:3px solid #2E75B6;padding-left:10px;color:#333}"
      +"img{max-width:600px}";
    const html="<!DOCTYPE html><html><head><meta charset='utf-8'><style>"+css+"</style></head><body>"+node.innerHTML+"</body></html>";
    if(!window.htmlDocx) throw new Error("Biblioteka DOCX jest niedostępna.");
    const blob=window.htmlDocx.asBlob(html);
    downloadBlob(blob,"HLD.docx");
    setStatus("DOCX pobrany.","");
  }catch(e){ setStatus("Błąd DOCX: "+String(e.message||e),"err"); }
}

function exportMd(){
  downloadBlob(new Blob([lastMarkdown||""],{type:"text/markdown;charset=utf-8"}),"HLD.md");
}

pdfBtn.addEventListener("click",exportPdf);
docxBtn.addEventListener("click",exportDocx);
mdBtn.addEventListener("click",exportMd);
