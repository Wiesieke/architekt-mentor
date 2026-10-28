"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

function escapeHtml(value) {
 return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
class TextNode {
 constructor(text){this.text=String(text);}
 get outerHTML(){return escapeHtml(this.text);}
}
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.className="";}
 appendChild(child){this.children.push(child);return child;}
 set textContent(text){this.children=[new TextNode(text)];}
 get outerHTML(){
  const attrs=this.className?' class="'+escapeHtml(this.className)+'"':'';
  const keys=["href","target","rel"];
  const other=keys.filter(key=>this[key]).map(key=>' '+key+'="'+escapeHtml(this[key])+'"').join("");
  return "<"+this.tag+attrs+other+">"+this.children.map(child=>child.outerHTML).join("")+"</"+this.tag+">";
 }
}
const src=fs.readFileSync(path.join(__dirname,"../drafts.js"),"utf8");
assert.match(src,/\}\)\(\);\s*$/,"editor is an immediately invoked private module");
const instrumented=src.replace(/\}\)\(\);\s*$/,
 "globalThis.__previewTests={articleElement,exportContent,renderArticleBody};\n})();");
const fakeButton={addEventListener(){}};
const ctx={
 document:{
  createElement:tag=>new Element(tag),
  createTextNode:value=>new TextNode(value),
  querySelector:()=>({content:"test-only-csrf"}),
  getElementById:()=>fakeButton,
 },
 window:{addEventListener(){}},
 URL,
};
vm.runInNewContext(instrumented,ctx,{timeout:1000});
const {exportContent,articleElement}=ctx.__previewTests;
assert.equal(typeof exportContent,"function");

const draft={
 item_id:"a".repeat(64),draft_id:2,status:"APPROVED",
 title:"Bezpieczny artykuł <script>alert(1)</script>",
 lead_text:"Opracowanie & podsumowanie.",
 body_text:"# Wprowadzenie\nTo jest **ważne**. <img src=x onerror=alert(1)>\n\n## Lista\n- Pierwszy\n- Drugi",
 source_url:"https://github.blog/changelog/test",
 approved_by:"lh:operator",
};
const html=exportContent(draft,"html");
assert.equal(html.ext,"html");
assert.match(html.content,/<h2>Wprowadzenie<\/h2>/);
assert.match(html.content,/<h3>Lista<\/h3>/);
assert.match(html.content,/<strong>ważne<\/strong>/);
assert.match(html.content,/<li>Pierwszy<\/li>/);
assert.match(html.content,/&lt;script&gt;/);
assert.match(html.content,/&lt;img src=x onerror=alert\(1\)&gt;/);
assert.doesNotMatch(html.content,/<script>/);
assert.doesNotMatch(html.content,/lh:operator/,"private approver must not be in public export");
const markdown=exportContent(draft,"md");
assert.equal(markdown.ext,"md");
assert.match(markdown.content,/^# Bezpieczny artykuł/);
assert.match(markdown.content,/&lt;img src=x onerror=alert\(1\)&gt;/);
assert.doesNotMatch(markdown.content,/<img/);
assert.throws(()=>exportContent({...draft,status:"DRAFT"},"html"),/not_approved/);
assert.throws(()=>exportContent({...draft,draft_id:null},"md"),/not_approved/);
assert.throws(()=>exportContent(draft,"pdf"),/invalid_export/);

const noLink=articleElement({...draft,source_url:"javascript:alert(1)"},draft);
assert.doesNotMatch(noLink.outerHTML,/href=/,"unsafe URLs cannot be exported");
console.log("PASS: approved-only export, safe DOM escaping, headings, lists, private metadata exclusion");
