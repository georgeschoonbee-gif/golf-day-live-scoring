const SUPABASE_URL="https://nozjqxuxfvwweatqerpq.supabase.co";
const SUPABASE_KEY="sb_publishable_DZjClCBchJgK-WWHx_Zo5g_0rWmnmgN";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id),clone=v=>JSON.parse(JSON.stringify(v));
const CACHE_KEY="jacobsdalGolfTourBundleV1";
const QUEUE_KEY="jacobsdalGolfTourSyncQueueV1";
const PLAYER_SESSION_KEY="jacobsdalGolfPlayerSessionV1";
const CAPTAIN_SESSION_KEY="jacobsdalGolfCaptainSessionV1";
const isOnline=()=>navigator.onLine;
function saveBundleCache(){try{if(bundle)localStorage.setItem(CACHE_KEY,JSON.stringify(bundle))}catch(e){}}
function loadBundleCache(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||"null")}catch(e){return null}}
function getQueue(){try{return JSON.parse(localStorage.getItem(QUEUE_KEY)||"[]")}catch(e){return []}}
function setQueue(q){localStorage.setItem(QUEUE_KEY,JSON.stringify(q));updateSyncStatus()}
function queueRpc(name,args,optimistic){
 const q=getQueue();q.push({id:Date.now()+"-"+Math.random().toString(36).slice(2),name,args,created_at:new Date().toISOString()});setQueue(q);
 if(typeof optimistic==="function")optimistic();
 updateSyncStatus();
}
function updateSyncStatus(){
 const el=$("offlineStatus");if(!el)return;
 const n=getQueue().length;
 if(!navigator.onLine){el.textContent="Offline"+(n?(" • "+n+" waiting to sync"):"");el.className="offline-status offline"}
 else if(n){el.textContent=n+" waiting to sync";el.className="offline-status pending"}
 else{el.textContent="Online • synced";el.className="offline-status online"}
}
async function flushQueue(){
 if(!navigator.onLine)return;
 let q=getQueue();if(!q.length){updateSyncStatus();return}
 const remain=[];
 for(const item of q){
   try{
     const {error}=await db.rpc(item.name,item.args);
     if(error)remain.push(item);
   }catch(e){remain.push(item);break}
 }
 setQueue(remain);
 if(remain.length===0)await load();
}
async function writeRpc(name,args,{queueWhenOffline=true,optimistic=null}={}){
 if(!navigator.onLine&&queueWhenOffline){queueRpc(name,args,optimistic);return {data:null,error:null,queued:true}}
 try{
   const res=await db.rpc(name,args);
   if(res.error&&queueWhenOffline&&(!navigator.onLine||/fetch|network|failed/i.test(res.error.message||""))){
     queueRpc(name,args,optimistic);return {data:null,error:null,queued:true}
   }
   if(!res.error&&typeof optimistic==="function")optimistic();
   return {...res,queued:false};
 }catch(e){
   if(queueWhenOffline){queueRpc(name,args,optimistic);return {data:null,error:null,queued:true}}
   return {data:null,error:{message:e.message||String(e)},queued:false};
 }
}
window.addEventListener("online",()=>{updateSyncStatus();flushQueue()});
window.addEventListener("offline",updateSyncStatus);

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let bundle=null,captain=null,playerSession=null,adminPass="",adminUnlocked=false;try{playerSession=JSON.parse(localStorage.getItem(PLAYER_SESSION_KEY)||"null");captain=JSON.parse(localStorage.getItem(CAPTAIN_SESSION_KEY)||"null")}catch(e){}
const defaultHoles=Array.from({length:18},(_,i)=>({hole:i+1,par:4,stroke:i+1}));
const elementsHoles=[
 {hole:1,par:4,stroke:3},{hole:2,par:3,stroke:15},{hole:3,par:5,stroke:7},{hole:4,par:4,stroke:11},{hole:5,par:4,stroke:1},{hole:6,par:4,stroke:17},{hole:7,par:5,stroke:5},{hole:8,par:4,stroke:9},{hole:9,par:3,stroke:13},
 {hole:10,par:4,stroke:4},{hole:11,par:3,stroke:16},{hole:12,par:4,stroke:8},{hole:13,par:4,stroke:14},{hole:14,par:5,stroke:2},{hole:15,par:3,stroke:18},{hole:16,par:4,stroke:12},{hole:17,par:4,stroke:10},{hole:18,par:5,stroke:6}
];
const zebulaHoles=[
 {hole:1,par:4,stroke:9},{hole:2,par:5,stroke:5},{hole:3,par:4,stroke:13},{hole:4,par:3,stroke:17},{hole:5,par:4,stroke:3},{hole:6,par:5,stroke:7},{hole:7,par:4,stroke:1},{hole:8,par:3,stroke:15},{hole:9,par:4,stroke:11},
 {hole:10,par:4,stroke:12},{hole:11,par:4,stroke:4},{hole:12,par:4,stroke:14},{hole:13,par:3,stroke:18},{hole:14,par:4,stroke:10},{hole:15,par:5,stroke:2},{hole:16,par:4,stroke:6},{hole:17,par:3,stroke:16},{hole:18,par:5,stroke:8}
];
const euphoriaHoles=[
 {hole:1,par:4,stroke:15},{hole:2,par:4,stroke:3},{hole:3,par:5,stroke:7},{hole:4,par:4,stroke:1},{hole:5,par:4,stroke:9},{hole:6,par:3,stroke:13},{hole:7,par:4,stroke:5},{hole:8,par:3,stroke:11},{hole:9,par:5,stroke:17},
 {hole:10,par:4,stroke:4},{hole:11,par:4,stroke:16},{hole:12,par:5,stroke:12},{hole:13,par:4,stroke:6},{hole:14,par:4,stroke:14},{hole:15,par:3,stroke:18},{hole:16,par:4,stroke:8},{hole:17,par:3,stroke:10},{hole:18,par:5,stroke:2}
];
const draft={name:"Golf Tour",teams:[{key:"team1",name:"Team 1",captain_name:"",captain_password:"",players:Array.from({length:8},(_,i)=>({player_order:i+1,name:`Player ${i+1}`,handicap:0,player_password:""}))},{key:"team2",name:"Team 2",captain_name:"",captain_password:"",players:Array.from({length:8},(_,i)=>({player_order:i+1,name:`Player ${i+1}`,handicap:0,player_password:""}))}],courses:[{key:"course1",name:"Elements",holes:clone(elementsHoles)},{key:"course2",name:"Zebula",holes:clone(zebulaHoles)},{key:"course3",name:"Euphoria",holes:clone(euphoriaHoles)}],rounds:[{round_no:1,name:"Day 1",play_date:"",course_key:"course1",team_a_key:"team1",team_b_key:"team2",format_code:"betterball_scramble_drive",players_per_side:2,match_count:4,scores_to_count:1,handicap_allowance:100,handicap_method:"full",min_drives:0},{round_no:2,name:"Day 2",play_date:"",course_key:"course2",team_a_key:"team1",team_b_key:"team2",format_code:"betterball_match_play",players_per_side:2,match_count:4,scores_to_count:1,handicap_allowance:100,handicap_method:"full",min_drives:0},{round_no:3,name:"Day 3",play_date:"",course_key:"course3",team_a_key:"team1",team_b_key:"team2",format_code:"singles_match_play",players_per_side:1,match_count:8,scores_to_count:1,handicap_allowance:100,handicap_method:"full",min_drives:0}]};

document.querySelectorAll(".tab-btn").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
function showTab(id){document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab-btn").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");document.querySelector(`.tab-btn[data-tab="${id}"]`).classList.add("active");if(id==="matches")renderMatches();if(id==="player")renderPlayer();if(id==="captain")renderCaptain();if(id==="admin")renderAdmin()}
function team(id){return bundle?.teams.find(t=>t.id===id)} function player(id){for(const t of bundle?.teams||[]){const p=t.players.find(x=>x.id===id);if(p)return p}} function course(id){return bundle?.courses.find(c=>c.id===id)} function round(id){return bundle?.rounds.find(r=>r.id===id)} function matchesForRound(id){return (bundle?.matches||[]).filter(m=>m.round_id===id).sort((a,b)=>a.match_no-b.match_no)} function score(mid,pid,h){return (bundle?.scores||[]).find(s=>s.match_id===mid&&s.player_id===pid&&Number(s.hole_no)===Number(h))}
function formatLabel(code){return{stableford_count:"Stableford Match – N Scores Count",betterball_scramble_drive:"Betterball + Scramble Drive Match Play",singles_match_play:"Singles Match Play",betterball_match_play:"Betterball Match Play",gross_match_play:"Gross Match Play"}[code]||code}
function playingHcp(p,r){const ch=(bundle?.course_handicaps||[]).find(x=>x.player_id===p.id&&x.round_id===r.id);const base=ch?Number(ch.course_handicap):Number(p.handicap||0);return Math.round(base*Number(r.handicap_allowance||100)/100)}
function strokesFor(m,r,p){const ph=playingHcp(p,r);if(r.handicap_method==="full")return ph;const hs=m.players.map(mp=>playingHcp(player(mp.player_id),r));return Math.max(0,ph-Math.min(...hs))}
function holeStrokes(hcp,si){hcp=Math.max(0,Math.round(hcp));return Math.floor(hcp/18)+((hcp%18)>=si?1:0)}
function stableford(gross,par,hcp,si){if(!gross)return 0;const nett=gross-holeStrokes(hcp,si);return Math.max(0,2+(par-nett))}
function matchState(m){const r=round(m.round_id),c=course(r.course_id),ta=team(m.team_a_id),tb=team(m.team_b_id);let aw=0,bw=0,thru=0;for(const h of c.holes){if(!m.players.every(mp=>!!score(m.id,mp.player_id,h.hole)))break;thru=h.hole;const ap=m.players.filter(x=>x.team_id===ta.id),bp=m.players.filter(x=>x.team_id===tb.id);let av,bv;if(r.format_code==="stableford_count"){const a=ap.map(mp=>{const p=player(mp.player_id),s=score(m.id,p.id,h.hole);return stableford(s.gross_score,h.par,strokesFor(m,r,p),h.stroke)}).sort((x,y)=>y-x),b=bp.map(mp=>{const p=player(mp.player_id),s=score(m.id,p.id,h.hole);return stableford(s.gross_score,h.par,strokesFor(m,r,p),h.stroke)}).sort((x,y)=>y-x);av=a.slice(0,r.scores_to_count).reduce((x,y)=>x+y,0);bv=b.slice(0,r.scores_to_count).reduce((x,y)=>x+y,0);if(av>bv)aw++;else if(bv>av)bw++}else{const calc=mp=>{const p=player(mp.player_id),s=score(m.id,p.id,h.hole);return r.format_code==="gross_match_play"?s.gross_score:s.gross_score-holeStrokes(strokesFor(m,r,p),h.stroke)};av=Math.min(...ap.map(calc));bv=Math.min(...bp.map(calc));if(av<bv)aw++;else if(bv<av)bw++}}const lead=aw-bw,remain=18-thru;let complete=false,resultText;if(Math.abs(lead)>remain){complete=true;resultText=`${Math.abs(lead)}&${remain}`}else if(thru===18){complete=true;resultText=lead===0?"AS":`${Math.abs(lead)} UP`}else resultText=lead===0?`AS thru ${thru}`:`${lead>0?ta.name:tb.name} ${Math.abs(lead)} UP thru ${thru}`;return{lead,thru,complete,resultText,pointsA:complete?(lead>0?1:lead===0?.5:0):0,pointsB:complete?(lead<0?1:lead===0?.5:0):0}}
function overallPoints(){const map={};(bundle?.teams||[]).forEach(t=>map[t.id]=0);for(const m of bundle?.matches||[]){const s=matchState(m);map[m.team_a_id]+=s.pointsA;map[m.team_b_id]+=s.pointsB}return map}
function totalTourPointsAvailable(){return (bundle?.rounds||[]).reduce((sum,r)=>sum+Number(r.match_count||0),0)}
function pointsToWin(){const total=totalTourPointsAvailable();return total%2===0?total/2+0.5:(total+1)/2}
function tourWinner(){const pts=overallPoints(),target=pointsToWin();return (bundle?.teams||[]).find(t=>(pts[t.id]||0)>=target)||null}
async function load(){$("connectionStatus").textContent=navigator.onLine?"Connecting…":"Offline";try{const {data,error}=await db.rpc("tour_get_bundle",{p_event_id:null});if(error)throw error;bundle=data;saveBundleCache();$("connectionStatus").textContent="Live";renderAll();updateSyncStatus();if(getQueue().length)flushQueue()}catch(error){const cached=loadBundleCache();if(cached){bundle=cached;$("connectionStatus").textContent="Offline cache";renderAll();updateSyncStatus()}else{$("connectionStatus").textContent="Connection error";console.error(error)}}}
function renderAll(){if(!bundle){$("eventSubtitle").textContent="No live tour yet";renderAdmin();return}$("eventSubtitle").textContent=bundle.event.name;renderHome();renderMatches();renderPlayer();renderCaptain();renderAdmin()}
function renderHome(){const pts=overallPoints(),target=pointsToWin(),winner=tourWinner();$("tourScoreHero").innerHTML=`<div class="tour-score-line">${bundle.teams.map(t=>`<span>${esc(t.name)} ${pts[t.id]||0}</span>`).join("<span>—</span>")}</div><div class="tour-target">${winner?`🏆 ${esc(winner.name)} has won the tour with ${pts[winner.id]} points`:`First team to ${target} points wins • ${totalTourPointsAvailable()} total points available`}</div>`;$("roundCards").innerHTML=bundle.rounds.map(r=>`<div class="round-card"><h3>${esc(r.name)}</h3><div>${esc(course(r.course_id)?.name||"")}</div><div class="small">${formatLabel(r.format_code)}</div><div class="small">${r.match_count} match(es) • ${r.players_per_side} player(s) per side • ${r.match_count} point${Number(r.match_count)===1?"":"s"} available</div><div class="badge">${r.pairing_status}</div></div>`).join("");renderHomeStandings();renderHomeFinalResults();renderHomeLiveScoring()}

function matchLatestHole(m){
 let latest=0;
 for(let h=1;h<=18;h++){if(m.players.some(mp=>score(m.id,mp.player_id,h)))latest=h}
 return latest||1;
}
function renderHomeLiveScoring(){
 const sel=$("homeLiveRound"),wrap=$("homeLiveMatches");if(!sel||!wrap||!bundle)return;
 const prev=sel.value;sel.innerHTML="";
 bundle.rounds.forEach(r=>sel.add(new Option(r.round_no+". "+r.name+" — "+(course(r.course_id)?.name||""),r.id)));
 if([...sel.options].some(o=>o.value===prev))sel.value=prev;
 else{
   const active=bundle.rounds.find(r=>matchesForRound(r.id).some(m=>m.players.some(mp=>(bundle.scores||[]).some(s=>s.match_id===m.id&&s.player_id===mp.player_id))))||bundle.rounds.find(r=>r.pairing_status==="published")||bundle.rounds[0];
   if(active)sel.value=active.id;
 }
 const r=round(sel.value);if(!r){wrap.innerHTML='<p class="muted">No round available.</p>';return}
 const ms=matchesForRound(r.id);
 if(!ms.length){wrap.innerHTML='<p class="muted">Pairings have not been published yet.</p>';return}
 wrap.innerHTML=ms.map(m=>{
   const st=matchState(m),h=matchLatestHole(m),crs=course(r.course_id),hole=crs?.holes?.find(x=>Number(x.hole)===Number(h));
   const ta=team(m.team_a_id),tb=team(m.team_b_id);
   const renderSide=(tid)=>{
     return m.players.filter(mp=>mp.team_id===tid).map(mp=>{
       const p=player(mp.player_id),s=score(m.id,p.id,h);
       let gross="—",detail="Waiting",drive="";
       if(s){
         gross=s.gross_score;
         const hp=strokesFor(m,r,p),nett=hole?s.gross_score-holeStrokes(hp,hole.stroke):s.gross_score;
         detail=r.format_code==="stableford_count"?(stableford(s.gross_score,hole.par,hp,hole.stroke)+" pts"):(nett+" nett");
         drive=s.drive_used?'<span class="drive-badge">Drive ✓</span>':"";
       }
       return '<div class="live-player-row"><div class="live-player-name"><strong>'+esc(p.name)+'</strong><small>CH '+playingHcp(p,r)+'</small></div><div class="live-gross"><strong>'+gross+'</strong><small>gross</small></div><div class="live-detail">'+detail+'</div>'+drive+'</div>';
     }).join("");
   };
   return '<div class="live-match-card"><div class="live-match-top"><div><div class="eyebrow">'+esc(r.name)+' • Match '+m.match_no+'</div><h3>'+esc(ta.name)+' vs '+esc(tb.name)+'</h3></div><span class="match-status'+(st.complete?' finished':'')+'">'+esc(st.resultText)+'</span></div><div class="live-hole-strip"><strong>Hole '+h+'</strong><span>'+(hole?('Par '+hole.par+' • SI '+hole.stroke):'')+'</span></div><div class="live-side"><div class="live-side-title">'+esc(ta.name)+'</div>'+renderSide(ta.id)+'</div><div class="vs-divider">VS</div><div class="live-side"><div class="live-side-title">'+esc(tb.name)+'</div>'+renderSide(tb.id)+'</div></div>';
 }).join("");
}
function fillRoundSelect(el,published=false){const old=el.value;el.innerHTML="";(bundle?.rounds||[]).filter(r=>!published||r.pairing_status==="published").forEach(r=>el.add(new Option(`${r.round_no}. ${r.name}`,r.id)));if([...el.options].some(o=>o.value===old))el.value=old}
function renderMatches(){if(!bundle)return;fillRoundSelect($("matchRoundSelect"));const rid=$("matchRoundSelect").value||bundle.rounds[0]?.id,ms=matchesForRound(rid);$("matchList").innerHTML=ms.length?ms.map(m=>{const a=m.players.filter(x=>x.team_id===m.team_a_id).map(x=>player(x.player_id)?.name).join(" + "),b=m.players.filter(x=>x.team_id===m.team_b_id).map(x=>player(x.player_id)?.name).join(" + "),st=matchState(m);return`<div class="match-card"><div class="match-head"><h3>Match ${m.match_no}</h3><span class="badge">${st.resultText}</span></div><div><strong>${esc(team(m.team_a_id).name)}:</strong> ${esc(a)}</div><div><strong>${esc(team(m.team_b_id).name)}:</strong> ${esc(b)}</div></div>`}).join(""):'<p class="muted">Pairings are not published yet.</p>'}
function roundPoints(rid){const map={};bundle.teams.forEach(t=>map[t.id]=0);for(const m of matchesForRound(rid)){const s=matchState(m);map[m.team_a_id]+=s.pointsA;map[m.team_b_id]+=s.pointsB}return map}
function renderHomeStandings(){
 if(!bundle||!$("homeLeaderboard"))return;
 const overall=overallPoints(),target=pointsToWin(),winner=tourWinner();
 const rows=bundle.teams.map(t=>({t,pts:overall[t.id]||0})).sort((a,b)=>b.pts-a.pts);
 $("homeLeaderboard").innerHTML='<div class="winner-target">'+(winner?('🏆 '+esc(winner.name)+' — Tour Winner'):(target+' points required to win the tour'))+'</div>'+rows.map((x,i)=>'<div class="result-card"><div class="match-head"><span class="result-team">'+(i+1)+'. '+esc(x.t.name)+'</span><span class="badge">'+x.pts+' pts</span></div>'+bundle.rounds.map(r=>'<div class="small">'+esc(r.name)+' — '+esc(course(r.course_id)?.name||'')+': '+(roundPoints(r.id)[x.t.id]||0)+' / '+r.match_count+' pts</div>').join('')+'</div>').join('');
}
function renderLeaderboard(){if(!bundle)return;const overall=overallPoints(),target=pointsToWin(),winner=tourWinner(),rows=bundle.teams.map(t=>({t,pts:overall[t.id]||0})).sort((a,b)=>b.pts-a.pts);$("leaderboardBody").innerHTML=`<div class="winner-target">${winner?`🏆 ${esc(winner.name)} — Tour Winner`:`${target} points required to win the tour`}</div>`+rows.map((x,i)=>`<div class="result-card"><div class="match-head"><span class="result-team">${i+1}. ${esc(x.t.name)}</span><span class="badge">${x.pts} pts</span></div>${bundle.rounds.map(r=>`<div class="small">${esc(r.name)}: ${roundPoints(r.id)[x.t.id]||0} / ${r.match_count} pts</div>`).join("")}</div>`).join("")}
function renderHomeFinalResults(){
 if(!bundle||!$("homeFinalResults"))return;
 const overall=overallPoints(),target=pointsToWin(),winner=tourWinner();
 const rows=bundle.teams.map(t=>({t,pts:overall[t.id]||0})).sort((a,b)=>b.pts-a.pts);
 $("homeFinalResults").innerHTML=
  '<div class="winner-target">'+(winner?('🏆 '+esc(winner.name)+' wins the tour with '+overall[winner.id]+' points'):('Current standings • '+target+' points wins'))+'</div>'+
  rows.map((x,i)=>'<div class="result-card"><div class="match-head"><span class="result-team">'+(i+1)+'. '+esc(x.t.name)+'</span><span class="badge">'+x.pts+' pts</span></div>'+
  bundle.rounds.map(r=>'<div>'+esc(r.name)+' — '+esc(course(r.course_id)?.name||'')+': '+(roundPoints(r.id)[x.t.id]||0)+' / '+r.match_count+' pts</div>').join('')+
  '</div>').join('');
}
function renderFinal(){if(!bundle)return;const overall=overallPoints(),target=pointsToWin(),winner=tourWinner(),rows=bundle.teams.map(t=>({t,pts:overall[t.id]||0})).sort((a,b)=>b.pts-a.pts);$("finalResults").innerHTML=`<div class="winner-target">${winner?`🏆 ${esc(winner.name)} wins the tour with ${overall[winner.id]} points`:`Winning target: ${target} points`}</div>`+rows.map((x,i)=>`<div class="result-card"><div class="match-head"><span class="result-team">${i+1}. ${esc(x.t.name)}</span><span class="badge">${x.pts} pts</span></div>${bundle.rounds.map(r=>`<div>${esc(r.name)} — ${esc(course(r.course_id)?.name||"")}: ${roundPoints(r.id)[x.t.id]||0} / ${r.match_count} pts</div>`).join("")}</div>`).join("")}

function populatePlayerTeams(){
 const el=$("playerTeam");if(!el||!bundle)return;const old=el.value;el.innerHTML="";
 bundle.teams.forEach(t=>el.add(new Option(t.name,t.id)));
 if([...el.options].some(o=>o.value===old))el.value=old;
 populatePlayerNames();
}
function populatePlayerNames(){
 const el=$("playerName");if(!el||!bundle)return;const old=el.value,tid=$("playerTeam").value;el.innerHTML="";
 const t=team(tid);(t?.players||[]).forEach(p=>el.add(new Option(p.name,p.id)));
 if([...el.options].some(o=>o.value===old))el.value=old;
}
function renderPlayer(){
 if(!$("playerLoginPanel"))return;
 populatePlayerTeams();
 $("playerWorkspace").classList.toggle("hidden",!playerSession);
 $("playerLoginPanel").classList.toggle("hidden",!!playerSession);
 if(!playerSession)return;
 $("playerWelcome").textContent=playerSession.playerName;
 $("playerTeamLabel").textContent=playerSession.teamName;
 const rounds=bundle.rounds.filter(r=>matchesForRound(r.id).some(m=>m.players.some(mp=>mp.player_id===playerSession.playerId)));
 const re=$("playerRound"),oldR=re.value;re.innerHTML="";
 rounds.forEach(r=>re.add(new Option(r.round_no+". "+r.name+" — "+(course(r.course_id)?.name||""),r.id)));
 if([...re.options].some(o=>o.value===oldR))re.value=oldR;
 renderPlayerMatches();
}
async function playerLogin(){
 const playerId=$("playerName").value,password=$("playerPassword").value;
 if(!playerId||!password){$("playerLoginStatus").textContent="Select your name and enter your PIN.";return}
 const {data,error}=await db.rpc("tour_player_login",{p_player_id:playerId,p_password:password});
 if(error||!data?.length){$("playerLoginStatus").textContent="Incorrect player PIN/password.";return}
 const x=data[0];
 playerSession={playerId:x.player_id,playerName:x.player_name,teamId:x.team_id,teamName:x.team_name,password};localStorage.setItem(PLAYER_SESSION_KEY,JSON.stringify(playerSession));
 $("playerPassword").value="";$("playerLoginStatus").textContent="";
 renderPlayer();
}
function playerLogout(){playerSession=null;localStorage.removeItem(PLAYER_SESSION_KEY);renderPlayer()}
function renderPlayerMatches(){
 if(!playerSession)return;
 const rid=$("playerRound").value,ms=matchesForRound(rid).filter(m=>m.players.some(mp=>mp.player_id===playerSession.playerId));
 const ch=(bundle?.course_handicaps||[]).find(x=>x.player_id===playerSession.playerId&&x.round_id===rid);if($("playerCourseHandicap"))$("playerCourseHandicap").value=ch?.course_handicap??"";
 const el=$("playerMatch"),old=el.value;el.innerHTML="";
 ms.forEach(m=>el.add(new Option("Match "+m.match_no,m.id)));
 if([...el.options].some(o=>o.value===old))el.value=old;
 let hole=Number($("playerHoleNumber").dataset.hole||1);
 const m=bundle.matches.find(x=>x.id===el.value);
 if(m){
  const r=round(m.round_id),crs=course(r.course_id);
  const firstMissing=crs.holes.find(h=>!score(m.id,playerSession.playerId,h.hole));
  if(firstMissing&&!$("playerHoleNumber").dataset.touched)hole=firstMissing.hole;
 }
 setPlayerHole(hole);
}
function setPlayerHole(n){
 if(!playerSession)return;
 const m=bundle.matches.find(x=>x.id===$("playerMatch").value);if(!m)return;
 const r=round(m.round_id),crs=course(r.course_id);n=Math.max(1,Math.min(18,Number(n)||1));
 $("playerHoleNumber").dataset.hole=n;$("playerHoleNumber").textContent=n;
 const h=crs.holes.find(x=>Number(x.hole)===n);
 $("playerHoleMeta").textContent=h?("Par "+h.par+" • SI "+h.stroke):"";
 const s=score(m.id,playerSession.playerId,n);$("playerGross").value=s?.gross_score||"";$("playerDrive").value=s?.drive_used?"yes":"";
 $("playerDriveWrap").classList.toggle("hidden",r.format_code!=="betterball_scramble_drive");
 const st=matchState(m);
 const opp=m.players.filter(mp=>mp.team_id!==playerSession.teamId).map(mp=>player(mp.player_id)?.name).filter(Boolean).join(" + ");
 const mate=m.players.filter(mp=>mp.team_id===playerSession.teamId&&mp.player_id!==playerSession.playerId).map(mp=>player(mp.player_id)?.name).filter(Boolean).join(" + ");
 const mateLine=mate?("Partner: "+esc(mate)+"<br>"):"";
 const oppLabel=m.players.filter(mp=>mp.team_id!==playerSession.teamId).length>1?"Opponents":"Opponent";
 $("playerMatchInfo").innerHTML="<strong>"+esc(formatLabel(r.format_code))+"</strong><br>"+mateLine+oppLabel+": "+esc(opp||"—")+'<br><span class="badge">'+esc(st.resultText)+"</span>";
 if(s?.gross_score&&h){
  const hp=strokesFor(m,r,player(playerSession.playerId)),nett=s.gross_score-holeStrokes(hp,h.stroke),pts=stableford(s.gross_score,h.par,hp,h.stroke);
  $("playerHoleResult").textContent="Saved: "+s.gross_score+" gross • "+nett+" nett"+(r.format_code==="stableford_count"?(" • "+pts+" pts"):"");
 }else $("playerHoleResult").textContent="No score saved for this hole yet.";
}

async function saveCourseHandicap(){
 if(!playerSession)return;
 const rid=$("playerRound").value,val=Number($("playerCourseHandicap").value);
 if(!rid||Number.isNaN(val)||val<0||val>54){$("courseHandicapStatus").textContent="Enter a valid course handicap from 0 to 54.";return}
 $("courseHandicapStatus").textContent="Saving…";
 const args={p_player_id:playerSession.playerId,p_password:playerSession.password,p_round_id:rid,p_course_handicap:val};
 const optimistic=()=>{bundle.course_handicaps=bundle.course_handicaps||[];const x=bundle.course_handicaps.find(v=>v.player_id===playerSession.playerId&&v.round_id===rid);if(x)x.course_handicap=val;else bundle.course_handicaps.push({player_id:playerSession.playerId,round_id:rid,course_handicap:val,updated_at:new Date().toISOString()});saveBundleCache();renderAll()};
 const {error,queued}=await writeRpc("tour_player_set_course_handicap",args,{optimistic});
 if(error){$("courseHandicapStatus").textContent=error.message;return}
 $("courseHandicapStatus").textContent=queued?"Saved offline • will sync":"Course handicap saved ✓";
 if(!queued)await load();
}
async function savePlayerScore(){
 if(!playerSession)return;
 const m=bundle.matches.find(x=>x.id===$("playerMatch").value),hole=Number($("playerHoleNumber").dataset.hole),gross=Number($("playerGross").value);
 if(!m||!gross||gross<1){$("playerScoreStatus").textContent="Enter your gross score.";return}
 $("playerScoreStatus").textContent="Saving…";
 const args={p_player_id:playerSession.playerId,p_password:playerSession.password,p_match_id:m.id,p_hole_no:hole,p_gross_score:gross,p_drive_used:$("playerDrive").value==="yes"};
 const optimistic=()=>{const existing=(bundle.scores||[]).find(s=>s.match_id===m.id&&s.player_id===playerSession.playerId&&Number(s.hole_no)===hole);if(existing){existing.gross_score=gross;existing.drive_used=args.p_drive_used}else{bundle.scores=bundle.scores||[];bundle.scores.push({match_id:m.id,team_id:playerSession.teamId,player_id:playerSession.playerId,hole_no:hole,gross_score:gross,drive_used:args.p_drive_used,updated_at:new Date().toISOString()})}saveBundleCache();renderAll()};
 const {error,queued}=await writeRpc("tour_player_save_score",args,{optimistic});
 if(error){$("playerScoreStatus").textContent=error.message;return}
 $("playerScoreStatus").textContent=queued?"Saved offline • will sync":"Score saved ✓";
 if(!queued)await load();
 $("playerHoleNumber").dataset.touched="1";
 if(hole<18)setPlayerHole(hole+1);
}
function captainTeamOptions(){const el=$("captainTeam"),old=el.value;el.innerHTML="";(bundle?.teams||[]).forEach(t=>el.add(new Option(t.name,t.id)));if([...el.options].some(o=>o.value===old))el.value=old}
function renderCaptain(){captainTeamOptions();$("captainLogout").classList.toggle("hidden",!captain);$("captainWorkspace").classList.toggle("hidden",!captain);if(!captain)return;const rs=bundle.rounds.filter(r=>[r.team_a_id,r.team_b_id].includes(captain.teamId));for(const id of["captainRoundSelect","captainScoreRound"]){const el=$(id),old=el.value;el.innerHTML="";rs.forEach(r=>el.add(new Option(`${r.round_no}. ${r.name}`,r.id)));if([...el.options].some(o=>o.value===old))el.value=old}renderLineupEditor();renderCaptainMatchSelect()}
async function captainLogin(){const teamId=$("captainTeam").value,password=$("captainPassword").value,{data,error}=await db.rpc("tour_captain_login",{p_team_id:teamId,p_password:password});if(error||!data?.length){$("captainStatus").textContent="Incorrect captain password.";return}captain={teamId,password,teamName:data[0].team_name};localStorage.setItem(CAPTAIN_SESSION_KEY,JSON.stringify(captain));$("captainPassword").value="";$("captainStatus").textContent=`Signed in: ${captain.teamName}`;renderCaptain()}
async function renderLineupEditor(){if(!captain||!bundle)return;const r=round($("captainRoundSelect").value),t=team(captain.teamId);if(!r||!t)return;const res=await db.rpc("tour_get_my_lineup",{p_team_id:t.id,p_password:captain.password,p_round_id:r.id}),existing=res.data||[];let html="";for(let m=1;m<=r.match_count;m++){html+=`<div class="lineup-match"><h3>Match ${m}</h3>`;for(let p=1;p<=r.players_per_side;p++){const current=existing.find(x=>Number(x.match_no)===m&&Number(x.position_no)===p)?.player_id||"";html+=`<label>Position ${p}<select class="lineupPlayer" data-match="${m}" data-pos="${p}"><option value="">Select player</option>${t.players.map(pl=>`<option value="${pl.id}" ${pl.id===current?"selected":""}>${esc(pl.name)}</option>`).join("")}</select></label>`}html+="</div>"}$("lineupEditor").innerHTML=html;$("lineupStatus").textContent=r.pairing_status==="published"?"Pairings published. Changes are allowed only before scoring starts.":r.pairing_status==="one_submitted"?"Waiting for the second captain.":""}
async function submitLineup(){const r=round($("captainRoundSelect").value),lineup=[...document.querySelectorAll(".lineupPlayer")].map(s=>({match_no:Number(s.dataset.match),position_no:Number(s.dataset.pos),player_id:s.value}));if(lineup.some(x=>!x.player_id)){return $("lineupStatus").textContent="Select every position."}if(new Set(lineup.map(x=>x.player_id)).size!==lineup.length)return $("lineupStatus").textContent="A player cannot be selected twice.";const {error,queued}=await writeRpc("tour_captain_submit_lineup",{p_team_id:captain.teamId,p_password:captain.password,p_round_id:r.id,p_lineup:lineup});if(error)return $("lineupStatus").textContent=error.message;$("lineupStatus").textContent=queued?"Line-up saved offline • will sync":"Line-up submitted.";if(!queued)await load()}
function renderCaptainMatchSelect(){if(!captain)return;const ms=matchesForRound($("captainScoreRound").value).filter(m=>[m.team_a_id,m.team_b_id].includes(captain.teamId)),el=$("captainMatchSelect"),old=el.value;el.innerHTML="";ms.forEach(m=>el.add(new Option(`Match ${m.match_no}`,m.id)));if([...el.options].some(o=>o.value===old))el.value=old;const h=$("captainHoleSelect"),oh=h.value;h.innerHTML="";for(let i=1;i<=18;i++)h.add(new Option(`Hole ${i}`,i));if([...h.options].some(o=>o.value===oh))h.value=oh;renderCaptainScoreRows()}
function renderCaptainScoreRows(){if(!captain)return;const m=bundle.matches.find(x=>x.id===$("captainMatchSelect").value);if(!m)return $("captainScoreRows").innerHTML='<p class="muted">No published match yet.</p>';const hole=Number($("captainHoleSelect").value||1);$("captainScoreRows").innerHTML=m.players.filter(x=>x.team_id===captain.teamId).map(mp=>{const p=player(mp.player_id),s=score(m.id,p.id,hole);return`<div class="score-row"><div><strong>${esc(p.name)}</strong><div class="small">HCP ${p.handicap}</div></div><label>Gross<input class="captainGross" data-player="${p.id}" type="number" min="1" max="20" value="${s?.gross_score||""}"></label><label>Drive used<select class="captainDrive" data-player="${p.id}"><option value="">No</option><option value="yes" ${s?.drive_used?"selected":""}>Yes</option></select></label></div>`}).join("")}
async function saveCaptainScores(){const m=bundle.matches.find(x=>x.id===$("captainMatchSelect").value),hole=Number($("captainHoleSelect").value);if(!m)return;for(const input of document.querySelectorAll(".captainGross")){const gross=Number(input.value),pid=input.dataset.player;if(!gross)return $("captainScoreStatus").textContent="Enter all scores.";const drive=document.querySelector(`.captainDrive[data-player="${pid}"]`).value==="yes",{error}=await writeRpc("tour_captain_save_score",{p_team_id:captain.teamId,p_password:captain.password,p_match_id:m.id,p_player_id:pid,p_hole_no:hole,p_gross_score:gross,p_drive_used:drive});if(error)return $("captainScoreStatus").textContent=error.message}$("captainScoreStatus").textContent="Scores saved.";await load()}
async function adminLogin(){const pass=$("adminPassword").value,{data,error}=await db.rpc("tour_verify_admin",{p_password:pass});if(error||data!==true)return $("adminStatus").textContent="Incorrect admin password.";adminUnlocked=true;adminPass=pass;$("adminPassword").value="";$("adminStatus").textContent="Admin unlocked.";renderAdmin()}
function renderAdmin(){$("adminLogout").classList.toggle("hidden",!adminUnlocked);$("adminWorkspace").classList.toggle("hidden",!adminUnlocked);if(!adminUnlocked)return;renderCurrentRoundAdmin();renderAdminPinControls();renderAdminScoreControls();renderBuilders()}
function formatOptions(sel){return[["stableford_count","Stableford – N scores count"],["betterball_scramble_drive","Betterball + Scramble Drive"],["singles_match_play","Singles Match Play"],["betterball_match_play","Betterball Match Play"],["gross_match_play","Gross Match Play"]].map(([v,l])=>`<option value="${v}" ${v===sel?"selected":""}>${l}</option>`).join("")}
function renderCurrentRoundAdmin(){if(!bundle)return $("currentRoundAdmin").innerHTML='<p class="muted">No tour published yet.</p>';$("currentRoundAdmin").innerHTML=bundle.rounds.map(r=>`<div class="builder-card" data-round="${r.id}"><h3>${esc(r.name)}</h3><div class="round-builder-grid"><label>Format<select class="arFormat">${formatOptions(r.format_code)}</select></label><label>Players / side<input class="arPlayers" type="number" min="1" max="8" value="${r.players_per_side}"></label><label>Matches<input class="arMatches" type="number" min="1" max="32" value="${r.match_count}"></label><label>Scores to count<input class="arCount" type="number" min="1" max="8" value="${r.scores_to_count}"></label><label>Handicap %<input class="arHcp" type="number" value="${r.handicap_allowance}"></label><label>Handicap method<select class="arMethod"><option value="off_lowest" ${r.handicap_method==="off_lowest"?"selected":""}>Off lowest player</option><option value="full" ${r.handicap_method==="full"?"selected":""}>Full playing handicap</option></select></label></div><button class="saveRoundSettings secondary">Save Round Settings</button> <span class="small">${r.pairing_status}</span></div>`).join("");document.querySelectorAll(".saveRoundSettings").forEach(b=>b.onclick=saveRoundSettings)}
async function saveRoundSettings(e){const card=e.target.closest("[data-round]"),r=round(card.dataset.round),payload={name:r.name,play_date:r.play_date||"",course_id:r.course_id,format_code:card.querySelector(".arFormat").value,players_per_side:Number(card.querySelector(".arPlayers").value),match_count:Number(card.querySelector(".arMatches").value),scores_to_count:Number(card.querySelector(".arCount").value),handicap_allowance:Number(card.querySelector(".arHcp").value),handicap_method:card.querySelector(".arMethod").value,min_drives:r.min_drives||0},{error}=await writeRpc("tour_admin_update_round",{p_admin_password:adminPass,p_round_id:r.id,p_payload:payload});if(error)return alert(error.message);await load()}

function renderAdminPinControls(){
 if(!$("adminPinTeam")||!bundle)return;
 const te=$("adminPinTeam"),oldT=te.value;te.innerHTML="";
 bundle.teams.forEach(t=>te.add(new Option(t.name,t.id)));
 if([...te.options].some(o=>o.value===oldT))te.value=oldT;
 renderAdminPinPlayers();
}
function renderAdminPinPlayers(){
 if(!$("adminPinPlayer")||!bundle)return;
 const pe=$("adminPinPlayer"),old=pe.value,t=team($("adminPinTeam").value);pe.innerHTML="";
 (t?.players||[]).forEach(p=>pe.add(new Option(p.name,p.id)));
 if([...pe.options].some(o=>o.value===old))pe.value=old;
}
async function saveAdminPlayerPin(){
 const pid=$("adminPinPlayer").value,pin=$("adminPinValue").value;
 if(!pid||pin.length<4){$("adminPinStatus").textContent="Enter a PIN/password of at least 4 characters.";return}
 const {error}=await writeRpc("tour_admin_set_player_password",{p_admin_password:adminPass,p_player_id:pid,p_new_password:pin});
 if(error){$("adminPinStatus").textContent=error.message;return}
 $("adminPinValue").value="";$("adminPinStatus").textContent="Player PIN saved.";
}
function renderAdminScoreControls(){if(!bundle)return;fillRoundSelect($("adminScoreRound"),true);renderAdminMatchSelect()}
function renderAdminMatchSelect(){const el=$("adminScoreMatch"),old=el.value;el.innerHTML="";matchesForRound($("adminScoreRound").value).forEach(m=>el.add(new Option(`Match ${m.match_no}`,m.id)));if([...el.options].some(o=>o.value===old))el.value=old;const h=$("adminScoreHole"),oh=h.value;h.innerHTML="";for(let i=1;i<=18;i++)h.add(new Option(`Hole ${i}`,i));if([...h.options].some(o=>o.value===oh))h.value=oh;renderAdminScoreRows()}
function renderAdminScoreRows(){const m=bundle?.matches.find(x=>x.id===$("adminScoreMatch").value);if(!m)return $("adminScoreRows").innerHTML='<p class="muted">No match selected.</p>';const hole=Number($("adminScoreHole").value||1);$("adminScoreRows").innerHTML=m.players.map(mp=>{const p=player(mp.player_id),t=team(mp.team_id),s=score(m.id,p.id,hole);return`<div class="score-row"><div><strong>${esc(p.name)}</strong><div class="small">${esc(t.name)}</div></div><label>Gross<input class="adminGross" data-player="${p.id}" data-team="${t.id}" type="number" min="1" max="20" value="${s?.gross_score||""}"></label><label>Drive<select class="adminDrive" data-player="${p.id}"><option value="">No</option><option value="yes" ${s?.drive_used?"selected":""}>Yes</option></select></label></div>`}).join("")}
async function saveAdminScores(){const m=bundle.matches.find(x=>x.id===$("adminScoreMatch").value),hole=Number($("adminScoreHole").value);if(!m)return;for(const i of document.querySelectorAll(".adminGross")){const gross=Number(i.value);if(!gross)return $("adminScoreStatus").textContent="Enter all scores.";const pid=i.dataset.player,tid=i.dataset.team,drive=document.querySelector(`.adminDrive[data-player="${pid}"]`).value==="yes",{error}=await writeRpc("tour_admin_save_score",{p_admin_password:adminPass,p_match_id:m.id,p_team_id:tid,p_player_id:pid,p_hole_no:hole,p_gross_score:gross,p_drive_used:drive});if(error)return $("adminScoreStatus").textContent=error.message}$("adminScoreStatus").textContent="Corrections saved.";await load()}
function saveDraft(){
 syncDraft();
 localStorage.setItem("golfTourDraftV4",JSON.stringify(draft));
 $("draftStatus").textContent="Draft saved on this device.";
 setTimeout(()=>{if($("draftStatus"))$("draftStatus").textContent=""},2200);
}
function restoreDraft(){
 try{
  const saved=localStorage.getItem("golfTourDraftV4");
  if(!saved)return;
  const parsed=JSON.parse(saved);
  if(parsed&&parsed.name&&Array.isArray(parsed.teams)&&Array.isArray(parsed.courses)&&Array.isArray(parsed.rounds)){
   Object.keys(draft).forEach(k=>delete draft[k]);
   Object.assign(draft,parsed);
   if(draft.rounds?.length>=3){
    Object.assign(draft.rounds[0],{format_code:"betterball_scramble_drive",players_per_side:2,match_count:4,scores_to_count:1,handicap_allowance:100,handicap_method:"full"});
    Object.assign(draft.rounds[1],{format_code:"betterball_match_play",players_per_side:2,match_count:4,scores_to_count:1,handicap_allowance:100,handicap_method:"full"});
    Object.assign(draft.rounds[2],{format_code:"singles_match_play",players_per_side:1,match_count:8,scores_to_count:1,handicap_allowance:100,handicap_method:"full"});
   }
  }
 }catch(e){console.warn("Could not restore draft",e)}
}
function renderBuilders(){$("tourName").value=draft.name;$("teamBuilder").innerHTML=draft.teams.map((t,ti)=>`<div class="builder-card teamBuild" data-ti="${ti}"><div class="team-builder-head"><input class="tbName" value="${esc(t.name)}"><button class="removeTeam secondary">Remove Team</button></div><div class="form-grid three"><label>Captain name<input class="tbCaptain" value="${esc(t.captain_name)}"></label><label>Captain password<input class="tbPass" value="${esc(t.captain_password)}"></label><span></span></div><div class="players">${t.players.map((p,pi)=>`<div class="player-builder"><input class="pbName" data-pi="${pi}" value="${esc(p.name)}" placeholder="Player name"><input class="pbHcp" data-pi="${pi}" type="number" value="${p.handicap}" placeholder="Base HCP optional"><input class="pbPin" data-pi="${pi}" type="text" inputmode="numeric" value="${esc(p.player_password||"")}" placeholder="Player PIN"><button class="removePlayer secondary" data-pi="${pi}">Remove</button></div>`).join("")}</div><button class="addPlayer secondary">+ Add Player</button></div>`).join("");$("courseBuilder").innerHTML=draft.courses.map((c,ci)=>`<div class="builder-card courseBuild" data-ci="${ci}"><div class="course-builder-head"><input class="cbName" value="${esc(c.name)}"><button class="removeCourse secondary">Remove Course</button></div><details><summary>18-hole setup</summary><div class="course-holes">${c.holes.map((h,hi)=>`<div class="hole-mini"><strong>Hole ${h.hole}</strong><label>Par<input class="chPar" data-hi="${hi}" type="number" value="${h.par}"></label><label>SI<input class="chSI" data-hi="${hi}" type="number" value="${h.stroke}"></label></div>`).join("")}</div></details></div>`).join("");$("roundBuilder").innerHTML=draft.rounds.map((r,ri)=>`<div class="builder-card roundBuild" data-ri="${ri}"><div class="section-title-row"><h3>Round ${ri+1}</h3><button class="removeRound secondary">Remove Round</button></div><div class="round-builder-grid"><label>Name<input class="rbName" value="${esc(r.name)}"></label><label>Date<input class="rbDate" type="date" value="${r.play_date}"></label><label>Course<select class="rbCourse">${draft.courses.map(c=>`<option value="${c.key}" ${c.key===r.course_key?"selected":""}>${esc(c.name)}</option>`).join("")}</select></label><label>Team A<select class="rbA">${draft.teams.map(t=>`<option value="${t.key}" ${t.key===r.team_a_key?"selected":""}>${esc(t.name)}</option>`).join("")}</select></label><label>Team B<select class="rbB">${draft.teams.map(t=>`<option value="${t.key}" ${t.key===r.team_b_key?"selected":""}>${esc(t.name)}</option>`).join("")}</select></label><label>Format<select class="rbFormat">${formatOptions(r.format_code)}</select></label><label>Players / side<input class="rbPlayers" type="number" value="${r.players_per_side}"></label><label>Matches<input class="rbMatches" type="number" value="${r.match_count}"></label><label>Scores to count<input class="rbCount" type="number" value="${r.scores_to_count}"></label><label>Handicap %<input class="rbHcp" type="number" value="${r.handicap_allowance}"></label><label>Handicap method<select class="rbMethod"><option value="off_lowest" ${r.handicap_method==="off_lowest"?"selected":""}>Off lowest player</option><option value="full" ${r.handicap_method==="full"?"selected":""}>Full playing handicap</option></select></label><label>Min drives<input class="rbDrives" type="number" value="${r.min_drives}"></label></div></div>`).join("");wireBuilders()}
function syncDraft(){draft.name=$("tourName").value;document.querySelectorAll(".teamBuild").forEach(card=>{const t=draft.teams[+card.dataset.ti];t.name=card.querySelector(".tbName").value;t.captain_name=card.querySelector(".tbCaptain").value;t.captain_password=card.querySelector(".tbPass").value;card.querySelectorAll(".player-builder").forEach(row=>{const p=t.players[+row.querySelector(".pbName").dataset.pi];p.name=row.querySelector(".pbName").value;p.handicap=Number(row.querySelector(".pbHcp").value)||0;p.player_password=row.querySelector(".pbPin")?.value||""})});document.querySelectorAll(".courseBuild").forEach(card=>{const c=draft.courses[+card.dataset.ci];c.name=card.querySelector(".cbName").value;card.querySelectorAll(".hole-mini").forEach(hm=>{const hi=+hm.querySelector(".chPar").dataset.hi;c.holes[hi].par=Number(hm.querySelector(".chPar").value);c.holes[hi].stroke=Number(hm.querySelector(".chSI").value)})});document.querySelectorAll(".roundBuild").forEach(card=>{const r=draft.rounds[+card.dataset.ri];r.name=card.querySelector(".rbName").value;r.play_date=card.querySelector(".rbDate").value;r.course_key=card.querySelector(".rbCourse").value;r.team_a_key=card.querySelector(".rbA").value;r.team_b_key=card.querySelector(".rbB").value;r.format_code=card.querySelector(".rbFormat").value;r.players_per_side=Number(card.querySelector(".rbPlayers").value);r.match_count=Number(card.querySelector(".rbMatches").value);r.scores_to_count=Number(card.querySelector(".rbCount").value);r.handicap_allowance=Number(card.querySelector(".rbHcp").value);r.handicap_method=card.querySelector(".rbMethod").value;r.min_drives=Number(card.querySelector(".rbDrives").value)||0})}
function wireBuilders(){document.querySelectorAll(".addPlayer").forEach(b=>b.onclick=e=>{syncDraft();const t=draft.teams[+e.target.closest(".teamBuild").dataset.ti];t.players.push({player_order:t.players.length+1,name:`Player ${t.players.length+1}`,handicap:0,player_password:""});renderBuilders()});document.querySelectorAll(".removePlayer").forEach(b=>b.onclick=e=>{syncDraft();const ti=+e.target.closest(".teamBuild").dataset.ti,pi=+e.target.dataset.pi;if(draft.teams[ti].players.length>1){draft.teams[ti].players.splice(pi,1);draft.teams[ti].players.forEach((p,i)=>p.player_order=i+1);renderBuilders()}});document.querySelectorAll(".removeTeam").forEach(b=>b.onclick=e=>{syncDraft();if(draft.teams.length>2){draft.teams.splice(+e.target.closest(".teamBuild").dataset.ti,1);renderBuilders()}});document.querySelectorAll(".removeCourse").forEach(b=>b.onclick=e=>{syncDraft();if(draft.courses.length>1){draft.courses.splice(+e.target.closest(".courseBuild").dataset.ci,1);renderBuilders()}});document.querySelectorAll(".removeRound").forEach(b=>b.onclick=e=>{syncDraft();if(draft.rounds.length>1){draft.rounds.splice(+e.target.closest(".roundBuild").dataset.ri,1);renderBuilders()}})}
function validateDraft(){if(draft.teams.length<2)return"Add at least two teams.";for(const t of draft.teams){if(!t.name||!t.captain_password)return`${t.name||"Team"}: name and captain password required.`;for(const p of t.players){if(!p.name)return`${t.name}: every player needs a name.`;if(!p.player_password||p.player_password.length<4)return`${t.name} — ${p.name}: player PIN/password must be at least 4 characters.`}}for(const c of draft.courses){const sis=c.holes.map(h=>h.stroke);if(new Set(sis).size!==18)return`${c.name}: Stroke Index must use 1–18 once each.`}for(const r of draft.rounds){const a=draft.teams.find(t=>t.key===r.team_a_key),b=draft.teams.find(t=>t.key===r.team_b_key),need=r.players_per_side*r.match_count;if(!a||!b||a===b)return`${r.name}: choose two different teams.`;if(a.players.length<need||b.players.length<need)return`${r.name}: each team needs ${need} players.`;if(r.scores_to_count>r.players_per_side)return`${r.name}: scores to count cannot exceed players per side.`}return""}
async function createTour(){syncDraft();const err=validateDraft();if(err)return $("createTourStatus").textContent=err;draft.teams.forEach((t,i)=>t.display_order=i+1);draft.courses.forEach((c,i)=>c.display_order=i+1);draft.rounds.forEach((r,i)=>r.round_no=i+1);if(!navigator.onLine)return $("createTourStatus").textContent="Creating a new live tour requires signal. Your draft is still saved on this phone.";const {error}=await db.rpc("tour_admin_create_event",{p_admin_password:adminPass,p_payload:draft});if(error)return $("createTourStatus").textContent=error.message;$("createTourStatus").textContent="Tour created.";$("newTourBuilder").classList.add("hidden");await load()}
function downloadPdf(){if(!bundle)return;const{jsPDF}=window.jspdf,doc=new jsPDF(),overall=overallPoints(),rows=bundle.teams.map(t=>({t,pts:overall[t.id]||0})).sort((a,b)=>b.pts-a.pts);doc.setFontSize(18);doc.text(bundle.event.name,14,16);let y=28;for(const[xi,x]of rows.entries()){doc.setFontSize(13);doc.text(`${xi+1}. ${x.t.name} — ${x.pts} points`,14,y);y+=7;doc.setFontSize(9);for(const r of bundle.rounds){doc.text(`${r.name} (${course(r.course_id)?.name||""}): ${roundPoints(r.id)[x.t.id]||0} points`,18,y);y+=5}y+=5;if(y>275){doc.addPage();y=18}}doc.save(`${bundle.event.name.replace(/[^a-z0-9]+/gi,"-")}-Results.pdf`)}

$("homeLiveRound").onchange=renderHomeLiveScoring;$("matchRoundSelect").onchange=renderMatches;$("playerTeam").onchange=populatePlayerNames;$("playerLogin").onclick=playerLogin;$("playerLogout").onclick=playerLogout;$("playerWorkspaceLogout").onclick=playerLogout;$("playerRound").onchange=renderPlayerMatches;$("saveCourseHandicap").onclick=saveCourseHandicap;$("playerMatch").onchange=()=>{$("playerHoleNumber").dataset.touched="";renderPlayerMatches()};$("playerPrevHole").onclick=()=>{$("playerHoleNumber").dataset.touched="1";setPlayerHole(Number($("playerHoleNumber").dataset.hole||1)-1)};$("playerNextHole").onclick=()=>{$("playerHoleNumber").dataset.touched="1";setPlayerHole(Number($("playerHoleNumber").dataset.hole||1)+1)};$("savePlayerScore").onclick=savePlayerScore;$("captainLogin").onclick=captainLogin;$("captainLogout").onclick=()=>{captain=null;localStorage.removeItem(CAPTAIN_SESSION_KEY);renderCaptain()};$("captainRoundSelect").onchange=renderLineupEditor;$("submitLineup").onclick=submitLineup;$("captainScoreRound").onchange=renderCaptainMatchSelect;$("captainMatchSelect").onchange=renderCaptainScoreRows;$("captainHoleSelect").onchange=renderCaptainScoreRows;$("saveCaptainScores").onclick=saveCaptainScores;$("adminPinTeam").onchange=renderAdminPinPlayers;$("savePlayerPin").onclick=saveAdminPlayerPin;$("adminLogin").onclick=adminLogin;$("adminLogout").onclick=()=>{adminUnlocked=false;adminPass="";renderAdmin()};$("startNewTour").onclick=()=>{$("newTourBuilder").classList.toggle("hidden");renderBuilders()};$("addTeam").onclick=()=>{syncDraft();const n=draft.teams.length+1;draft.teams.push({key:`team${Date.now()}`,name:`Team ${n}`,captain_name:"",captain_password:"",players:[]});renderBuilders()};$("addCourse").onclick=()=>{syncDraft();draft.courses.push({key:`course${Date.now()}`,name:`Course ${draft.courses.length+1}`,holes:clone(defaultHoles)});renderBuilders()};$("addRound").onclick=()=>{syncDraft();draft.rounds.push({round_no:draft.rounds.length+1,name:`Day ${draft.rounds.length+1}`,play_date:"",course_key:draft.courses[0]?.key||"",team_a_key:draft.teams[0]?.key||"",team_b_key:draft.teams[1]?.key||"",format_code:"singles_match_play",players_per_side:1,match_count:1,scores_to_count:1,handicap_allowance:100,handicap_method:"off_lowest",min_drives:0});renderBuilders()};$("saveTourDraft").onclick=saveDraft;$("createTour").onclick=createTour;$("adminScoreRound").onchange=renderAdminMatchSelect;$("adminScoreMatch").onchange=renderAdminScoreRows;$("adminScoreHole").onchange=renderAdminScoreRows;$("saveAdminScores").onclick=saveAdminScores;$("downloadPdf").onclick=downloadPdf;
restoreDraft();if("serviceWorker" in navigator){navigator.serviceWorker.register("./sw.js").catch(console.warn)}updateSyncStatus();db.channel("tour-live").on("postgres_changes",{event:"*",schema:"public",table:"tour_hole_scores"},load).on("postgres_changes",{event:"*",schema:"public",table:"tour_matches"},load).subscribe();load();

/* === Jacobsdal Tour phone-first enhancements === */
function notifyUser(message){
 let box=document.getElementById("appToast");
 if(!box){box=document.createElement("div");box.id="appToast";box.className="app-toast";document.body.appendChild(box)}
 box.textContent=message;box.classList.add("show");
 clearTimeout(notifyUser._t);notifyUser._t=setTimeout(()=>box.classList.remove("show"),2600);
}

function dailyCourseHandicap(playerId,roundId){
 const x=(bundle?.course_handicaps||[]).find(v=>v.player_id===playerId&&v.round_id===roundId);
 return x==null?null:Number(x.course_handicap);
}

function renderPlayerHoleStrip(){
 const wrap=$("playerHoleStrip");if(!wrap||!playerSession||!bundle)return;
 const m=bundle.matches.find(x=>x.id===$("playerMatch").value);if(!m){wrap.innerHTML="";return}
 const current=Number($("playerHoleNumber").dataset.hole||1);
 wrap.innerHTML=Array.from({length:18},(_,i)=>{
   const h=i+1,s=score(m.id,playerSession.playerId,h);
   return '<button type="button" class="hole-chip '+(s?'done ':'')+(h===current?'current':'')+'" data-hole="'+h+'">'+h+(s?' ✓':'')+'</button>';
 }).join("");
 wrap.querySelectorAll(".hole-chip").forEach(b=>b.onclick=()=>{$("playerHoleNumber").dataset.touched="1";setPlayerHole(Number(b.dataset.hole));renderPlayerHoleStrip();enhancePlayerScoring()});
}

function enhancePlayerScoring(){
 if(!playerSession||!bundle||!$("playerMatch"))return;
 renderPlayerHoleStrip();
 const m=bundle.matches.find(x=>x.id===$("playerMatch").value);if(!m)return;
 const r=round(m.round_id),crs=course(r.course_id),hn=Number($("playerHoleNumber").dataset.hole||1),h=crs?.holes?.find(x=>Number(x.hole)===hn);
 const ch=dailyCourseHandicap(playerSession.playerId,r.id);
 if(h){
   const shots=ch==null?null:holeStrokes(Math.round(ch*Number(r.handicap_allowance||100)/100),h.stroke);
   $("playerHoleMeta").textContent="Par "+h.par+" • SI "+h.stroke+(ch==null?" • CH needed":(" • CH "+ch+" • "+shots+" shot"+(shots===1?"":"s")));
 }
 const st=matchState(m),btn=$("savePlayerScore");
 if(btn){
   const closed=st.complete&&hn>st.thru;
   btn.disabled=closed;
   if(closed){btn.textContent="Match Finished • "+st.resultText}
   else btn.textContent="Save & Next Hole";
 }
}

function adjustGross(delta){
 const el=$("playerGross");if(!el)return;
 let v=Number(el.value)||0;
 if(!v&&delta>0)v=3; else v+=delta;
 v=Math.max(1,Math.min(20,v));el.value=v;
}

async function enhancedSavePlayerScore(){
 if(!playerSession)return;
 const m=bundle.matches.find(x=>x.id===$("playerMatch").value);if(!m)return;
 const r=round(m.round_id),ch=dailyCourseHandicap(playerSession.playerId,r.id);
 if(ch==null){
   $("playerScoreStatus").textContent="Enter and save your Course Handicap for this round first.";
   $("playerCourseHandicap").focus();notifyUser("Course Handicap required first");return;
 }
 const before=Number($("playerHoleNumber").dataset.hole||1);
 await savePlayerScore();
 const msg=$("playerScoreStatus").textContent;
 if(/offline/i.test(msg))notifyUser("Score saved on phone • will sync");
 else if(/saved/i.test(msg))notifyUser("Hole "+before+" saved ✓");
 enhancePlayerScoring();
}

function matchPlayerProgress(m,pid){
 let latest=0,count=0;
 for(let h=1;h<=18;h++){if(score(m.id,pid,h)){latest=h;count++}}
 return {latest,count};
}

function renderCaptainDashboard(){
 const el=$("captainDashboard");if(!el||!captain||!bundle)return;
 const rid=$("captainRoundSelect")?.value||bundle.rounds.find(r=>[r.team_a_id,r.team_b_id].includes(captain.teamId))?.id;
 const r=round(rid);if(!r){el.innerHTML='<p class="muted">No round selected.</p>';return}
 const ms=matchesForRound(r.id),t=team(captain.teamId);
 const people=(t?.players||[]).map(p=>{
   const m=ms.find(x=>x.players.some(mp=>mp.player_id===p.id));
   const prog=m?matchPlayerProgress(m,p.id):{latest:0,count:0};
   const ch=dailyCourseHandicap(p.id,r.id);
   return '<div class="captain-player-row"><div><strong>'+esc(p.name)+'</strong><small>'+(m?'Match '+m.match_no:'Not paired')+'</small></div><span class="mini-pill '+(ch==null?'warn':'ok')+'">CH '+(ch==null?'Missing':ch)+'</span><span class="mini-pill">'+(prog.count?('Hole '+prog.latest):'No score')+'</span></div>';
 }).join("");
 const complete=ms.filter(m=>matchState(m).complete).length;
 el.innerHTML='<div class="dashboard-summary"><strong>'+esc(r.name)+' • '+esc(course(r.course_id)?.name||"")+'</strong><span>'+complete+' / '+ms.length+' matches complete</span></div>'+people;
}

function renderAdminTourControl(){
 const el=$("adminTourControl");if(!el||!adminUnlocked||!bundle)return;
 el.innerHTML=bundle.rounds.map(r=>{
   const ms=matchesForRound(r.id),done=ms.filter(m=>matchState(m).complete).length;
   const pairedPlayers=[...new Set(ms.flatMap(m=>m.players.map(mp=>mp.player_id)))];
   const missing=pairedPlayers.filter(pid=>dailyCourseHandicap(pid,r.id)==null);
   const hcpRows=pairedPlayers.map(pid=>{const p=player(pid),ch=dailyCourseHandicap(pid,r.id);return '<div class="admin-hcp-row"><span>'+esc(p?.name||"Player")+'</span><input class="adminDailyHcp" data-round="'+r.id+'" data-player="'+pid+'" type="number" min="0" max="54" inputmode="decimal" value="'+(ch??'')+'" placeholder="CH"><button type="button" class="saveAdminDailyHcp secondary" data-round="'+r.id+'" data-player="'+pid+'">Save</button></div>'}).join("");
   return '<div class="admin-round-control"><div><strong>'+esc(r.name)+' • '+esc(course(r.course_id)?.name||"")+'</strong><small>'+esc(formatLabel(r.format_code))+'</small></div><span class="mini-pill">'+done+'/'+ms.length+' finished</span><span class="mini-pill '+(missing.length?'warn':'ok')+'">'+(missing.length?(missing.length+' CH missing'):'All CH entered')+'</span><details><summary>Course handicaps</summary><div class="admin-hcp-list">'+hcpRows+'</div></details></div>';
 }).join("");
 el.querySelectorAll(".saveAdminDailyHcp").forEach(b=>b.onclick=saveAdminDailyHcp);
}
async function saveAdminDailyHcp(e){
 const b=e.currentTarget,rid=b.dataset.round,pid=b.dataset.player;
 const input=document.querySelector('.adminDailyHcp[data-round="'+rid+'"][data-player="'+pid+'"]');
 const val=Number(input?.value);
 if(Number.isNaN(val)||val<0||val>54){notifyUser("Enter a Course Handicap from 0 to 54");return}
 b.disabled=true;b.textContent="Saving…";
 const {error}=await writeRpc("tour_admin_set_course_handicap",{p_admin_password:adminPass,p_player_id:pid,p_round_id:rid,p_course_handicap:val},{queueWhenOffline:false});
 b.disabled=false;b.textContent="Save";
 if(error){notifyUser(error.message);return}
 notifyUser("Course Handicap saved ✓");await load();
}

function playerStats(){
 const stats={};
 for(const t of bundle.teams)for(const p of t.players)stats[p.id]={p,team:t,birdies:0,holesWon:0,played:0,lost:0,won:0,halved:0};
 for(const s of bundle.scores||[]){
   const m=bundle.matches.find(x=>x.id===s.match_id),r=m&&round(m.round_id),c=r&&course(r.course_id),h=c?.holes?.find(x=>Number(x.hole)===Number(s.hole_no));
   if(h&&Number(s.gross_score)<Number(h.par)&&stats[s.player_id])stats[s.player_id].birdies++;
 }
 for(const m of bundle.matches||[]){
   const r=round(m.round_id),c=course(r.course_id),st=matchState(m);
   for(const mp of m.players){if(st.complete&&stats[mp.player_id])stats[mp.player_id].played++}
   if(st.complete){
     for(const mp of m.players){
       const s=stats[mp.player_id];if(!s)continue;
       if(st.lead===0)s.halved++;else{
         const won=(st.lead>0&&mp.team_id===m.team_a_id)||(st.lead<0&&mp.team_id===m.team_b_id);
         if(won)s.won++;else s.lost++;
       }
     }
   }
   if(!c)continue;
   for(const h of c.holes){
     if(!m.players.every(mp=>score(m.id,mp.player_id,h.hole)))break;
     const ap=m.players.filter(x=>x.team_id===m.team_a_id),bp=m.players.filter(x=>x.team_id===m.team_b_id);
     const calc=mp=>{const p=player(mp.player_id),ss=score(m.id,p.id,h.hole);return r.format_code==="gross_match_play"?ss.gross_score:ss.gross_score-holeStrokes(strokesFor(m,r,p),h.stroke)};
     const av=Math.min(...ap.map(calc)),bv=Math.min(...bp.map(calc));
     const winners=av<bv?ap:bv<av?bp:[];
     winners.forEach(mp=>{if(stats[mp.player_id])stats[mp.player_id].holesWon++});
   }
 }
 return Object.values(stats);
}

function renderTourHighlights(){
 const el=$("tourHighlights");if(!el||!bundle)return;
 const s=playerStats(),bird=[...s].sort((a,b)=>b.birdies-a.birdies)[0],holes=[...s].sort((a,b)=>b.holesWon-a.holesWon)[0];
 const unbeaten=s.filter(x=>x.played>0&&x.lost===0).sort((a,b)=>b.won-a.won);
 el.innerHTML='<div class="section-title-row"><div><h2>Tour Highlights</h2><p class="muted">Updates live from submitted scores.</p></div></div><div class="highlight-grid">'+
   '<div class="highlight-card"><span>Most Birdies</span><strong>'+(bird?.birdies?esc(bird.p.name):'—')+'</strong><small>'+(bird?.birdies||0)+' birdies</small></div>'+
   '<div class="highlight-card"><span>Most Holes Won</span><strong>'+(holes?.holesWon?esc(holes.p.name):'—')+'</strong><small>'+(holes?.holesWon||0)+' holes</small></div>'+
   '<div class="highlight-card"><span>Unbeaten</span><strong>'+(unbeaten.length?unbeaten.slice(0,3).map(x=>esc(x.p.name)).join(", "):'—')+'</strong><small>'+(unbeaten.length?'No match losses':'No completed record yet')+'</small></div>'+
 '</div>';
}

function publicTourUrl(){
 const u=new URL(location.href);u.searchParams.set("spectator","1");u.hash="";return u.toString();
}
function renderTourQr(){
 const el=$("tourQr");if(!el)return;el.innerHTML="";
 if(window.QRCode)new QRCode(el,{text:publicTourUrl(),width:180,height:180,correctLevel:QRCode.CorrectLevel.M});
 else el.innerHTML='<p class="muted">QR code needs an internet connection the first time. The share button still works.</p>';
}
async function shareLiveTour(){
 const url=publicTourUrl(),title=(bundle?.event?.name||"Jacobsdal Golf Tour")+" — Live";
 try{
   if(navigator.share)await navigator.share({title,text:"Follow the live golf tour scores",url});
   else{await navigator.clipboard.writeText(url);notifyUser("Live tour link copied");}
 }catch(e){}
}
function applySpectatorMode(){
 if(new URLSearchParams(location.search).get("spectator")!=="1")return;
 document.body.classList.add("spectator-mode");
 document.querySelectorAll(".tab-btn").forEach(b=>{if(b.dataset.tab!=="home")b.classList.add("hidden")});
 showTab("home");
}

const _renderHome=renderHome;
renderHome=function(){_renderHome();renderTourHighlights();renderTourQr()};

const _renderPlayer=renderPlayer;
renderPlayer=function(){
 _renderPlayer();
 if(playerSession&&bundle&&$("playerRound")){
   const today=new Date().toISOString().slice(0,10);
   const todays=bundle.rounds.find(r=>r.play_date===today&&matchesForRound(r.id).some(m=>m.players.some(mp=>mp.player_id===playerSession.playerId)));
   if(todays&&$("playerRound").value!==todays.id){$("playerRound").value=todays.id;renderPlayerMatches()}
   enhancePlayerScoring();
 }
};

const _setPlayerHole=setPlayerHole;
setPlayerHole=function(n){_setPlayerHole(n);enhancePlayerScoring()};

const _renderCaptain=renderCaptain;
renderCaptain=function(){_renderCaptain();renderCaptainDashboard()};

const _renderAdmin=renderAdmin;
renderAdmin=function(){_renderAdmin();renderAdminTourControl()};

// Rebind controls that need the enhanced phone experience.
if($("scoreMinus"))$("scoreMinus").onclick=()=>adjustGross(-1);
if($("scorePlus"))$("scorePlus").onclick=()=>adjustGross(1);
if($("savePlayerScore"))$("savePlayerScore").onclick=enhancedSavePlayerScore;
async function shareResults(){
 if(!bundle)return;
 const pts=overallPoints(),winner=tourWinner();
 const lines=[bundle.event.name,winner?("🏆 "+winner.name+" wins "+pts[winner.id]+" points"):("Live standings • "+pointsToWin()+" points wins")];
 bundle.teams.slice().sort((a,b)=>(pts[b.id]||0)-(pts[a.id]||0)).forEach(t=>lines.push(t.name+": "+(pts[t.id]||0)+" pts"));
 const text=lines.join("\n"),url=publicTourUrl();
 try{
   if(navigator.share)await navigator.share({title:bundle.event.name+" Results",text,url});
   else{await navigator.clipboard.writeText(text+"\n"+url);notifyUser("Results copied to clipboard");}
 }catch(e){}
}
if($("shareLiveTour"))$("shareLiveTour").onclick=shareLiveTour;
if($("shareResults"))$("shareResults").onclick=shareResults;
if($("syncNow"))$("syncNow").onclick=async()=>{notifyUser(navigator.onLine?"Syncing…":"Still offline • scores remain safe on this phone");await flushQueue();updateSyncStatus();if(navigator.onLine)notifyUser(getQueue().length?"Some items still waiting":"All scores synced ✓")};
if($("captainRefresh"))$("captainRefresh").onclick=async()=>{await load();renderCaptainDashboard()};
if($("adminRefresh"))$("adminRefresh").onclick=async()=>{await load();renderAdminTourControl()};
if($("captainRoundSelect"))$("captainRoundSelect").addEventListener("change",renderCaptainDashboard);
if($("playerRound"))$("playerRound").addEventListener("change",()=>setTimeout(enhancePlayerScoring,0));
if($("playerMatch"))$("playerMatch").addEventListener("change",()=>setTimeout(enhancePlayerScoring,0));
window.addEventListener("online",()=>notifyUser("Signal restored • syncing scores"));
window.addEventListener("offline",()=>notifyUser("Offline • scores will stay saved on this phone"));
applySpectatorMode();
setTimeout(()=>{renderTourHighlights();renderTourQr();if(playerSession)enhancePlayerScoring();if(captain)renderCaptainDashboard();if(adminUnlocked)renderAdminTourControl()},300);
