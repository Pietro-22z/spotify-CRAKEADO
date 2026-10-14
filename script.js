const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const tracks = [
  {id:1,title:'Quero Ser Feliz',artist:'Natiurts',genre:'Reggae',lyrics:'Cresça\nindependente do\nque aconteça',cover:['#f0eee8','#9a5a1f','#27452c']},
  {id:2,title:'Peso Pluma',artist:'Peso Pluma',genre:'Música',lyrics:'Vibração, noite e som.',cover:['#10104a','#673e9e','#f06d31']},
  {id:3,title:'Charlie Brown',artist:'Charlie Brown Jr.',genre:'Rock',lyrics:'Faixa disponível oficialmente no Spotify.',cover:['#eee','#111','#b21f2d'],duration:273,spotifyUrl:'https://open.spotify.com/track/7B7Lc3vQjuiaNpFxqv64ci'},
  {id:12,title:'Como Tudo Deve Ser',artist:'Charlie Brown Jr.',genre:'Rock',lyrics:'Ouça a faixa completa no Spotify.',cover:['#17221d','#d7a94b','#b43b2f'],duration:273,spotifyUrl:'https://open.spotify.com/track/7B7Lc3vQjuiaNpFxqv64ci'},
  {id:4,title:'Red Hot',artist:'Red Hot Chili Peppers',genre:'Rock',lyrics:'Uma sessão demonstrativa.',cover:['#222','#a73528','#d2c07c']},
  {id:5,title:'MPB',artist:'Coletânea MPB',genre:'Música',lyrics:'Canção brasileira.',cover:['#8d1b24','#d9a74d','#263a50']},
  {id:6,title:'Palácios e Castelos',artist:'Natiurts',genre:'Música',lyrics:'Histórias em forma de música.',cover:['#f4c3d7','#7b4f88','#2c304d']},
  {id:7,title:'Malcolm Todd',artist:'Malcolm Todd',genre:'Música',lyrics:'Som alternativo.',cover:['#e5b184','#51402f','#7e9a87']},
  {id:8,title:'sei nao',artist:'Playlist demonstrativa',genre:'Música',lyrics:'Uma seleção para ouvir.',cover:['#7e5f3f','#203b52','#c9a64d']},
  {id:9,title:'Pitty',artist:'Pitty',genre:'Música',lyrics:'Pré-save demonstrativo.',cover:['#111','#888','#ddd']},
  {id:10,title:'Confiar',artist:'Coletânea',genre:'Música',lyrics:'Confie no processo.',cover:['#302f62','#b3433e','#c5b99a']},
  {id:11,title:'Thalles',artist:'Thalles Roberto',genre:'Música',lyrics:'Faixa demonstrativa.',cover:['#57b5df','#eee','#182e49']}
];

const playlists = [
  {id:'liked',name:'Músicas Curtidas',tracks:[1,3,4,5,12]},
  {id:'reggae',name:'Reggae',tracks:[1,6]},
  {id:'peso',name:'Peso Pluma',tracks:[2,8]},
  {id:'pagode',name:'Pagode',tracks:[5,10]},
  {id:'blindado',name:'Eu Sou Blindado',tracks:[7,11]}
];

let current = tracks[0], index = 0, playing = false, shuffle = false, repeat = false, libraryMode='playlists';
let audioCtx = null, gainNode = null, timer = null, melodyTimer = null, startedAt = 0, pausedAt = 0, duration = 254;
const liked = new Set(JSON.parse(localStorage.getItem('likedTracks') || '[1]'));
const customPlaylists = JSON.parse(localStorage.getItem('customPlaylists') || '[]');

function svgCover(t){
  const [a,b,c]=t.cover;
  const text=t.title.replace(/&/g,'&amp;').slice(0,15);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="500" height="500" fill="url(#g)"/><circle cx="410" cy="90" r="75" fill="white" opacity=".12"/><circle cx="120" cy="390" r="130" fill="black" opacity=".14"/><text x="28" y="445" fill="white" font-family="Arial" font-size="36" font-weight="700">${text}</text></svg>`)}`;
}
function findTrack(id){return tracks.find(t=>t.id===Number(id)) || tracks[0]}
function fmt(s){s=Math.max(0,Math.floor(s));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function setTrack(t, autoplay=false){current=t; index=tracks.findIndex(x=>x.id===t.id); duration=t.duration||254; updatePlayer(); updateNowPlaying(); $('#progress').value=0; $('#currentTime').textContent='0:00'; $('#duration').textContent=fmt(duration); if(autoplay) play(); else stopAudio()}
function updatePlayer(){const src=svgCover(current);$('#playerCover').src=src;$('#npCover').src=src;$('#playerTitle').textContent=current.title;$('#playerArtist').textContent=current.artist;$('#npTitle').textContent=current.title;$('#npArtist').textContent=current.artist;$('#lyricsText').innerHTML=current.lyrics.replace(/\n/g,'<br>');$('#aboutArtist').textContent=current.artist;$('#playerLike').textContent=liked.has(current.id)?'♥':'♡';$('#likeCurrent').textContent=liked.has(current.id)?'♥':'♡';}
function updateNowPlaying(){
  const link=$('#spotifyLink');
  if(link){
    link.href=current.spotifyUrl||'#';
    link.style.display=current.spotifyUrl?'inline-flex':'none';
  }
}
function renderQuick(filter='all'){
  const arr=tracks.slice(0,8).filter(t=>filter==='all'||(filter==='music'&&t.genre!=='Podcast')||(filter==='podcast'&&t.genre==='Podcast'));
  $('#quickGrid').innerHTML=arr.map(t=>`<div class="quick-card" data-track="${t.id}"><img src="${svgCover(t)}"><b>${t.title}</b></div>`).join('');
  $$('#quickGrid [data-track]').forEach(el=>el.onclick=()=>setTrack(findTrack(el.dataset.track),true));
}
function renderHome(){
  renderQuick();
  $('#releaseGrid').innerHTML=tracks.slice(8,9).map(t=>card(t,'release-card')).join('');
  $('#playlistCards').innerHTML=playlists.slice(1).map(p=>playlistCard(p)).join('');
  $('#recentGrid').innerHTML=tracks.slice(0,9).map(t=>`<div class="recent-card" data-track="${t.id}"><img src="${svgCover(t)}"></div>`).join('');
  $$('#recentGrid [data-track]').forEach(el=>el.onclick=()=>setTrack(findTrack(el.dataset.track),true));
  $$('#releaseGrid [data-track]').forEach(el=>el.onclick=()=>setTrack(findTrack(el.dataset.track),true));
  $$('#playlistCards [data-playlist]').forEach(el=>el.onclick=()=>openPlaylist(el.dataset.playlist));
}
function card(t,cls='result'){return `<div class="${cls}" data-track="${t.id}"><img class="cover" src="${svgCover(t)}"><b>${t.title}</b><small class="artist-click" data-artist="${t.artist}">${t.artist}</small></div>`}
function playlistCard(p){const t=findTrack(p.tracks[0]);return `<div class="playlist-card" data-playlist="${p.id}"><img class="cover" src="${svgCover(t)}"><b>${p.name}</b><small>De Pietro</small></div>`}
function renderPlaylists(){const all=[...playlists,...customPlaylists];$('#playlistList').innerHTML=all.map(p=>`<button data-playlist="${p.id}">${p.name}</button>`).join('');$$('#playlistList [data-playlist]').forEach(el=>el.onclick=()=>openPlaylist(el.dataset.playlist));}
function openPlaylist(id){const p=[...playlists,...customPlaylists].find(x=>x.id===id);if(!p)return;showView('playlist');const t=findTrack(p.tracks[0]);$('#playlistView').innerHTML=`<div class="detail-hero"><img src="${svgCover(t)}"><div><span>Playlist</span><h1>${p.name}</h1><p>De Pietro • ${p.tracks.length} faixas</p><button class="primary-action" id="playlistPlay">▶ Reproduzir</button></div></div><div class="detail-toolbar"><button class="round-action" id="playlistLike">♡</button><button class="text-action">•••</button></div><div class="track-table">${p.tracks.map((id,i)=>{const tr=findTrack(id);return `<div class="track-row" data-track="${tr.id}"><span>${i+1}</span><img src="${svgCover(tr)}"><div><b>${tr.title}</b><small>${tr.artist}</small></div><span>${fmt(tr.duration||254)}</span></div>`}).join('')}</div>`;$('#playlistView [data-track]').forEach?.(()=>{});$$('#playlistView [data-track]').forEach(el=>el.onclick=()=>setTrack(findTrack(el.dataset.track),true));$('#playlistPlay').onclick=()=>setTrack(t,true);}
function search(q){q=q.trim().toLowerCase();if(!q){showView('home');return}showView('search');const results=tracks.filter(t=>`${t.title} ${t.artist} ${t.genre}`.toLowerCase().includes(q));$('#searchResults').innerHTML=results.length?results.map(t=>card(t)).join(''):`<div style="grid-column:1/-1;color:#aaa">Nenhum resultado para “${q}”.</div>`;$$('#searchResults [data-track]').forEach(el=>el.onclick=()=>setTrack(findTrack(el.dataset.track),true));}
function showView(view, push=true){$$('.view').forEach(v=>v.classList.add('hidden'));const target=$(`#${view}View`);if(target)target.classList.remove('hidden');$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===view));if(push&&location.hash!=='#'+view)history.pushState({view},'', '#'+view);}
function renderLibrary(){const all=[...playlists,...customPlaylists];if(libraryMode==='playlists')$('#libraryResults').innerHTML=all.map(playlistCard).join('');else $('#libraryResults').innerHTML=[...liked].map(findTrack).map(t=>card(t)).join('')||'<p style="color:#aaa">Você ainda não curtiu nenhuma música.</p>';$$('#libraryResults [data-track]').forEach(el=>el.onclick=()=>setTrack(findTrack(el.dataset.track),true));$$('#libraryResults [data-playlist]').forEach(el=>el.onclick=()=>openPlaylist(el.dataset.playlist));}

function renderArtistPage(name){
  const artistTracks=tracks.filter(t=>t.artist.toLowerCase()===name.toLowerCase());
  const sample=artistTracks[0]||current;
  showView('artist');
  $('#artistView').innerHTML=`<div class="artist-hero-page"><div class="artist-big-photo" style="background-image:url('${svgCover(sample)}')"></div><div><span>Artista</span><h1>${name}</h1><p>${(artistTracks.length*120000+7306327).toLocaleString('pt-BR')} ouvintes mensais</p><button class="primary-action" id="artistPlay">▶ Reproduzir</button><button class="outline-action" id="artistFollow">Seguir</button></div></div><section class="detail-section"><h2>Principais músicas</h2><div class="track-table">${(artistTracks.length?artistTracks:tracks.slice(0,5)).map((tr,i)=>`<div class="track-row" data-track="${tr.id}"><span>${i+1}</span><img src="${svgCover(tr)}"><div><b>${tr.title}</b><small>${tr.artist}</small></div><span>${fmt(tr.duration||254)}</span></div>`).join('')}</div></section><section class="detail-section"><h2>Sobre</h2><p class="muted">Página demonstrativa do artista dentro deste projeto. Os dados e imagens são locais e servem apenas para o protótipo.</p></section>`;
  $$('#artistView [data-track]').forEach(el=>el.onclick=()=>setTrack(findTrack(el.dataset.track),true));
  $('#artistPlay').onclick=()=>setTrack(artistTracks[0]||tracks[0],true);
  $('#artistFollow').onclick=()=>{const b=$('#artistFollow');b.textContent=b.textContent==='Seguir'?'Seguindo':'Seguir';toast(b.textContent==='Seguindo'?'Artista seguido':'Deixou de seguir')};
}
function renderAlbumPage(title){
  const albumTracks=title==='Como Tudo Deve Ser'?tracks.filter(t=>t.id===12||t.id===3):tracks.slice(0,5); const first=albumTracks[0];
  showView('album');
  $('#albumView').innerHTML=`<div class="album-hero"><img src="${svgCover(first)}"><div><span>Álbum</span><h1>${title}</h1><p>${first.artist} • 2026 • ${albumTracks.length} faixas</p><button class="primary-action" id="albumPlay">▶ Reproduzir</button></div></div><div class="track-table">${albumTracks.map((tr,i)=>`<div class="track-row" data-track="${tr.id}"><span>${i+1}</span><img src="${svgCover(tr)}"><div><b>${tr.title}</b><small>${tr.artist}</small></div><span>${fmt(tr.duration||254)}</span></div>`).join('')}</div>`;
  $$('#albumView [data-track]').forEach(el=>el.onclick=()=>setTrack(findTrack(el.dataset.track),true));$('#albumPlay').onclick=()=>setTrack(first,true);
}
function renderProfile(){showView('profile');$('#profileView').innerHTML=`<div class="profile-page"><div class="profile-avatar">P</div><h1>Pietro</h1><p class="muted">Perfil local do protótipo</p><div class="profile-grid"><div><strong>${playlists.length+customPlaylists.length}</strong><span>Playlists</span></div><div><strong>${liked.size}</strong><span>Curtidas</span></div><div><strong>${tracks.length}</strong><span>Faixas</span></div></div><button class="outline-action" id="settingsFromProfile">Configurações</button></div>`;$('#settingsFromProfile').onclick=()=>renderSettings()}
function renderPremium(){showView('premium');$('#premiumView').innerHTML=`<div class="premium-page"><span>Spotify Real</span><h1>Escolha seu plano</h1><p class="muted">Página visual demonstrativa. Nenhum pagamento é processado.</p><div class="plans"><div class="plan"><h2>Grátis</h2><p>Recursos básicos</p><b>R$ 0</b><button>Plano atual</button></div><div class="plan featured"><h2>Premium</h2><p>Experiência sem interrupções</p><b>R$ 21,90/mês</b><button id="fakePremium">Escolher Premium</button></div><div class="plan"><h2>Família</h2><p>Para várias pessoas</p><b>R$ 34,90/mês</b><button id="fakeFamily">Escolher Família</button></div></div></div>`;$('#fakePremium').onclick=()=>toast('Checkout demonstrativo');$('#fakeFamily').onclick=()=>toast('Checkout demonstrativo')}
function renderSettings(){showView('settings');$('#settingsView').innerHTML=`<div class="settings-page"><h1>Configurações</h1><p class="muted">Preferências salvas somente neste navegador.</p><div class="settings-card"><label>Qualidade de áudio<select><option>Automática</option><option>Alta</option><option>Muito alta</option></select></label><label>Reprodução contínua<input type="checkbox" checked></label><label>Mostrar painel Agora tocando<input type="checkbox" checked id="toggleNp"></label><label>Modo compacto<input type="checkbox" id="compactMode"></label></div><button class="outline-action" id="clearData">Limpar dados locais</button></div>`;$('#toggleNp').onchange=e=>$('.now-playing').style.display=e.target.checked?'block':'none';$('#compactMode').onchange=e=>document.body.classList.toggle('compact',e.target.checked);$('#clearData').onclick=()=>{localStorage.clear();toast('Dados locais apagados. Recarregue a página.')}}

function ensureAudio(){if(audioCtx)return;audioCtx=new (window.AudioContext||window.webkitAudioContext)();gainNode=audioCtx.createGain();gainNode.gain.value=Number($('#volume').value);gainNode.connect(audioCtx.destination)}
function play(){ensureAudio();if(audioCtx.state==='suspended')audioCtx.resume();playing=true;startedAt=audioCtx.currentTime-pausedAt;$('#playBtn').textContent='Ⅱ';clearInterval(timer);timer=setInterval(tick,250);startMelody();toast('Reprodução de demonstração iniciada')}
function pause(){if(!playing)return;pausedAt=audioCtx.currentTime-startedAt;playing=false;$('#playBtn').textContent='▶';clearInterval(timer);clearInterval(melodyTimer)}
function stopAudio(){if(playing)pause();pausedAt=0;$('#playBtn').textContent='▶'}
function tick(){let t=audioCtx.currentTime-startedAt;if(t>=duration){if(repeat){pausedAt=0;startedAt=audioCtx.currentTime;return}next();return}$('#progress').value=t/duration*100;$('#currentTime').textContent=fmt(t);$('#duration').textContent=fmt(duration)}
function startMelody(){clearInterval(melodyTimer);const notes=[261.63,329.63,392,329.63,293.66,349.23,440,349.23];let n=0;const note=()=>{if(!playing||!audioCtx)return;const osc=audioCtx.createOscillator();const env=audioCtx.createGain();osc.type='sine';osc.frequency.value=notes[n++%notes.length];env.gain.setValueAtTime(0.0001,audioCtx.currentTime);env.gain.exponentialRampToValueAtTime(Math.max(0.001,Number($('#volume').value)*0.06),audioCtx.currentTime+0.02);env.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+0.32);osc.connect(env);env.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+0.34)};note();melodyTimer=setInterval(note,400)}
function next(){let nextIndex=shuffle?Math.floor(Math.random()*tracks.length):(index+1)%tracks.length;setTrack(tracks[nextIndex],playing)}
function prev(){let prevIndex=(index-1+tracks.length)%tracks.length;setTrack(tracks[prevIndex],playing)}
function toggleLike(){if(liked.has(current.id))liked.delete(current.id);else liked.add(current.id);localStorage.setItem('likedTracks',JSON.stringify([...liked]));updatePlayer();renderLibrary();toast(liked.has(current.id)?'Adicionada às músicas curtidas':'Removida das músicas curtidas')}
function addPlaylist(){const name=prompt('Nome da nova playlist:');if(!name)return;const p={id:'custom-'+Date.now(),name,tracks:[current.id]};customPlaylists.push(p);localStorage.setItem('customPlaylists',JSON.stringify(customPlaylists));renderPlaylists();renderLibrary();toast('Playlist criada')}

$('#playBtn').onclick=()=>playing?pause():play();$('#nextBtn').onclick=next;$('#prevBtn').onclick=prev;$('#shuffleBtn').onclick=()=>{shuffle=!shuffle;$('#shuffleBtn').style.color=shuffle?'#1ed760':'#ddd';toast(shuffle?'Aleatório ativado':'Aleatório desativado')};$('#repeatBtn').onclick=()=>{repeat=!repeat;$('#repeatBtn').style.color=repeat?'#1ed760':'#ddd';toast(repeat?'Repetição ativada':'Repetição desativada')};
$('#progress').oninput=e=>{if(audioCtx){pausedAt=Number(e.target.value)/100*duration;startedAt=audioCtx.currentTime-pausedAt;$('#currentTime').textContent=fmt(pausedAt)}};$('#volume').oninput=e=>{ensureAudio();gainNode.gain.value=Number(e.target.value)};$('#playerLike').onclick=toggleLike;$('#likeCurrent').onclick=toggleLike;
$('#globalSearch').oninput=e=>search(e.target.value);$('#clearSearch').onclick=()=>{$('#globalSearch').value='';showView('home')};$$('.nav-btn').forEach(b=>b.onclick=()=>{showView(b.dataset.view);if(b.dataset.view==='library')renderLibrary()});$$('.chip').forEach(b=>b.onclick=()=>{$$('.chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderQuick(b.dataset.filter)});$$('.lib-tab').forEach(b=>b.onclick=()=>{libraryMode=b.dataset.lib;$$('.lib-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderLibrary()});$('#addPlaylist').onclick=addPlaylist;$('#followBtn').onclick=()=>{const on=$('#followBtn').textContent==='Seguir';$('#followBtn').textContent=on?'Seguindo':'Seguir';toast(on?'Artista seguido':'Deixou de seguir')};$('#queueBtn').onclick=()=>toast('Fila: '+tracks.slice(index+1,index+4).map(t=>t.title).join(' • '));$('#lyricsBtn').onclick=()=>toast('Prévia da letra exibida no painel direito');$('#closeNp').onclick=()=>$('.now-playing').style.display='none';$('#fullscreenBtn').onclick=()=>document.documentElement.requestFullscreen?.();$('#installHint').onclick=()=>toast('Este projeto roda diretamente no navegador, sem instalação.');$('#backBtn').onclick=()=>history.back();$('#forwardBtn').onclick=()=>history.forward();

$('#avatarBtn')?.addEventListener('click',renderProfile);$('#premiumBtn')?.addEventListener('click',renderPremium);$('#artistPageBtn')?.addEventListener('click',()=>renderArtistPage(current.artist));window.addEventListener('popstate',()=>routeFromHash());function routeFromHash(){const h=location.hash.replace('#','')||'home';if(h==='home'||h==='search'||h==='library')showView(h,false);else if(h==='profile')renderProfile();else if(h==='premium')renderPremium();else if(h==='settings')renderSettings();else showView('home',false)};routeFromHash();

document.addEventListener('click',e=>{const a=e.target.closest('.artist-click');if(a){e.stopPropagation();renderArtistPage(a.dataset.artist)}});
$('#npArtist').style.cursor='pointer';$('#npArtist').onclick=()=>renderArtistPage(current.artist);$('#npTitle').style.cursor='pointer';$('#npTitle').onclick=()=>renderAlbumPage(current.title==='Como Tudo Deve Ser'?'Como Tudo Deve Ser':'Coletânea demonstrativa');

renderPlaylists();renderHome();updatePlayer();updateNowPlaying();$('#duration').textContent=fmt(duration);
