
const SUPABASE_URL = "https://nozjqxuxfvwweatqerpq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_DZjClCBchJgK-WWHx_Zo5g_0rWmnmgN";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const defaultHoles = [
  [1,4,7],[2,3,17],[3,5,1],[4,4,9],[5,4,5],[6,3,15],[7,5,3],[8,4,11],[9,4,13],
  [10,4,8],[11,3,18],[12,5,2],[13,4,10],[14,4,6],[15,3,16],[16,5,4],[17,4,12],[18,4,14]
].map(([hole,par,stroke])=>({hole,par,stroke}));

const adminDraft = {
  id:null,
  name:"Golf Day Championship",
  scoring_type:"scramble4",
  scores_to_count:4,
  handicap_allowance:100,
  min_drives:0,
  course:{id:null,name:"",holes:structuredClone(defaultHoles)},
  teams:[
    {name:"Team 1",captain_name:"Player 1",captain_password:"",players:[
      {player_order:1,name:"Player 1",handicap:12},
      {player_order:2,name:"Player 2",handicap:18},
      {player_order:3,name:"Player 3",handicap:8},
      {player_order:4,name:"Player 4",handicap:22}
    ]},
    {name:"Team 2",captain_name:"Player 1",captain_password:"",players:[
      {player_order:1,name:"Player 1",handicap:10},
      {player_order:2,name:"Player 2",handicap:16},
      {player_order:3,name:"Player 3",handicap:20},
      {player_order:4,name:"Player 4",handicap:24}
    ]}
  ]
};

let bundle = null;
let scores = [];
let adminUnlocked = false;
let adminPasswordSession = "";
let captainSession = null; // {teamId, teamName, password}

const $=id=>document.getElementById(id);

function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function escAttr(s){return esc(s)}

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

function formatName(){
  if(!bundle) return "—";
  const m={
    scramble4:"Scramble Drive + Individual IPS",
    alliance:"4-Ball Alliance",
    betterball:"Betterball Stableford",
    individual:"Individual Stableford",
    stroke:"Stroke Play",
    betterballStroke:"Betterball Stroke Play",
    texas:"Texas Scramble"
  };
  return m[bundle.tournament.scoring_type]||bundle.tournament.scoring_type;
}

function playingHcp(h){
  const allowance=Number(bundle?.tournament?.handicap_allowance ?? adminDraft.handicap_allowance);
  return Math.round((Number(h)||0)*allowance/100);
}
function strokesOnHole(hcp,si){
  hcp=Math.max(0,Math.round(Number(hcp)||0));
  return Math.floor(hcp/18)+(((hcp%18)>=si)?1:0);
}
function stableford(gross,par,hcp,si){
  gross=Number(gross)||0;
  if(gross<1) return 0;
  const nett=gross-strokesOnHole(hcp,si);
  return Math.max(0,2+(par-nett));
}
function scoreFor(playerId,holeNo){
  return scores.find(s=>s.player_id===playerId && Number(s.hole_no)===Number(holeNo));
}
function getHoleState(team,holeNo){
  return {
    gross:team.players.map(p=>scoreFor(p.id,holeNo)?.gross_score||0),
    drive:team.players.findIndex(p=>scoreFor(p.id,holeNo)?.drive_used===true)
  };
}
function calculateHoleTeamValue(team,hole,hs){
  const type=bundle.tournament.scoring_type;
  if(type==="stroke"){
    return hs.gross.reduce((s,v)=>s+(Number(v)||0),0);
  }
  if(type==="betterballStroke"){
    const nett=team.players.map((p,i)=>{
      const g=Number(hs.gross[i])||0;
      if(!g) return 999;
      return g-strokesOnHole(playingHcp(p.handicap),hole.stroke);
    }).sort((a,b)=>a-b);
    return nett.slice(0,2).reduce((a,b)=>a+b,0);
  }
  if(type==="texas"){
    const valid=hs.gross.map(Number).filter(v=>v>0);
    return valid.length?Math.min(...valid):0;
  }
  const pts=team.players.map((p,i)=>stableford(hs.gross[i],hole.par,playingHcp(p.handicap),hole.stroke));
  let count=Number(bundle.tournament.scores_to_count)||4;
  if(type==="betterball") count=2;
  if(type==="individual") count=4;
  return [...pts].sort((a,b)=>b-a).slice(0,count).reduce((a,b)=>a+b,0);
}

async function loadTournament(){
  $("connectionStatus").textContent="Connecting…";
  const {data,error}=await db.rpc("get_tournament_bundle",{p_tournament_id:null});
  if(error){
    $("connectionStatus").textContent="Connection error";
    console.error(error);
    return;
  }
  bundle=data;
  if(!bundle){
    $("connectionStatus").textContent="No tournament published";
    renderEmptyState();
    return;
  }

  const scoreResult=await db.rpc("get_tournament_scores",{p_tournament_id:bundle.tournament.id});
  if(scoreResult.error){
    console.error(scoreResult.error);
    scores=[];
  }else{
    scores=scoreResult.data||[];
  }

  $("connectionStatus").textContent="Live";
  renderAll();
}

function renderEmptyState(){
  $("homeCompetition").textContent="No live tournament";
  $("homeCourse").textContent="—";
  $("homeTeams").textContent="0";
  $("homeAllowance").textContent="—";
  $("homeFormat").textContent="Use Admin to create and publish the first tournament.";
}

function renderAll(){
  renderHome();
  refreshTeamSelects();
  refreshHoleSelect();
  renderScoreScreen();
  renderLeaderboard();
  renderViewerScorecard();
  renderCaptainSession();
}

function renderHome(){
  if(!bundle){renderEmptyState();return;}
  $("homeCompetition").textContent=bundle.tournament.name;
  $("homeCourse").textContent=bundle.course.name;
  $("homeTeams").textContent=bundle.teams.length;
  $("homeAllowance").textContent=`${bundle.tournament.handicap_allowance}%`;
  $("homeFormat").textContent=`${formatName()} • ${bundle.tournament.scores_to_count} score(s) count`;
  $("eventSubtitle").textContent=`${bundle.tournament.name} • ${bundle.course.name}`;
}

function refreshTeamSelects(){
  const selects=[$("viewerTeam"),$("scoreTeam"),$("captainTeam")];
  selects.forEach(sel=>{
    const old=sel.value;
    sel.innerHTML="";
    (bundle?.teams||[]).forEach(t=>{
      const o=document.createElement("option");
      o.value=t.id;o.textContent=t.name;sel.appendChild(o);
    });
    if([...sel.options].some(o=>o.value===old)) sel.value=old;
  });
  if(captainSession){
    $("scoreTeam").value=captainSession.teamId;
    $("scoreTeam").disabled=true;
  }else{
    $("scoreTeam").disabled=false;
  }
}
function refreshHoleSelect(){
  const sel=$("scoreHole");
  const old=sel.value;
  sel.innerHTML="";
  (bundle?.course?.holes||defaultHoles).forEach(h=>{
    const o=document.createElement("option");
    o.value=h.hole;o.textContent=`Hole ${h.hole}`;sel.appendChild(o);
  });
  if([...sel.options].some(o=>o.value===old)) sel.value=old;
}

function renderScoreScreen(){
  if(!bundle) return;
  refreshTeamSelects();
  refreshHoleSelect();

  const team=bundle.teams.find(t=>t.id===$("scoreTeam").value)||bundle.teams[0];
  if(!team) return;
  $("scoreTeam").value=team.id;
  const holeNum=Number($("scoreHole").value||1);
  const hole=bundle.course.holes.find(h=>Number(h.hole)===holeNum);
  const hs=getHoleState(team,holeNum);
  const canEdit=!!captainSession && captainSession.teamId===team.id;

  $("scoreAccessNotice").textContent=canEdit
    ? `Captain access active for ${team.name}. You can enter and edit this team's scores.`
    : `Read-only view. Captain login is required to edit ${team.name}.`;

  $("holeTitle").textContent=`Hole ${holeNum}`;
  $("holeMeta").textContent=`Par ${hole.par} • SI ${hole.stroke}`;

  const host=$("playerScoreRows");
  host.innerHTML="";
  team.players.forEach((p,pi)=>{
    const ph=playingHcp(p.handicap);
    const pts=stableford(hs.gross[pi],hole.par,ph,hole.stroke);
    const row=document.createElement("div");
    row.className="player-row";
    row.innerHTML=`
      <div>
        <div class="player-name">${esc(p.name)}</div>
        <div class="small">Official HCP ${p.handicap} → Playing ${ph}</div>
      </div>
      <label>Gross
        <input type="number" min="1" max="20" class="grossInput" data-pi="${pi}" value="${hs.gross[pi]||""}" ${canEdit?"":"disabled"}>
      </label>
      <div>
        <div class="small">Stableford</div>
        <strong>${pts} pts</strong>
      </div>
      <label>Drive used
        <select class="driveSelect" data-pi="${pi}" ${canEdit?"":"disabled"}>
          <option value="">No</option>
          <option value="${pi}" ${hs.drive===pi?"selected":""}>Yes</option>
        </select>
      </label>
    `;
    host.appendChild(row);
  });

  $("saveHole").disabled=!canEdit;
  const val=calculateHoleTeamValue(team,hole,hs);
  const strokeMode=["stroke","betterballStroke","texas"].includes(bundle.tournament.scoring_type);
  $("holeTeamPoints").textContent=strokeMode?`Team: ${val} strokes`:`Team: ${val} pts`;
}

async function saveCurrentHole(){
  if(!captainSession){return;}
  const team=bundle.teams.find(t=>t.id===captainSession.teamId);
  const holeNum=Number($("scoreHole").value);
  const inputs=[...document.querySelectorAll(".grossInput")];
  const driveSelects=[...document.querySelectorAll(".driveSelect")];
  const selectedDrive=driveSelects.findIndex(s=>s.value!=="");

  $("saveStatus").textContent="Saving…";

  for(let i=0;i<team.players.length;i++){
    const gross=Number(inputs[i].value)||0;
    if(gross<1){
      $("saveStatus").textContent=`Enter a gross score for ${team.players[i].name}.`;
      return;
    }

    const {error}=await db.rpc("captain_save_score",{
      p_team_id:team.id,
      p_password:captainSession.password,
      p_player_id:team.players[i].id,
      p_hole_no:holeNum,
      p_gross_score:gross,
      p_drive_used:i===selectedDrive
    });
    if(error){
      $("saveStatus").textContent=error.message||"Could not save score.";
      return;
    }
  }

  await refreshScores();
  $("saveStatus").textContent="Hole saved to live database.";
  setTimeout(()=>$("saveStatus").textContent="",1800);
}

function teamTotals(team){
  let total=0,thru=0;
  const strokeMode=["stroke","betterballStroke","texas"].includes(bundle.tournament.scoring_type);
  for(const h of bundle.course.holes){
    const hs=getHoleState(team,h.hole);
    if(hs.gross.some(v=>Number(v)>0)){
      thru=Math.max(thru,Number(h.hole));
      total+=calculateHoleTeamValue(team,h,hs);
    }
  }
  return {total,thru,strokeMode};
}
function renderLeaderboard(){
  if(!bundle)return;
  const rows=bundle.teams.map(team=>({team,...teamTotals(team)}));
  const strokeMode=rows[0]?.strokeMode||false;
  $("leaderValueHeader").textContent=strokeMode?"Strokes":"Points";
  rows.sort((a,b)=>strokeMode?a.total-b.total:b.total-a.total);
  const body=$("leaderboardBody");
  body.innerHTML="";
  rows.forEach((r,i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${i+1}</td><td><strong>${esc(r.team.name)}</strong></td><td>${r.thru||"-"}</td><td>${r.total}</td>`;
    body.appendChild(tr);
  });
}

function renderViewerScorecard(){
  if(!bundle)return;
  const team=bundle.teams.find(t=>t.id===$("viewerTeam").value)||bundle.teams[0];
  if(!team)return;
  const host=$("viewerScorecard");
  host.innerHTML=`<h3>${esc(team.name)}</h3>`;
  team.players.forEach(p=>{
    const wrap=document.createElement("div");
    wrap.className="viewer-player";
    let cells="";
    for(const h of bundle.course.holes){
      const s=scoreFor(p.id,h.hole);
      const pts=s?stableford(s.gross_score,h.par,playingHcp(p.handicap),h.stroke):"";
      cells+=`<div class="scorecell"><span class="small">H${h.hole}</span><strong>${s?.gross_score||"-"}</strong><span class="small">${pts===""?"":pts+" pts"}</span></div>`;
    }
    wrap.innerHTML=`<div class="player-name">${esc(p.name)} <span class="small">HCP ${p.handicap}</span></div><div class="scorecard-grid">${cells}</div>`;
    host.appendChild(wrap);
  });
}

async function captainLogin(){
  const teamId=$("captainTeam").value;
  const password=$("captainPassword").value;
  if(!teamId||!password){$("captainLoginStatus").textContent="Choose a team and enter the captain password.";return;}

  $("captainLoginStatus").textContent="Signing in…";
  const {data,error}=await db.rpc("captain_login",{p_team_id:teamId,p_password:password});
  if(error||!data||data.length===0){
    $("captainLoginStatus").textContent="Incorrect captain password.";
    return;
  }

  const row=data[0];
  captainSession={teamId:row.team_id,teamName:row.team_name,password};
  $("captainPassword").value="";
  $("captainLoginStatus").textContent="Signed in successfully.";
  renderCaptainSession();
  refreshTeamSelects();
  renderScoreScreen();
}
function captainLogout(){
  captainSession=null;
  $("captainLoginStatus").textContent="Signed out.";
  renderCaptainSession();
  refreshTeamSelects();
  renderScoreScreen();
}
function renderCaptainSession(){
  const active=!!captainSession;
  $("captainLogout").classList.toggle("hidden",!active);
  $("captainSession").classList.toggle("hidden",!active);
  if(active){
    $("captainSessionText").textContent=`You are signed in as captain for ${captainSession.teamName}. Only this team's scores can be edited.`;
  }
}

async function adminLogin(){
  const pass=$("adminPassword").value;
  $("adminLoginStatus").textContent="Checking…";
  const {data,error}=await db.rpc("verify_admin_password",{p_admin_password:pass});
  if(error||data!==true){
    $("adminLoginStatus").textContent="Incorrect admin password.";
    return;
  }
  adminUnlocked=true;
  adminPasswordSession=pass;
  $("adminPassword").value="";
  $("adminLoginStatus").textContent="";
  hydrateDraftFromBundle();
  renderAdminGate();
}
function renderAdminGate(){
  $("adminLocked").classList.toggle("hidden",adminUnlocked);
  $("adminContent").classList.toggle("hidden",!adminUnlocked);
  if(adminUnlocked) renderAdmin();
}
function hydrateDraftFromBundle(){
  if(!bundle)return;
  adminDraft.id=bundle.tournament.id;
  adminDraft.name=bundle.tournament.name;
  adminDraft.scoring_type=bundle.tournament.scoring_type;
  adminDraft.scores_to_count=Number(bundle.tournament.scores_to_count);
  adminDraft.handicap_allowance=Number(bundle.tournament.handicap_allowance);
  adminDraft.min_drives=Number(bundle.tournament.min_drives);
  adminDraft.course=structuredClone(bundle.course);
  adminDraft.teams=bundle.teams.map(t=>({
    name:t.name,
    captain_name:t.captain_name||t.players[0]?.name||"",
    captain_password:"",
    players:t.players.map(p=>({
      player_order:Number(p.player_order),
      name:p.name,
      handicap:Number(p.handicap)
    }))
  }));
}
function renderAdmin(){
  $("competitionName").value=adminDraft.name;
  $("scoringType").value=adminDraft.scoring_type;
  $("scoresToCount").value=String(adminDraft.scores_to_count);
  $("handicapAllowance").value=adminDraft.handicap_allowance;
  $("minDrives").value=adminDraft.min_drives;
  $("courseName").value=adminDraft.course.name||"";
  renderCourseEditor();
  renderTeamEditor();
}
function renderCourseEditor(){
  const body=$("courseEditor");body.innerHTML="";
  adminDraft.course.holes.forEach((h,i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${h.hole}</td><td><input type="number" min="3" max="6" class="holePar" data-i="${i}" value="${h.par}"></td><td><input type="number" min="1" max="18" class="holeStroke" data-i="${i}" value="${h.stroke}"></td>`;
    body.appendChild(tr);
  });
}
function renderTeamEditor(){
  const host=$("teamEditor");host.innerHTML="";
  adminDraft.teams.forEach((t,ti)=>{
    const card=document.createElement("div");
    card.className="team-card";
    card.innerHTML=`
      <div class="team-head">
        <input class="teamName" data-ti="${ti}" value="${escAttr(t.name)}">
        <button class="removeTeam secondary" data-ti="${ti}">Remove</button>
      </div>
      <div class="team-meta">
        <label>Captain name
          <input class="captainNameInput" data-ti="${ti}" value="${escAttr(t.captain_name||"")}">
        </label>
        <label>Captain password
          <input class="captainPasswordInput" data-ti="${ti}" type="text" value="${escAttr(t.captain_password||"")}" placeholder="Set/reset password before publish">
        </label>
      </div>
      <div class="team-players"></div>
    `;
    const grid=card.querySelector(".team-players");
    t.players.forEach((p,pi)=>{
      const pe=document.createElement("div");
      pe.className="player-edit";
      pe.innerHTML=`
        <label>Player ${pi+1} name
          <input class="playerName" data-ti="${ti}" data-pi="${pi}" value="${escAttr(p.name)}">
        </label>
        <label>Official handicap
          <input type="number" class="playerHcp" data-ti="${ti}" data-pi="${pi}" value="${p.handicap}">
        </label>
      `;
      grid.appendChild(pe);
    });
    host.appendChild(card);
  });

  host.querySelectorAll(".removeTeam").forEach(b=>b.addEventListener("click",e=>{
    if(adminDraft.teams.length<=2){alert("At least 2 teams are required.");return;}
    adminDraft.teams.splice(Number(e.target.dataset.ti),1);
    renderTeamEditor();
  }));
}
function readAdminInputs(){
  adminDraft.name=$("competitionName").value.trim()||"Golf Day";
  adminDraft.scoring_type=$("scoringType").value;
  adminDraft.scores_to_count=Number($("scoresToCount").value)||4;
  adminDraft.handicap_allowance=Math.max(0,Math.min(100,Number($("handicapAllowance").value)||0));
  adminDraft.min_drives=Math.max(0,Math.min(18,Number($("minDrives").value)||0));
  adminDraft.course.name=$("courseName").value.trim();

  document.querySelectorAll(".holePar").forEach(i=>adminDraft.course.holes[Number(i.dataset.i)].par=Number(i.value));
  document.querySelectorAll(".holeStroke").forEach(i=>adminDraft.course.holes[Number(i.dataset.i)].stroke=Number(i.value));
  document.querySelectorAll(".teamName").forEach(i=>adminDraft.teams[Number(i.dataset.ti)].name=i.value);
  document.querySelectorAll(".captainNameInput").forEach(i=>adminDraft.teams[Number(i.dataset.ti)].captain_name=i.value);
  document.querySelectorAll(".captainPasswordInput").forEach(i=>adminDraft.teams[Number(i.dataset.ti)].captain_password=i.value);
  document.querySelectorAll(".playerName").forEach(i=>adminDraft.teams[Number(i.dataset.ti)].players[Number(i.dataset.pi)].name=i.value);
  document.querySelectorAll(".playerHcp").forEach(i=>adminDraft.teams[Number(i.dataset.ti)].players[Number(i.dataset.pi)].handicap=Number(i.value)||0);
}
function validateDraft(){
  if(!adminDraft.course.name) return "Enter a course name.";
  const sis=adminDraft.course.holes.map(h=>Number(h.stroke));
  if(sis.some(x=>x<1||x>18)||new Set(sis).size!==18) return "Stroke Index must contain each number 1–18 exactly once.";
  if(adminDraft.teams.length<2||adminDraft.teams.length>18) return "The tournament must have 2–18 teams.";
  for(const t of adminDraft.teams){
    if(!t.name.trim()) return "Every team needs a name.";
    if(!t.captain_password.trim()) return `Enter a captain password for ${t.name}.`;
    if(t.players.length!==4||t.players.some(p=>!p.name.trim())) return `${t.name} must have 4 player names.`;
  }
  return "";
}
async function publishTournament(){
  readAdminInputs();
  const err=validateDraft();
  if(err){$("publishStatus").textContent=err;return;}
  $("publishStatus").textContent="Publishing…";

  const {data,error}=await db.rpc("admin_publish_tournament",{
    p_admin_password:adminPasswordSession,
    p_payload:adminDraft
  });
  if(error){
    $("publishStatus").textContent=error.message||"Publish failed.";
    return;
  }
  adminDraft.id=data;
  $("publishStatus").textContent="Tournament published successfully. Loading live version…";
  await loadTournament();
  hydrateDraftFromBundle();
  renderAdmin();
  $("publishStatus").textContent="Tournament is live.";
}
async function resetScores(){
  if(!bundle){return;}
  if(!confirm("Reset ALL scores for this tournament?"))return;
  const {error}=await db.rpc("admin_reset_scores",{
    p_admin_password:adminPasswordSession,
    p_tournament_id:bundle.tournament.id
  });
  if(error){$("publishStatus").textContent=error.message;return;}
  await refreshScores();
  $("publishStatus").textContent="All scores reset.";
}

async function refreshScores(){
  if(!bundle)return;
  const {data,error}=await db.rpc("get_tournament_scores",{p_tournament_id:bundle.tournament.id});
  if(!error){
    scores=data||[];
    renderScoreScreen();
    renderLeaderboard();
    renderViewerScorecard();
  }
}

function setupRealtime(){
  db.channel("golf-score-changes")
    .on("postgres_changes",{event:"*",schema:"public",table:"scores"},async payload=>{
      if(!bundle)return;
      await refreshScores();
    })
    .subscribe(status=>{
      if(status==="SUBSCRIBED") $("connectionStatus").textContent="Live";
    });
}

$("scoreTeam").addEventListener("change",renderScoreScreen);
$("scoreHole").addEventListener("change",renderScoreScreen);
$("viewerTeam").addEventListener("change",renderViewerScorecard);
$("viewTeamScorecard").addEventListener("click",renderViewerScorecard);
$("prevHole").addEventListener("click",()=>{$("scoreHole").value=String(Math.max(1,Number($("scoreHole").value||1)-1));renderScoreScreen();});
$("nextHole").addEventListener("click",()=>{$("scoreHole").value=String(Math.min(18,Number($("scoreHole").value||1)+1));renderScoreScreen();});
$("saveHole").addEventListener("click",saveCurrentHole);
$("refreshLeaderboard").addEventListener("click",refreshScores);

$("captainLogin").addEventListener("click",captainLogin);
$("captainLogout").addEventListener("click",captainLogout);
$("goToScores").addEventListener("click",()=>{showTab("scores");});

$("adminLogin").addEventListener("click",adminLogin);
$("adminPassword").addEventListener("keydown",e=>{if(e.key==="Enter")adminLogin();});
$("adminLogout").addEventListener("click",()=>{adminUnlocked=false;adminPasswordSession="";renderAdminGate();});

$("addTeam").addEventListener("click",()=>{
  readAdminInputs();
  if(adminDraft.teams.length>=18){alert("Maximum 18 teams.");return;}
  const n=adminDraft.teams.length+1;
  adminDraft.teams.push({
    name:`Team ${n}`,captain_name:"",captain_password:"",
    players:[1,2,3,4].map(i=>({player_order:i,name:`Player ${i}`,handicap:0}))
  });
  renderTeamEditor();
});
$("scoringType").addEventListener("change",e=>{
  if(e.target.value==="scramble4"||e.target.value==="individual")$("scoresToCount").value="4";
  if(e.target.value==="betterball"||e.target.value==="betterballStroke")$("scoresToCount").value="2";
});
$("publishTournament").addEventListener("click",publishTournament);
$("resetScores").addEventListener("click",resetScores);

async function init(){
  setupRealtime();
  await loadTournament();
  renderAdminGate();
}
init();
