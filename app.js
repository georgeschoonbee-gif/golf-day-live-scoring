
const ADMIN_PASSWORD = "Admin!";
const STORAGE_KEY = "golf_day_live_scoring_v2";

const defaultHoles = [
  [1,4,7],[2,3,17],[3,5,1],[4,4,9],[5,4,5],[6,3,15],[7,5,3],[8,4,11],[9,4,13],
  [10,4,8],[11,3,18],[12,5,2],[13,4,10],[14,4,6],[15,3,16],[16,5,4],[17,4,12],[18,4,14]
].map(([hole,par,stroke])=>({hole,par,stroke}));

const defaultState = {
  adminUnlocked:false,
  settings:{
    name:"Golf Day Championship",
    scoringType:"scramble4",
    scoresToCount:4,
    handicapAllowance:100,
    minDrives:0,
    courseId:""
  },
  courses:[],
  workingCourse:{
    id:"",
    name:"",
    holes:JSON.parse(JSON.stringify(defaultHoles))
  },
  teams:[
    {id:1,name:"Team 1",players:[
      {name:"Player 1",hcp:12},{name:"Player 2",hcp:18},{name:"Player 3",hcp:8},{name:"Player 4",hcp:22}
    ]},
    {id:2,name:"Team 2",players:[
      {name:"Player 1",hcp:10},{name:"Player 2",hcp:16},{name:"Player 3",hcp:20},{name:"Player 4",hcp:24}
    ]}
  ],
  scores:{}
};

let state = loadState();

function clone(v){return JSON.parse(JSON.stringify(v))}
function $(id){return document.getElementById(id)}

function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return clone(defaultState);
    const parsed=JSON.parse(raw);
    parsed.adminUnlocked=false;
    return parsed;
  }catch(e){ return clone(defaultState); }
}
function persist(){
  const save=clone(state);
  save.adminUnlocked=false;
  localStorage.setItem(STORAGE_KEY,JSON.stringify(save));
}
function showTab(id){
  document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(x=>x.classList.remove("active"));
  $(id).classList.add("active");
  document.querySelector(`.tab-btn[data-tab="${id}"]`).classList.add("active");
  if(id==="leaderboard") renderLeaderboard();
  if(id==="scores") renderScoreScreen();
  if(id==="admin") renderAdminGate();
}
document.querySelectorAll(".tab-btn").forEach(btn=>btn.addEventListener("click",()=>showTab(btn.dataset.tab)));

function playingHcp(h){
  return Math.round((Number(h)||0)*(Number(state.settings.handicapAllowance)||0)/100);
}
function strokesOnHole(hcp,si){
  hcp=Math.max(0,Math.round(Number(hcp)||0));
  const base=Math.floor(hcp/18);
  const extra=(hcp%18)>=si?1:0;
  return base+extra;
}
function stableford(gross,par,hcp,si){
  gross=Number(gross)||0;
  if(gross<1) return 0;
  const nett=gross-strokesOnHole(hcp,si);
  return Math.max(0,2+(par-nett));
}
function currentCourse(){
  return state.courses.find(c=>c.id===state.settings.courseId) || state.workingCourse;
}
function scoreKey(teamId,hole){return `${teamId}-${hole}`}
function getHoleScore(teamId,hole){
  return state.scores[scoreKey(teamId,hole)] || {gross:[0,0,0,0],drive:null};
}
function formatName(){
  const m={
    scramble4:"Scramble Drive + Individual IPS",
    alliance:"4-Ball Alliance",
    betterball:"Betterball Stableford",
    individual:"Individual Stableford",
    stroke:"Stroke Play",
    betterballStroke:"Betterball Stroke Play",
    texas:"Texas Scramble"
  };
  return m[state.settings.scoringType]||state.settings.scoringType;
}

function renderHome(){
  $("homeCompetition").textContent=state.settings.name;
  $("homeCourse").textContent=currentCourse()?.name || "Not selected";
  $("homeTeams").textContent=state.teams.length;
  $("homeAllowance").textContent=`${state.settings.handicapAllowance}%`;
  $("homeFormat").textContent=`${formatName()} • ${state.settings.scoresToCount} score(s) count`;
  $("eventSubtitle").textContent=currentCourse()?.name ? `${state.settings.name} • ${currentCourse().name}` : state.settings.name;
}

function refreshTeamSelect(){
  const sel=$("scoreTeam");
  const old=sel.value;
  sel.innerHTML="";
  state.teams.forEach(t=>{
    const o=document.createElement("option");
    o.value=t.id; o.textContent=t.name; sel.appendChild(o);
  });
  if([...sel.options].some(o=>o.value===old)) sel.value=old;
}
function refreshHoleSelect(){
  const sel=$("scoreHole");
  const old=sel.value;
  sel.innerHTML="";
  currentCourse().holes.forEach(h=>{
    const o=document.createElement("option");
    o.value=h.hole; o.textContent=`Hole ${h.hole}`; sel.appendChild(o);
  });
  if([...sel.options].some(o=>o.value===old)) sel.value=old;
}

function calculateHoleTeamValue(team,hole,hs){
  const type=state.settings.scoringType;
  if(type==="stroke"){
    return hs.gross.reduce((s,v)=>s+(Number(v)||0),0);
  }
  if(type==="betterballStroke"){
    const nett = team.players.map((p,i)=>{
      const g=Number(hs.gross[i])||0;
      if(!g) return 999;
      return g-strokesOnHole(playingHcp(p.hcp),hole.stroke);
    }).sort((a,b)=>a-b);
    return nett.slice(0,Math.min(2,state.settings.scoresToCount)).reduce((a,b)=>a+b,0);
  }
  if(type==="texas"){
    const valid=hs.gross.map(Number).filter(v=>v>0);
    return valid.length ? Math.min(...valid) : 0;
  }
  const pts=team.players.map((p,i)=>stableford(hs.gross[i],hole.par,playingHcp(p.hcp),hole.stroke));
  let count=Number(state.settings.scoresToCount)||4;
  if(type==="betterball") count=2;
  if(type==="individual") count=4;
  return [...pts].sort((a,b)=>b-a).slice(0,count).reduce((a,b)=>a+b,0);
}

function renderScoreScreen(){
  refreshTeamSelect();
  refreshHoleSelect();
  const team=state.teams.find(t=>String(t.id)===$("scoreTeam").value) || state.teams[0];
  if(!team) return;
  $("scoreTeam").value=team.id;
  const holeNum=Number($("scoreHole").value||1);
  const hole=currentCourse().holes[holeNum-1];
  const hs=getHoleScore(team.id,holeNum);

  $("holeTitle").textContent=`Hole ${holeNum}`;
  $("holeMeta").textContent=`Par ${hole.par} • SI ${hole.stroke}`;
  const host=$("playerScoreRows");
  host.innerHTML="";

  team.players.forEach((p,pi)=>{
    const ph=playingHcp(p.hcp);
    const pts=stableford(hs.gross[pi],hole.par,ph,hole.stroke);
    const row=document.createElement("div");
    row.className="player-row";
    row.innerHTML=`
      <div>
        <div class="player-name">${escapeHtml(p.name)}</div>
        <div class="small">Official HCP ${p.hcp} → Playing ${ph}</div>
      </div>
      <label>Gross
        <input type="number" min="1" max="20" class="grossInput" data-pi="${pi}" value="${hs.gross[pi]||""}">
      </label>
      <div>
        <div class="small">Stableford</div>
        <strong>${pts} pts</strong>
      </div>
      <label>
        <span class="small">Drive used</span>
        <select class="driveSelect" data-pi="${pi}">
          <option value="">No</option>
          <option value="${pi}" ${hs.drive===pi?"selected":""}>Yes</option>
        </select>
      </label>
    `;
    host.appendChild(row);
  });

  host.querySelectorAll(".grossInput").forEach(i=>i.addEventListener("input",e=>{
    hs.gross[Number(e.target.dataset.pi)] = Number(e.target.value)||0;
    state.scores[scoreKey(team.id,holeNum)] = hs;
    persist();
    renderScoreScreen();
  }));
  host.querySelectorAll(".driveSelect").forEach(i=>i.addEventListener("change",e=>{
    const pi=Number(e.target.dataset.pi);
    if(e.target.value!==""){
      hs.drive=pi;
      state.scores[scoreKey(team.id,holeNum)] = hs;
      persist();
      renderScoreScreen();
    } else if(hs.drive===pi){
      hs.drive=null;
      state.scores[scoreKey(team.id,holeNum)] = hs;
      persist();
      renderScoreScreen();
    }
  }));

  const val=calculateHoleTeamValue(team,hole,hs);
  const strokeMode=["stroke","betterballStroke","texas"].includes(state.settings.scoringType);
  $("holeTeamPoints").textContent=strokeMode ? `Team: ${val} strokes` : `Team: ${val} pts`;
}

function teamTotals(team){
  let total=0, thru=0;
  const strokeMode=["stroke","betterballStroke","texas"].includes(state.settings.scoringType);
  currentCourse().holes.forEach(h=>{
    const hs=getHoleScore(team.id,h.hole);
    if(hs.gross.some(v=>Number(v)>0)){
      thru=Math.max(thru,h.hole);
      total += calculateHoleTeamValue(team,h,hs);
    }
  });
  return {total,thru,strokeMode};
}
function renderLeaderboard(){
  const rows=state.teams.map(team=>({team,...teamTotals(team)}));
  const strokeMode=rows[0]?.strokeMode || false;
  $("leaderValueHeader").textContent=strokeMode ? "Strokes" : "Points";
  rows.sort((a,b)=>strokeMode ? a.total-b.total : b.total-a.total);
  const body=$("leaderboardBody");
  body.innerHTML="";
  rows.forEach((r,i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${i+1}</td><td><strong>${escapeHtml(r.team.name)}</strong></td><td>${r.thru||"-"}</td><td>${r.total}</td>`;
    body.appendChild(tr);
  });
}

function renderAdminGate(){
  $("adminLocked").classList.toggle("hidden",state.adminUnlocked);
  $("adminContent").classList.toggle("hidden",!state.adminUnlocked);
  if(state.adminUnlocked) renderAdmin();
}
function renderAdmin(){
  $("competitionName").value=state.settings.name;
  $("scoringType").value=state.settings.scoringType;
  $("scoresToCount").value=String(state.settings.scoresToCount);
  $("handicapAllowance").value=state.settings.handicapAllowance;
  $("minDrives").value=state.settings.minDrives;
  renderCourseSelect();
  renderWorkingCourse();
  renderTeamEditor();
}
function renderCourseSelect(){
  const sel=$("courseSelect");
  sel.innerHTML='<option value="">-- Unsaved / current course --</option>';
  state.courses.forEach(c=>{
    const o=document.createElement("option");
    o.value=c.id; o.textContent=c.name; sel.appendChild(o);
  });
  sel.value=state.settings.courseId||"";
}
function renderWorkingCourse(){
  const wc=state.settings.courseId
    ? clone(state.courses.find(c=>c.id===state.settings.courseId) || state.workingCourse)
    : clone(state.workingCourse);
  state.workingCourse=wc;
  $("courseName").value=wc.name||"";
  const body=$("courseEditor");
  body.innerHTML="";
  wc.holes.forEach((h,i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${h.hole}</td>
      <td><input type="number" min="3" max="6" class="holePar" data-i="${i}" value="${h.par}"></td>
      <td><input type="number" min="1" max="18" class="holeStroke" data-i="${i}" value="${h.stroke}"></td>
    `;
    body.appendChild(tr);
  });
}
function readWorkingCourseFromInputs(){
  state.workingCourse.name=$("courseName").value.trim();
  document.querySelectorAll(".holePar").forEach(i=>state.workingCourse.holes[Number(i.dataset.i)].par=Number(i.value));
  document.querySelectorAll(".holeStroke").forEach(i=>state.workingCourse.holes[Number(i.dataset.i)].stroke=Number(i.value));
}
function validateCourse(course){
  if(!course.name.trim()) return "Please enter a course name.";
  const sis=course.holes.map(h=>Number(h.stroke));
  if(sis.some(x=>x<1||x>18) || new Set(sis).size!==18) return "Stroke Index must use each number 1–18 exactly once.";
  if(course.holes.some(h=>Number(h.par)<3||Number(h.par)>6)) return "Par values must be between 3 and 6.";
  return "";
}

function renderTeamEditor(){
  const host=$("teamEditor");
  host.innerHTML="";
  state.teams.forEach((t,ti)=>{
    const card=document.createElement("div");
    card.className="team-card";
    card.innerHTML=`
      <div class="team-head">
        <input class="teamName" data-ti="${ti}" value="${escapeAttr(t.name)}">
        <button class="removeTeam secondary" data-ti="${ti}">Remove</button>
      </div>
      <div class="team-players"></div>
    `;
    const grid=card.querySelector(".team-players");
    t.players.forEach((p,pi)=>{
      const pe=document.createElement("div");
      pe.className="player-edit";
      pe.innerHTML=`
        <label>Player ${pi+1} name
          <input class="playerName" data-ti="${ti}" data-pi="${pi}" value="${escapeAttr(p.name)}">
        </label>
        <label>Official handicap
          <input type="number" class="playerHcp" data-ti="${ti}" data-pi="${pi}" value="${p.hcp}">
        </label>
        <div class="small">Playing HCP: <strong>${playingHcp(p.hcp)}</strong></div>
      `;
      grid.appendChild(pe);
    });
    host.appendChild(card);
  });

  host.querySelectorAll(".teamName").forEach(i=>i.addEventListener("input",e=>{
    state.teams[Number(e.target.dataset.ti)].name=e.target.value;
    persist(); renderHome(); refreshTeamSelect();
  }));
  host.querySelectorAll(".playerName").forEach(i=>i.addEventListener("input",e=>{
    state.teams[Number(e.target.dataset.ti)].players[Number(e.target.dataset.pi)].name=e.target.value;
    persist();
  }));
  host.querySelectorAll(".playerHcp").forEach(i=>i.addEventListener("input",e=>{
    state.teams[Number(e.target.dataset.ti)].players[Number(e.target.dataset.pi)].hcp=Number(e.target.value)||0;
    persist(); renderTeamEditor();
  }));
  host.querySelectorAll(".removeTeam").forEach(b=>b.addEventListener("click",e=>{
    if(state.teams.length<=2){ alert("At least 2 teams are required."); return; }
    state.teams.splice(Number(e.target.dataset.ti),1);
    persist(); renderTeamEditor(); refreshTeamSelect(); renderHome();
  }));
}

function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function escapeAttr(s){return escapeHtml(s)}

$("adminLogin").addEventListener("click",()=>{
  if($("adminPassword").value===ADMIN_PASSWORD){
    state.adminUnlocked=true;
    $("adminPassword").value="";
    $("adminLoginStatus").textContent="";
    renderAdminGate();
  }else{
    $("adminLoginStatus").textContent="Incorrect password.";
  }
});
$("adminPassword").addEventListener("keydown",e=>{if(e.key==="Enter") $("adminLogin").click()});
$("adminLogout").addEventListener("click",()=>{
  state.adminUnlocked=false;
  renderAdminGate();
});

$("saveSettings").addEventListener("click",()=>{
  state.settings.name=$("competitionName").value.trim()||"Golf Day";
  state.settings.scoringType=$("scoringType").value;
  state.settings.scoresToCount=Number($("scoresToCount").value)||4;
  state.settings.handicapAllowance=Math.max(0,Math.min(100,Number($("handicapAllowance").value)||0));
  state.settings.minDrives=Math.max(0,Math.min(18,Number($("minDrives").value)||0));
  state.settings.courseId=$("courseSelect").value;
  persist();
  renderHome(); renderTeamEditor(); renderScoreScreen(); renderLeaderboard();
  alert("Competition settings saved.");
});

$("courseSelect").addEventListener("change",()=>{
  const id=$("courseSelect").value;
  state.settings.courseId=id;
  if(id){
    const c=state.courses.find(c=>c.id===id);
    if(c) state.workingCourse=clone(c);
  }
  renderWorkingCourse();
});

$("newCourse").addEventListener("click",()=>{
  state.settings.courseId="";
  state.workingCourse={id:"",name:"",holes:clone(defaultHoles)};
  renderCourseSelect(); renderWorkingCourse();
  $("courseStatus").textContent="New blank course ready.";
});

$("saveCourse").addEventListener("click",()=>{
  readWorkingCourseFromInputs();
  const err=validateCourse(state.workingCourse);
  if(err){$("courseStatus").textContent=err;return;}
  let id=state.settings.courseId || state.workingCourse.id;
  if(!id) id=`course_${Date.now()}`;
  const saved={id,name:state.workingCourse.name,holes:clone(state.workingCourse.holes)};
  const idx=state.courses.findIndex(c=>c.id===id);
  if(idx>=0) state.courses[idx]=saved; else state.courses.push(saved);
  state.settings.courseId=id;
  state.workingCourse=clone(saved);
  persist();
  renderCourseSelect(); renderWorkingCourse(); renderHome(); refreshHoleSelect(); renderScoreScreen();
  $("courseStatus").textContent=`${saved.name} saved for future use on this device.`;
});

$("deleteCourse").addEventListener("click",()=>{
  const id=state.settings.courseId;
  if(!id){$("courseStatus").textContent="No saved course selected.";return;}
  const c=state.courses.find(c=>c.id===id);
  if(!confirm(`Delete ${c?.name||"this course"}?`)) return;
  state.courses=state.courses.filter(c=>c.id!==id);
  state.settings.courseId="";
  state.workingCourse={id:"",name:"",holes:clone(defaultHoles)};
  persist();
  renderCourseSelect(); renderWorkingCourse(); renderHome(); refreshHoleSelect(); renderScoreScreen();
  $("courseStatus").textContent="Course deleted.";
});

$("addTeam").addEventListener("click",()=>{
  if(state.teams.length>=18){alert("Maximum 18 teams.");return;}
  const id=Math.max(0,...state.teams.map(t=>Number(t.id)||0))+1;
  state.teams.push({id,name:`Team ${id}`,players:[1,2,3,4].map(n=>({name:`Player ${n}`,hcp:0}))});
  persist(); renderTeamEditor(); refreshTeamSelect(); renderHome();
});

$("scoringType").addEventListener("change",e=>{
  if(e.target.value==="scramble4" || e.target.value==="individual") $("scoresToCount").value="4";
  if(e.target.value==="betterball" || e.target.value==="betterballStroke") $("scoresToCount").value="2";
});
$("scoreTeam").addEventListener("change",renderScoreScreen);
$("scoreHole").addEventListener("change",renderScoreScreen);
$("prevHole").addEventListener("click",()=>{
  $("scoreHole").value=String(Math.max(1,Number($("scoreHole").value||1)-1)); renderScoreScreen();
});
$("nextHole").addEventListener("click",()=>{
  $("scoreHole").value=String(Math.min(18,Number($("scoreHole").value||1)+1)); renderScoreScreen();
});
$("saveHole").addEventListener("click",()=>{
  persist(); renderLeaderboard();
  $("saveStatus").textContent="Hole saved.";
  setTimeout(()=>$("saveStatus").textContent="",1500);
});
$("refreshLeaderboard").addEventListener("click",renderLeaderboard);

function init(){
  renderHome();
  refreshTeamSelect();
  refreshHoleSelect();
  renderScoreScreen();
  renderLeaderboard();
  renderAdminGate();
}
init();
