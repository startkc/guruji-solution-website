const CATS=[["संगीत गायन (एकल) - शास्त्रीय / उप शास्त्रीय","06.11.2026"],["संगीत गायन (समूह) - शास्त्रीय / उप शास्त्रीय","06.11.2026"],["संगीत वादन (एकल) - स्वर वाद्य","06.11.2026"],["संगीत वादन (एकल) - ताल वाद्य","06.11.2026"],["संगीत वादन (समूह) - वाद्यवृंद","06.11.2026"],["नृत्य (एकल) - शास्त्रीय","05.11.2026"],["नृत्य (समूह) - लोक / पारंपरिक / समकालीन","05.11.2026"],["नाटक (समूह) - लघु नाटिका / माइम","06.11.2026"],["दृश्य कला (एकल) - 2D चित्रकला","05 एवं 06.11.2026"],["दृश्य कला (एकल) - 3D मूर्तिकला","05 एवं 06.11.2026"],["दृश्य कला (समूह) - शिल्प / स्वदेशी खिलौने","05 एवं 06.11.2026"],["पारंपरिक कहानी वाचन (समूह)","06.11.2026"]];
const BLOCKS=["BHAGWANPUR","BIDUPUR","CHEHRAKALAN","DESARI","GORAUL","HAJIPUR","JANDAHA","LALGANJ","MAHNAR","MAHUA","PATEDHI BELSAR","PATEPUR","RAGHOPUR","RAJAPAKAR","SAHDEI BUZURG","VAISHALI"];
const API="https://zgduzappxqgxbjdzcqzd.supabase.co/functions/v1/kala-api",DB="kalaUtsav2026",STORE="entries";
let db,official="",token="",accessMode="registration",schoolSuggestions=[],participantSuggestions=[],referenceData={schools:[],participants:[]};
const $=id=>document.getElementById(id);
function openDB(){return new Promise((ok,no)=>{let q=indexedDB.open(DB,1);q.onupgradeneeded=()=>q.result.createObjectStore(STORE,{keyPath:"id"});q.onsuccess=()=>{db=q.result;ok()};q.onerror=()=>no(q.error)})}
function all(){return new Promise((ok,no)=>{let q=db.transaction(STORE).objectStore(STORE).getAll();q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)})}
function put(v){return new Promise((ok,no)=>{let q=db.transaction(STORE,"readwrite").objectStore(STORE).put(v);q.onsuccess=()=>ok();q.onerror=()=>no(q.error)})}
function del(id){return new Promise((ok,no)=>{let q=db.transaction(STORE,"readwrite").objectStore(STORE).delete(id);q.onsuccess=()=>ok();q.onerror=()=>no(q.error)})}
async function api(action,method="GET",data=null){let h={"Content-Type":"application/json"};if(token)h.Authorization="Bearer "+token;let u=API+(method==="GET"?"?action="+encodeURIComponent(action)+(data&&data.judge?"&judge="+encodeURIComponent(data.judge):""):"");let r=await fetch(u,{method,headers:h,body:method==="GET"?undefined:JSON.stringify({...data,action})});let j=await r.json().catch(()=>({error:"Invalid server response"}));if(!r.ok)throw new Error(j.error||("HTTP "+r.status));return j}
function normalizeMembers(members,names=""){if(Array.isArray(members)&&members.length)return members;return String(names||"").split(/\r?\n/).map(n=>n.trim()).filter(Boolean).map((name,i)=>({name,class:"",gender:"",leader:i===0}))}
function cloudToLocal(x){return{id:x.id,categoryIndex:x.category_index,category:x.category,date:x.event_date,type:x.entry_type,names:x.participant_names,members:normalizeMembers(x.participant_details,x.participant_names),block:x.block,school:x.school,udise:x.udise||"",schoolVerified:!!x.school_verified,schoolSource:x.school_source||"legacy",remarks:x.remarks||"",official:x.official,created:Date.parse(x.created_at)||Date.now(),synced:true}}
function localToCloud(x){return{id:x.id,category_index:x.categoryIndex,category:x.category,event_date:x.date,entry_type:x.type,participant_names:x.names,participant_details:x.members||[],school_verified:!!x.schoolVerified,school_source:x.schoolSource||"manual",block:x.block,school:x.school,udise:x.udise,remarks:x.remarks,official:x.official}}
async function refreshCloud(){if(!token||!navigator.onLine)return;let result=await api("list"),cloud=result.records||[],local=await all(),ids=new Set(local.map(x=>x.id));for(let x of cloud)if(!ids.has(x.id))await put(cloudToLocal(x));let cloudIds=new Set(cloud.map(x=>x.id));for(let x of local)if(!x.synced){if(cloudIds.has(x.id)){x.synced=true;await put(x)}else{try{await api("create","POST",{record:localToCloud(x)});x.synced=true;await put(x)}catch(e){if(!/duplicate|already exists|unique/i.test(e.message))throw e;x.synced=true;await put(x)}}}refreshConnection()}
async function loadReferenceData(){try{let r=await fetch("./kala-utsav-2026-reference-data.json?v=2",{cache:"no-store"});if(!r.ok)throw new Error("Reference data file missing in the app folder (HTTP "+r.status+")");referenceData=await r.json();if(!Array.isArray(referenceData.schools)||!Array.isArray(referenceData.participants))throw new Error("Reference data JSON format is invalid");schoolSuggestions=[...(referenceData.schools||[])];participantSuggestions=referenceData.participants||[];renderSchoolSuggestions();renderParticipantSuggestions()}catch(e){console.warn("Reference data unavailable",e)}}
async function loadSchoolSuggestions(){try{if(token&&navigator.onLine){let r=await api("schools");let cloud=r.schools||[];schoolSuggestions=[...(referenceData.schools||[]),...cloud];}renderSchoolSuggestions()}catch(e){console.warn("Cloud school suggestions unavailable",e);renderSchoolSuggestions()}}
function renderSchoolSuggestions(){let block=$("block").value.toUpperCase(),list=$("schools");list.innerHTML="";let seen=new Set();schoolSuggestions.filter(s=>!block||String(s.block).toUpperCase()===block).forEach(s=>{let key=String(s.school).toLowerCase()+"|"+s.udise;if(seen.has(key))return;seen.add(key);list.append(new Option(s.school+" — "+(s.udise||"UDISE unavailable"),s.school))})}
function renderParticipantSuggestions(){let list=$("participantSuggestions");if(!list)return;list.innerHTML="";let cat=CATS[+$("art").value]?.[0]||"",block=$("block").value.toUpperCase(),seen=new Set();participantSuggestions.filter(p=>(!p.category||p.category===cat)&&(!block||!p.block||p.block===block)).forEach(p=>String(p.names||"").split(",").map(n=>n.trim()).filter(Boolean).forEach(name=>{let key=name.toLowerCase();if(!seen.has(key)){seen.add(key);list.append(new Option(name,name))}}))}
function parsedNames(){$("participantNames").value;return $("participantNames").value.split(",").map(n=>n.trim()).filter(Boolean)}
function updateEntryType(){let isTeam=CATS[+$("art").value][0].includes("(समूह)");$("entryType").value=isTeam?"Group / Team":"Individual";$("leaderLabel").firstChild.textContent=isTeam?"Team Leader Class":"Participant Class";renderParticipantSuggestions()}
function renderMemberDetails(){}
function getMembers(){let names=parsedNames();return names.map((name,i)=>({name,class:i===0?$("leaderClass").value:"",gender:i===0?$("leaderGender").value:"",leader:i===0}))}

function updateNames(){let m=getMembers();return m.map(x=>x.name).filter(Boolean).join("\n")}
async function setOptions(){CATS.forEach((c,i)=>$("art").add(new Option(c[0],i)));BLOCKS.forEach(b=>$("block").add(new Option(b,b)));updateDates();updateEntryType()}
function updateDates(){let c=CATS[+$("art").value||0];$("eventDate").innerHTML="";(c[1].includes("एवं")?["05.11.2026","06.11.2026"]:[c[1]]).forEach(d=>$("eventDate").add(new Option(d,d)))}

const JUDGES={
"श्री विश्वजीत कुमार":"संगीत गायन","श्रीमती पूजा कुमारी":"संगीत गायन",
"श्री तारा कांत सिंह":"संगीत वादन","श्री राहुल कुमार":"संगीत वादन",
"श्रीमती सोनी कुमारी":"नृत्य","श्रीमती उर्मिला मिश्रा":"नृत्य",
"श्री उमेश कुमार प्रसाद सिंह":"नाटक","श्री संजीव कुमार शर्मा":"नाटक",
"श्रीमती ललिता भारती":"दृश्य कला","श्रीमती अर्चना कुमारी":"दृश्य कला",
"श्री अमरेश कुमार":"पारंपरिक कहानी वाचन","श्री सुधाकर कांत चक्रवर्ती":"पारंपरिक कहानी वाचन"
};
const RUBRICS={
"संगीत गायन":[["सुर",20],["लय",20],["शैली में प्रामाणिकता",20],["प्रस्तुति तकनीक",20],["लेखन / वीडियो",20]],
"संगीत वादन":[["सुर",20],["लय",20],["शैली में प्रामाणिकता",20],["प्रस्तुति तकनीक",20],["लेखन / वीडियो",20]],
"नृत्य":[["शैली में प्रामाणिकता",20],["विविधताओं में नवाचार",20],["वेशभूषा",10],["प्रस्तुति कौशल",20],["संगीत",10],["लेखन / वीडियो",20]],
"नाटक":[["विषयवस्तु",10],["संचार कौशल / अभिव्यक्ति",20],["मंच साज-सज्जा / डिजाइन",15],["पोशाक और श्रृंगार",15],["समग्र प्रस्तुति",20],["लेखन / वीडियो",20]],
"दृश्य कला":[["रचना एवं शैली",20],["मौलिकता",20],["तकनीक",20],["प्रस्तुति / कथन",20],["लेखन / वीडियो",20]],
"पारंपरिक कहानी वाचन":[["विषयवस्तु",20],["संचार कौशल / अभिव्यक्ति",20],["मंच साज-सज्जा / डिजाइन",10],["पोशाक और श्रृंगार",10],["समग्र प्रस्तुति",20],["लेखन / वीडियो",20]]
};
function judgeDiscipline(category){if(category.includes("संगीत गायन"))return "संगीत गायन";if(category.includes("संगीत वादन"))return "संगीत वादन";if(category.includes("नृत्य"))return "नृत्य";if(category.includes("नाटक"))return "नाटक";if(category.includes("दृश्य कला"))return "दृश्य कला";return "पारंपरिक कहानी वाचन"}
let selectedJudge="",selectedEntry=null,existingEvaluations=[];
async function initEvaluation(){
 const js=$("judgeSelect"),as=$("judgeArt");js.innerHTML='<option value="">Select judge</option>';
 Object.keys(JUDGES).forEach(n=>js.add(new Option(n,n)));
 if(accessMode==="evaluation"){js.value=selectedJudge;js.disabled=true;}else{js.disabled=false;}
 js.onchange=()=>{selectedJudge=js.value;as.innerHTML='<option value="">Select art form</option>';if(selectedJudge)CATS.forEach((cat,i)=>{if(judgeDiscipline(cat[0])===JUDGES[selectedJudge])as.add(new Option(cat[0],i))});$("judgeEntryList").innerHTML="";$("judgeScorePanel").hidden=true};
 as.onchange=renderJudgeEntries;
 if(accessMode==="evaluation"&&selectedJudge){js.value=selectedJudge;js.disabled=true;js.onchange();} $("exportEvaluationMarks").onclick=exportEvaluationMarks;
}
async function renderJudgeEntries(){
 const rows=await all(),idx=+$("judgeArt").value,cat=CATS[idx]?.[0];$("judgeEntryList").innerHTML="";$("judgeScorePanel").hidden=true;
 if(!cat)return;
 let ev=[];try{const x=await api("evaluation-list","GET",{judge:selectedJudge});ev=x.evaluations||[]}catch(e){$("judgeEntryList").textContent="Evaluation service not ready: "+e.message;return}
 existingEvaluations=ev;allCacheForExport=rows;
 rows.filter(x=>x.category===cat).sort((a,b)=>a.names.localeCompare(b.names)).forEach(x=>{
  const b=document.createElement("button");b.type="button";b.className="secondary";b.style.display="block";b.style.width="100%";b.style.textAlign="left";b.style.margin="8px 0";
  const done=ev.some(v=>v.registration_id===x.id&&v.judge_name===selectedJudge);
  b.textContent=(done?"✓ ":"○ ")+x.names+" — "+x.school+" ("+x.id+")";b.onclick=()=>openJudgeEntry(x);$("judgeEntryList").append(b);
 });
 if(!$("judgeEntryList").children.length)$("judgeEntryList").textContent="No registrations found in this category.";
}

function exportEvaluationMarks(){
 if(!selectedJudge){alert("Select a judge first.");return}
 if(!$("judgeArt").value && $("judgeArt").value!=="0"){alert("Select an art category first.");return}
 if(!existingEvaluations.length){alert("No evaluation marks are available to export for this category yet.");return}
 const headers=["Registration ID","Judge","Category","Discipline","Participant / Team","Block","School","Criterion","Marks","Maximum Marks","Total","Remarks"];
 const rows=[];
 const registrations=allCacheForExport||[];
 existingEvaluations.forEach(ev=>{
  const reg=registrations.find(x=>x.id===ev.registration_id)||{};
  const rubric=RUBRICS[ev.discipline]||[];
  rubric.forEach((item,i)=>rows.push([ev.registration_id,ev.judge_name,ev.category,ev.discipline,reg.names||"",reg.block||"",reg.school||"",item[0],ev.scores?.[i]??"",item[1],ev.total,ev.remarks||""]));
 });
 const csv=[headers,...rows].map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");
 download("Kala_Utsav_Evaluation_"+selectedJudge.replace(/[^\\p{L}\\p{N}]+/gu,"_")+".csv","\\ufeff"+csv,"text/csv;charset=utf-8");
}
let allCacheForExport=[];
async function openJudgeEntry(x){
 selectedEntry=x;const discipline=judgeDiscipline(x.category),rubric=RUBRICS[discipline];$("judgeScorePanel").hidden=false;
 $("judgeEntryTitle").textContent=x.names;$("judgeEntryMeta").textContent=x.category+" • "+x.block+" • "+x.school+" • "+x.id;
 const old=existingEvaluations.find(v=>v.registration_id===x.id&&v.judge_name===selectedJudge);
 $("judgeCriteria").innerHTML="";
 rubric.forEach(([name,max],i)=>{const label=document.createElement("label");label.textContent=name+" (अधिकतम "+max+")";const input=document.createElement("input");input.type="number";input.min=0;input.max=max;input.step=1;input.required=true;input.id="judgeMark"+i;input.value=old?.scores?.[i]??"";input.dataset.max=max;label.append(input);$("judgeCriteria").append(label)});
 $("judgeRemarks").value=old?.remarks||"";$("evaluationMsg").textContent=old?"Existing evaluation loaded. You may edit and save.":"New evaluation.";
}
$("saveEvaluation").onclick=async()=>{
 if(!selectedJudge||!selectedEntry)return;
 const discipline=judgeDiscipline(selectedEntry.category),rubric=RUBRICS[discipline],scores=[];
 for(let i=0;i<rubric.length;i++){const v=$("judgeMark"+i).value,n=Number(v);if(v===""||!Number.isInteger(n)||n<0||n>rubric[i][1])return alert(rubric[i][0]+": enter a whole number from 0 to "+rubric[i][1]);scores.push(n)}
 const total=scores.reduce((a,b)=>a+b,0);
 try{await api("evaluation-save","POST",{registration_id:selectedEntry.id,judge_name:selectedJudge,category:selectedEntry.category,discipline,scores,total,remarks:$("judgeRemarks").value});$("evaluationMsg").textContent="Saved successfully. Total: "+total+"/100";await renderJudgeEntries();openJudgeEntry(selectedEntry)}catch(e){alert("Evaluation save failed: "+e.message)}
};

function showTab(n){document.querySelectorAll(".view").forEach(x=>x.hidden=x.id!==n);document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===n));if(n==="records")renderRecords();if(n==="evaluation")initEvaluation();if(n==="adminAudit")renderAuditLog();if(n==="adminResults")renderAdminResults();if(n==="summary")renderSummary()}
async function renderRecords(){let rows=await all(),q=$("search").value.toLowerCase();$("recordRows").innerHTML="";rows.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).sort((a,b)=>b.created-a.created).forEach(x=>{let tr=document.createElement("tr");[x.id,x.category,x.date,x.type+": "+(x.names||"" ).replace(/\n/g,", "),x.block,x.school,x.official+(x.synced?"":" • Pending sync")].forEach(v=>{let td=document.createElement("td");td.textContent=v;tr.append(td)});let td=document.createElement("td"),btn=document.createElement("button");btn.textContent="Delete";btn.className="secondary";btn.onclick=async()=>{if(!confirm("Delete this entry?"))return;if(x.synced&&navigator.onLine){try{await api("delete","POST",{id:x.id})}catch(e){return alert("Cloud delete failed: "+e.message)}}await del(x.id);renderRecords()};td.append(btn);tr.append(td);$("recordRows").append(tr)})}
async function renderSummary(){let rows=await all();$("stats").innerHTML="";[[rows.length,"Entries"],[new Set(rows.map(x=>x.block)).size,"Blocks"],[rows.reduce((n,x)=>n+(x.members||normalizeMembers([],x.names)).length,0),"Named participants"]].forEach(([n,l])=>{let d=document.createElement("div");d.className="stat";let b=document.createElement("b");b.textContent=n;d.append(b,document.createTextNode(l));$("stats").append(d)});$("categoryRows").innerHTML="";CATS.forEach((c,i)=>{let a=rows.filter(x=>x.categoryIndex===i),tr=document.createElement("tr");[c[0],c[1],a.length,a.reduce((n,x)=>n+(x.members||normalizeMembers([],x.names)).length,0)].forEach(v=>{let td=document.createElement("td");td.textContent=v;tr.append(td)});$("categoryRows").append(tr)});let b={};rows.forEach(x=>b[x.block]=(b[x.block]||0)+1);$("blockSummary").textContent=Object.entries(b).sort((a,b)=>b[1]-a[1]).map(x=>x[0]+": "+x[1]).join(" • ")||"No registrations yet"}
function download(n,c,t){let a=document.createElement("a"),u=URL.createObjectURL(new Blob([c],{type:t}));a.href=u;a.download=n;a.click();URL.revokeObjectURL(u)}

let adminResultRows=[];
async function renderAdminResults(){
 try{
  const r=await api("admin-results"), regs=r.registrations||[], evs=r.evaluations||[];
  const byReg=new Map();
  evs.forEach(e=>{if(!byReg.has(e.registration_id))byReg.set(e.registration_id,[]);byReg.get(e.registration_id).push(e)});
  const rows=regs.map(reg=>{
   const discipline=judgeDiscipline(reg.category||"");
   const judges=Object.keys(JUDGES).filter(n=>JUDGES[n]===discipline);
   const scores=judges.map(n=>(byReg.get(reg.id)||[]).find(e=>e.judge_name===n));
   const complete=scores.length===2&&scores.every(Boolean);
   const avg=complete?(Number(scores[0].total)+Number(scores[1].total))/2:null;
   return {reg,discipline,judges,scores,complete,avg,rank:null};
  });
  const categories=[...new Set(rows.map(x=>x.reg.category))];
  categories.forEach(cat=>{
   const ranked=rows.filter(x=>x.reg.category===cat&&x.complete).sort((a,b)=>b.avg-a.avg);
   let last=null,rank=0;
   ranked.forEach((x,i)=>{if(last===null||x.avg!==last)rank=i+1;x.rank=rank;last=x.avg});
  });
  adminResultRows=rows;
  const body=$("adminResultRows");body.innerHTML="";
  rows.sort((a,b)=>String(a.reg.category).localeCompare(String(b.reg.category))||(a.rank||9999)-(b.rank||9999)||String(a.reg.participant_names).localeCompare(String(b.reg.participant_names))).forEach(x=>{
   const tr=document.createElement("tr");
   const vals=[x.reg.id,x.reg.category,x.reg.block,x.reg.school,x.reg.participant_names,x.judges[0]||"—",x.scores[0]?.total??"Pending",x.judges[1]||"—",x.scores[1]?.total??"Pending",x.complete?x.avg.toFixed(2):"Pending (2/2 required)",x.rank??"—"];
   vals.forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.append(td)});
   body.append(tr);
  });
  if(!rows.length)body.innerHTML='<tr><td colspan="11">No registrations found.</td></tr>';
  $("adminResultsStatus").textContent=rows.length+" registrations • "+evs.length+" judge evaluations • Rank calculated only when both assigned judges have submitted marks.";
 }catch(e){alert("Could not load admin results: "+e.message)}
}
function csvCell(v){return '"'+String(v??"").replace(/"/g,'""')+'"'}
function exportAdminSummary(){
 const headers=["Registration ID","Category","Block","School","Participant / Team","Judge 1","Judge 1 Total","Judge 2","Judge 2 Total","Average (2 judges)","Category Rank","Evaluation Status"];
 const rows=adminResultRows.map(x=>[x.reg.id,x.reg.category,x.reg.block,x.reg.school,x.reg.participant_names,x.judges[0]||"",x.scores[0]?.total??"",x.judges[1]||"",x.scores[1]?.total??"",x.avg??"",x.rank??"",x.complete?"Complete":"Pending"]);
 download("Kala_Utsav_Category_Rankings.csv","\\ufeff"+[headers,...rows].map(r=>r.map(csvCell).join(",")).join("\\r\\n"),"text/csv;charset=utf-8");
}
function exportAdminDetailed(){
 const headers=["Registration ID","Category","Block","School","Participant / Team","Judge","Discipline","Criterion","Marks","Maximum Marks","Total","Remarks","Updated At"];
 const rows=[];
 adminResultRows.forEach(x=>x.scores.forEach(ev=>{if(!ev)return;(RUBRICS[ev.discipline]||[]).forEach((criterion,i)=>rows.push([x.reg.id,x.reg.category,x.reg.block,x.reg.school,x.reg.participant_names,ev.judge_name,ev.discipline,criterion[0],ev.scores?.[i]??"",criterion[1],ev.total,ev.remarks||"",ev.updated_at||""]))}));
 download("Kala_Utsav_Detailed_Evaluation_Marks.csv","\\ufeff"+[headers,...rows].map(r=>r.map(csvCell).join(",")).join("\\r\\n"),"text/csv;charset=utf-8");
}
$("refreshAdminResults").onclick=renderAdminResults;
$("exportAdminSummary").onclick=exportAdminSummary;
$("exportAdminDetailed").onclick=exportAdminDetailed;
\nasync function renderAuditLog(){try{const r=await api("audit-list");const rows=r.audit||[];$("auditRows").innerHTML="";rows.forEach(x=>{const tr=document.createElement("tr");[new Date(x.changed_at).toLocaleString("en-IN"),x.judge_name,x.registration_id,x.category,x.action==="EDIT"?"Edited":"First save",x.old_total??"—",x.new_total,JSON.stringify(x.old_scores??"—"),JSON.stringify(x.new_scores),x.new_remarks||""].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.append(td)});$("auditRows").append(tr)});if(!rows.length)$("auditRows").innerHTML="<tr><td colspan=\"10\">No audit records yet.</td></tr>"}catch(e){alert("Could not load audit log: "+e.message)}}
$("refreshAudit").onclick=renderAuditLog;
function chooseAccess(mode){
 accessMode=mode;$("home").hidden=true;$("login").hidden=false;$("app").hidden=true;
 const evalMode=mode==="evaluation",adminMode=mode==="admin";
 $("loginHeading").textContent=adminMode?"Admin Audit Access":evalMode?"Judge Evaluation Access":"Registration Access";$("pinLabel").firstChild.textContent=adminMode?"Admin PIN":evalMode?"Judge PIN":"Shared PIN";
 $("loginDescription").textContent=adminMode?"Enter the separate six-digit Admin PIN to view score edit history.":evalMode?"Select your name and enter your individual six-digit Judge PIN.":"Enter the shared six-digit PIN and select your registration official.";
 $("operator").parentElement.style.display=evalMode||adminMode?"none":"";$("judgeLoginField").hidden=!evalMode;$("judgeLoginField").style.display=evalMode?"block":"none";$("backHome").hidden=false;
}
$("openRegistration").onclick=()=>chooseAccess("registration");
$("openEvaluation").onclick=()=>chooseAccess("evaluation");
$("openAdmin").onclick=()=>chooseAccess("admin");
$("backHome").onclick=()=>{$("login").hidden=true;$("app").hidden=true;$("home").hidden=false};
$("loginBtn").onclick=async()=>{official=$("operator").value;let pin=$("pin").value.trim();if(accessMode==="registration"&&!official)return alert("Select registration official");if(accessMode==="evaluation"&&!$("judgeLoginSelect").value)return alert("Select your judge name");if(!/^\d{6}$/.test(pin))return alert("Enter the six-digit PIN");$("loginBtn").disabled=true;try{const loginAction=accessMode==="admin"?"admin-login":accessMode==="evaluation"?"judge-login":"login";let r=await api(loginAction,"POST",{pin,judge_name:$("judgeLoginSelect").value});token=r.token;if(accessMode==="evaluation")selectedJudge=r.judge_name;sessionStorage.setItem("kalaSession",token);$("pin").value="";$("login").hidden=true;$("home").hidden=true;$("app").hidden=false;$("welcome").textContent=accessMode==="admin"?"Admin Audit Access":accessMode==="evaluation"?"Judge Evaluation Access":"Registration official: "+official;document.querySelectorAll(".tab").forEach(b=>{const ev=b.dataset.tab==="evaluation",ad=b.dataset.tab==="adminAudit",ar=b.dataset.tab==="adminResults";b.hidden=accessMode==="admin"?!(ad||ar):accessMode==="evaluation"?!ev:(ev||ad||ar)});if(accessMode==="admin")showTab("adminResults");else if(accessMode==="evaluation")showTab("evaluation");else showTab("register");if(accessMode==="registration"){await refreshCloud();await loadSchoolSuggestions()}refreshConnection()}catch(e){alert("Login failed: "+e.message)}finally{$("loginBtn").disabled=false}};
$("logout").onclick=()=>{token="";sessionStorage.removeItem("kalaSession");$("app").hidden=true;$("login").hidden=true;$("home").hidden=false;$("operator").parentElement.style.display="";$("judgeLoginSelect").value="";$("judgeLoginSelect").disabled=false;selectedJudge="";document.querySelectorAll(".tab").forEach(b=>b.hidden=b.dataset.tab==="adminAudit")};
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));$("art").onchange=()=>{updateDates();updateEntryType()};$("block").onchange=()=>{renderSchoolSuggestions();renderParticipantSuggestions()};$("school").onchange=()=>{let match=schoolSuggestions.find(s=>s.school.toLowerCase()===$("school").value.trim().toLowerCase()&&String(s.block).toUpperCase()===$("block").value.toUpperCase());if(match&&match.udise){$("udise").value=String(match.udise);$("schoolHint").textContent="UDISE auto-filled from reference list. Please verify."}else{$("udise").value="";$("schoolHint").textContent="School details are unverified. Check spelling and UDISE before saving."}};
$("participantNames").oninput=()=>{let typed=$("participantNames").value.trim().toLowerCase();let match=participantSuggestions.find(p=>String(p.names||"").trim().toLowerCase()===typed&&(!p.category||p.category===CATS[+$("art").value][0]));if(match){if(match.block)$("block").value=match.block;renderSchoolSuggestions();if(match.school)$("school").value=match.school;if(match.udise)$("udise").value=String(match.udise);if(match.class&&["9","10","11","12"].includes(String(match.class)))$("leaderClass").value=String(match.class);if(match.gender){let g=String(match.gender).toUpperCase();$("leaderGender").value=g==="BOY"||g==="MALE"?"Male":g==="GIRL"||g==="FEMALE"?"Female":"Other"}$("schoolHint").textContent="Matched previous registration reference. Please verify details."}};
$("regForm").onsubmit=async e=>{e.preventDefault();let members=getMembers(),udise=$("udise").value.trim();if(!members.length)return alert("Enter participant name(s), separated by commas for a team.");if(!$("leaderClass").value||!$("leaderGender").value)return alert("Please enter class and gender of the participant/team leader.");if(![9,10,11,12].includes(+$("leaderClass").value))return alert("Class must be 9, 10, 11 or 12.");if(udise&&!/^\d{11}$/.test(udise))return alert("UDISE must contain exactly 11 digits, or leave it blank if unavailable.");if($("entryType").value==="Individual"&&members.length!==1)return alert("This is an individual event. Enter exactly one participant name.");if($("entryType").value==="Group / Team"&&members.length<2)return alert("This is a group/team event. Enter at least two names separated by commas.");let id="KU26-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,6).toUpperCase(),schoolMatch=schoolSuggestions.find(s=>s.school.toLowerCase()===$("school").value.trim().toLowerCase()&&String(s.block).toUpperCase()===$("block").value.toUpperCase());let x={id,categoryIndex:+$("art").value,category:CATS[+$("art").value][0],date:$("eventDate").value,type:$("entryType").value,names:members.map(m=>m.name).join(", "),members,block:$("block").value,school:$("school").value.trim(),udise,schoolVerified:false,schoolSource:schoolMatch?(schoolMatch.source||"suggestion"):"manual",remarks:$("remarks").value.trim(),official,created:Date.now(),synced:false};await put(x);if(navigator.onLine&&token){try{await api("create","POST",{record:localToCloud(x)});x.synced=true;await put(x);if(!schoolMatch)try{await api("school-add","POST",{block:x.block,school:x.school,udise:x.udise})}catch(err){console.warn("New school suggestion save pending",err)}alert("Registration saved to shared cloud database. ID: "+id)}catch(err){alert("Saved on this device; cloud sync pending: "+err.message)}}else alert("Saved offline on this device. It will sync after internet returns and session is valid. ID: "+id);$("regForm").reset();$("participantNames").value="";$("leaderClass").value="";$("leaderGender").value="";updateDates();updateEntryType();refreshConnection()};
$("search").oninput=renderRecords;
$("exportJson").onclick=async()=>download("kala-utsav-2026-backup.json",JSON.stringify(await all(),null,2),"application/json");
$("exportCsv").onclick=async()=>{let r=await all(),c=["id","category","date","type","names","members","block","school","udise","remarks","official","created","synced"],q=v=>'"'+String(typeof v==="object"?JSON.stringify(v):v??"").replace(/"/g,'""')+'"';download("kala-utsav-2026.csv",[c.join(","),...r.map(x=>c.map(k=>q(x[k])).join(","))].join("\n"),"text/csv")};
$("importJson").onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let a=JSON.parse(await f.text()),n=0,old=new Set((await all()).map(x=>x.id));for(let x of a)if(!old.has(x.id)){x.members=normalizeMembers(x.members,x.names);x.synced=false;await put(x);n++}if(token&&navigator.onLine)await refreshCloud();$("backupMsg").textContent=n+" new records imported; duplicates skipped."}catch(err){$("backupMsg").textContent="Import/sync issue: "+err.message}e.target.value=""};
$("syncNow").onclick=async()=>{try{await refreshCloud();await loadSchoolSuggestions();$("backupMsg").textContent="Cloud sync completed."}catch(e){$("backupMsg").textContent="Sync pending: "+e.message}};
function refreshConnection(){$("connection").textContent=(navigator.onLine?"Online":"Offline")+" • "+(token?"shared cloud session":"local mode");$("syncNow").disabled=!token||!navigator.onLine}
window.addEventListener("online",async()=>{refreshConnection();try{await refreshCloud();await loadSchoolSuggestions()}catch(e){console.warn(e)}});
$("participantLookup").onchange=()=>{let name=$("participantLookup").value.trim();if(!name)return;let current=parsedNames();if(!current.some(x=>x.toLowerCase()===name.toLowerCase()))current.push(name);$("participantNames").value=current.join(", ");$("participantLookup").value="";$("participantNames").focus();let match=participantSuggestions.find(p=>String(p.names||"").split(",").some(n=>n.trim().toLowerCase()===name.toLowerCase())&&(!p.category||p.category===CATS[+$("art").value][0]));if(match){if(match.block)$("block").value=match.block;renderSchoolSuggestions();if(match.school)$("school").value=match.school;if(match.udise)$("udise").value=String(match.udise);if(match.class&&["9","10","11","12"].includes(String(match.class)))$("leaderClass").value=String(match.class);if(match.gender){let g=String(match.gender).toUpperCase();$("leaderGender").value=g==="BOY"||g==="MALE"?"Male":g==="GIRL"||g==="FEMALE"?"Female":"Other"}$("schoolHint").textContent="Previous registration match found. Please verify details."}};
window.addEventListener("offline",refreshConnection);
(async()=>{await openDB();await setOptions();await loadReferenceData();if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});refreshConnection()})();