const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];const genreCodes={'和食':'G004','洋食':'G005','中華':'G007','焼肉':'G008','居酒屋':'G001','カフェ':'G014','ラーメン':'G017'};const cats=[['🍱','和食'],['🍝','洋食'],['🥟','中華'],['🥩','焼肉'],['🍺','居酒屋'],['☕','カフェ'],['🍜','ラーメン'],['🍴','その他']];let shops=[],coords=null,lastQuery='',lastCategory='',favorites=JSON.parse(localStorage.getItem('gourmet_favorites')||'{}');const API_ENDPOINT='https://xlmxqrlxizlivhtpphtq.supabase.co/functions/v1/hotpepper-search';const PUBLIC_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbXhxcmx4aXpsaXZodHBwaHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDgxODQsImV4cCI6MjEwNDM4NDE4NH0.cHbPnw43x7utmA9FHQd4vDLJpXVE7ypilOebm4zLUDY';const endpoint=()=>API_ENDPOINT;function page(id){$$('main').forEach(e=>e.classList.toggle('hidden',e.id!==id));$$('nav button').forEach(e=>e.classList.toggle('selected',e.dataset.page===id));if(id==='favorites')renderFavorites();window.scrollTo(0,0)}function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function url(u){try{let x=new URL(u);return ['http:','https:'].includes(x.protocol)?x.href:''}catch{return ''}}function normalize(h){return {id:String(h.id||''),name:h.name||'店舗名未登録',address:h.address||'',genre:typeof h.genre==='object'?h.genre.name:h.genre||'',access:h.access||'',open:h.open||'',photo:url(h.photo?.pc?.l||h.photo?.mobile?.l||h.photo||h.image||''),booking:url(h.urls?.pc||h.booking_url||''),homepage:url(h.homepage_url||h.official_website||h.official_url||h.website_url||h.homepage||h.website||h.site||h.hp_url||''),lat:Number(h.lat),lng:Number(h.lng)}}function card(h){let fav=!!favorites[h.id];let maps=h.lat&&h.lng?`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.address||h.name)}`;return `<article class="restaurant">${h.photo?`<img src="${esc(h.photo)}" alt="${esc(h.name)}" loading="lazy" onerror="this.style.display='none'">`:'<div class="fallback">🍽️</div>'}<div class="details"><h3>${esc(h.name)}</h3><p>${esc(h.genre)}</p><p>📍 ${esc(h.address||'住所情報なし')}</p><p>🕒 ${esc(h.open||'営業時間は店舗で確認')}</p><div class="actions"><a href="${esc(maps)}" target="_blank" rel="noopener">地図</a>${h.homepage?`<a href="${esc(h.homepage)}" target="_blank" rel="noopener noreferrer">🌐 公式ホームページ</a>`:'<span class="gm-site-unavailable">公式HP未登録</span>'}${h.booking?`<a href="${esc(h.booking)}" target="_blank" rel="noopener noreferrer">店舗ページ・予約</a>`:''}<button class="heart" data-fav="${esc(h.id)}">${fav?'♥ 保存済み':'♡ 保存'}</button></div></div></article>`}function render(items,target){$(target).innerHTML=items.length?items.map(card).join(''):'<div class="empty">表示できる店舗がありません。<br>検索条件またはAPI接続設定をご確認ください。</div>'}function renderFavorites(){render(Object.values(favorites),'#favList')}function showStatus(s){$('#status').textContent=s}async function search(query='',category=''){
 lastQuery=query;lastCategory=category;page('results');
 $('#resultQuery').value=query;
 $('#resultsTitle').textContent=category?`${category}のお店`:'お店を探す';$('#genre').value=category||'';
 $('#list').innerHTML='<div class="empty">店舗を検索しています…</div>';
 try{
  const keyword=query.trim();
  const body={keyword,count:30};
  if(genreCodes[category]) body.genre=genreCodes[category];
  if(category==='その他') body.exclude_genres=Object.values(genreCodes);
  if(coords&&!keyword){body.lat=coords.lat;body.lng=coords.lng;body.range=3;}
  if(!keyword&&!coords&&!category){
    $('#list').innerHTML='<div class="notice">検索語を入力するか、現在地から検索してください。</div>';return;
  }
  const response=await fetch(API_ENDPOINT,{
   method:'POST',
   headers:{'Content-Type':'application/json','apikey':PUBLIC_ANON_KEY,'Authorization':'Bearer '+PUBLIC_ANON_KEY},
   body:JSON.stringify(body)
  });
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'HTTP '+response.status);
  shops=(data.shops||[]).map(normalize);
  if($('#sort').value==='4'&&coords){
   const distance=h=>Math.pow((h.lat-coords.lat)*111,2)+Math.pow((h.lng-coords.lng)*91,2);
   shops.sort((a,b)=>distance(a)-distance(b));
  }
  render(shops,'#list');
 }catch(e){
  $('#list').innerHTML='<div class="notice">店舗情報を取得できませんでした：'+esc(e.message)+'</div>';
 }
}
function locate(){if(!navigator.geolocation){alert('位置情報を利用できません');return}navigator.geolocation.getCurrentPosition(p=>{coords={lat:p.coords.latitude,lng:p.coords.longitude};search(lastQuery,lastCategory)},e=>alert('現在地を取得できませんでした：'+e.message),{enableHighAccuracy:true,timeout:12000})}$('#categories').innerHTML=cats.map(([emoji,name])=>`<button class="cat" data-cat="${name}"><span class="emoji">${emoji}</span>${name}</button>`).join('');document.addEventListener('click',e=>{let c=e.target.closest('[data-cat]');if(c)search('',c.dataset.cat);let a=e.target.closest('[data-area]');if(a)search(a.dataset.area);let f=e.target.closest('[data-fav]');if(f){let h=[...shops,...Object.values(favorites)].find(x=>x.id===f.dataset.fav);if(!h)return;if(favorites[h.id])delete favorites[h.id];else favorites[h.id]=h;localStorage.setItem('gourmet_favorites',JSON.stringify(favorites));if($('#favorites').classList.contains('hidden'))render(shops,'#list');else renderFavorites()}});$$('nav button').forEach(b=>b.onclick=()=>page(b.dataset.page));$('#homeSearch').onsubmit=e=>{e.preventDefault();search($('#homeQuery').value.trim())};$('#resultSearch').onsubmit=e=>{e.preventDefault();search($('#resultQuery').value.trim(),$('#genre').value)};$('#genre').onchange=()=>search($('#resultQuery').value.trim(),$('#genre').value);$('#sort').onchange=()=>search(lastQuery,lastCategory);$('#nearby').onclick=locate;$('#locate').onclick=locate;$('#backHome').onclick=()=>page('home');$('#allAreas').onclick=()=>search('');$('#info').onclick=()=>alert('グルメマップへようこそ！');$('#endpoint').value=endpoint();$('#endpoint').readOnly=true;$('#saveEndpoint').onclick=()=>alert('接続先はSupabaseに設定済みです。');showStatus('Supabase接続設定済み。キーワードまたは現在地で検索してください。');if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
// 料理ジャンルごとの地図ピン。画像ファイルに依存しないためSafariでも表示可能。
function restaurantPin(genre){
 const g=String(genre||'');
 let emoji='🍴',color='#4675df';
 if(/ラーメン|つけ麺/.test(g)){emoji='🍜';color='#ef8b17'}
 else if(/カフェ|喫茶|スイーツ/.test(g)){emoji='☕';color='#9c43a9'}
 else if(/居酒屋|ダイニングバー|バー|パブ/.test(g)){emoji='🍺';color='#ed9b13'}
 else if(/焼肉|ホルモン|ステーキ/.test(g)){emoji='🥩';color='#e94c71'}
 else if(/中華|餃子|台湾料理/.test(g)){emoji='🥟';color='#36a45d'}
 else if(/洋食|イタリアン|フレンチ|スペイン|パスタ|ピザ/.test(g)){emoji='🍝';color='#ed7932'}
 else if(/和食|寿司|海鮮|日本料理|そば|うどん/.test(g)){emoji='🍱';color='#b77a38'}
 return L.divIcon({className:'gm-pin-container',html:`<div class="gm-pin" style="--gm-pin-color:${color}"><span>${emoji}</span></div>`,iconSize:[42,54],iconAnchor:[21,52],popupAnchor:[0,-49]});
}
// 地図の表示範囲に追従する飲食店検索。APIのページング上限を尊重して分割取得。
let nearMap=null,nearPins=null,nearSelf=null,nearRequest=0,nearTimer=null,nearAbort=null;
let nearLocation=null,nearCache=new Map();
let nearPopupOpen=false,nearPendingRefresh=false;
function mapNotice(message){const el=document.getElementById('mapMessage');if(el){el.textContent=message;el.style.display=message?'block':'none';}}
function initNearMap(){
 if(nearMap)return true;
 if(typeof L==='undefined'){mapNotice('地図を読み込めませんでした。通信環境をご確認ください。');return false;}
 nearMap=L.map('nearMap',{scrollWheelZoom:false,zoomControl:true}).setView([35.222,138.622],12);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(nearMap);
 nearPins=L.layerGroup().addTo(nearMap);
 nearMap.on('moveend zoomend',()=>scheduleViewportSearch());
 nearMap.on('popupopen',()=>{nearPopupOpen=true;});
 nearMap.on('popupclose',()=>{nearPopupOpen=false;if(nearPendingRefresh){nearPendingRefresh=false;scheduleViewportSearch();}});
 return true;
}
function scheduleViewportSearch(){clearTimeout(nearTimer);if(nearPopupOpen){nearPendingRefresh=true;return;}nearTimer=setTimeout(loadViewportShops,420);}
function kmBetween(a,b,c,d){const dy=(c-a)*111.2,dx=(d-b)*111.2*Math.cos((a+c)*Math.PI/360);return Math.hypot(dx,dy);}
function viewportCells(){
 const bounds=nearMap.getBounds(),south=Math.max(-85,bounds.getSouth()),north=Math.min(85,bounds.getNorth());
 const west=bounds.getWest(),east=bounds.getEast();
 // 地図の表示範囲を複数の検索円で覆う。広域表示はAPI負荷対策で最大25分割。
 const mid=(south+north)/2,lonKm=111.2*Math.max(.08,Math.cos(mid*Math.PI/180));
 const height=(north-south)*111.2,width=(east-west)*lonKm;
 const cols=Math.max(1,Math.min(5,Math.ceil(width/4.2)));
 const rows=Math.max(1,Math.min(5,Math.ceil(height/4.2)));
 const cells=[];
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const lat=south+(north-south)*(y+.5)/rows,lng=west+(east-west)*(x+.5)/cols;
  const radius=Math.hypot(height/rows,width/cols)/2;
  cells.push({lat,lng,range:radius<=.3?1:radius<=.5?2:radius<=1?3:radius<=2?4:5});
 }
 return {cells,limited:height>21||width>21};
}
function popupFor(shop){
 const photo=shop.photo?`<img class="gm-popup-photo" src="${esc(shop.photo)}" alt="${esc(shop.name)}の店舗写真" loading="lazy" onerror="this.style.display='none'">`:'';
 const link=shop.booking?`<a class="gm-popup-link" href="${esc(shop.booking)}" target="_blank" rel="noopener noreferrer">詳細を見る ›</a>`:'<span class="gm-popup-unavailable">店舗ページの登録がありません</span>';
 return `<div class="gm-popup">${photo}<strong class="gm-popup-title">${esc(shop.name)}</strong><div class="gm-popup-genre">${esc(shop.genre||'飲食店')}</div><div class="gm-popup-address">📍 ${esc(shop.address||'住所情報なし')}</div>${shop.homepage?`<a class="gm-popup-link" href="${esc(shop.homepage)}" target="_blank" rel="noopener noreferrer">🌐 公式ホームページ ↗</a>`:'<span class="gm-site-unavailable">公式HP未登録</span>'}${link}</div>`;
}
async function fetchCell(cell,signal){
 const key=[cell.lat.toFixed(3),cell.lng.toFixed(3),cell.range].join(':');
 const cached=nearCache.get(key);
 if(cached&&Date.now()-cached.at<180000)return cached.items;
 const all=new Map();
 // Hot Pepper API: 1リクエスト最大100件。複数ページ取得に対応したEdge Functionが必要。
 for(let start=1;start<=401;start+=100){
  const response=await fetch(API_ENDPOINT,{method:'POST',signal,headers:{'Content-Type':'application/json','apikey':PUBLIC_ANON_KEY,'Authorization':'Bearer '+PUBLIC_ANON_KEY},body:JSON.stringify({lat:cell.lat,lng:cell.lng,range:cell.range,count:100,start})});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'APIエラー '+response.status);
  const batch=(data.shops||[]).map(normalize);
  let added=0;
  for(const s of batch){if(s.id&&!all.has(s.id)){all.set(s.id,s);added++;}}
  if(batch.length<100||!added)break;
 }
 const items=[...all.values()];
 nearCache.set(key,{at:Date.now(),items});
 if(nearCache.size>120)nearCache.delete(nearCache.keys().next().value);
 return items;
}
async function loadViewportShops(){
 if(!nearMap)return;
 if(nearPopupOpen){nearPendingRefresh=true;return;}
 const request=++nearRequest;
 if(nearAbort)nearAbort.abort();
 nearAbort=new AbortController();
 const bounds=nearMap.getBounds(),{cells,limited}=viewportCells();
 mapNotice('表示範囲の飲食店を検索しています…');
 let found=new Map(),failed=0;
 // 連続リクエストを抑えるため最大3並列。
 let cursor=0;
 async function worker(){while(cursor<cells.length){const cell=cells[cursor++];try{const items=await fetchCell(cell,nearAbort.signal);for(const s of items){if(s.id&&Number.isFinite(s.lat)&&Number.isFinite(s.lng)&&bounds.contains([s.lat,s.lng]))found.set(s.id,s);}}catch(e){if(e.name==='AbortError')return;failed++;}}}
 await Promise.all(Array.from({length:Math.min(3,cells.length)},worker));
 if(request!==nearRequest)return;
 if(nearPopupOpen){nearPendingRefresh=true;return;}
 nearPins.clearLayers();
 for(const shop of found.values())L.marker([shop.lat,shop.lng],{icon:restaurantPin(shop.genre),title:shop.name}).addTo(nearPins).bindPopup(popupFor(shop),{maxWidth:260,minWidth:205,autoPan:false,closeOnClick:false,autoClose:true,keepInView:false});
 document.getElementById('mapCount').textContent='📍 表示範囲の飲食店 '+found.size+'件';
 if(failed)mapNotice(`一部の地域の取得に失敗しました（${failed}件）。地図を動かすか更新してください。`);
 else if(limited)mapNotice('広い範囲を表示中です。すべての店舗を探すには地図を拡大してください。');
 else if(!found.size)mapNotice('この範囲で取得できる飲食店はありません。');
 else mapNotice('');
}
function refreshNearMap(){
 if(!initNearMap())return;
 if(!navigator.geolocation){mapNotice('位置情報を利用できません。地図を動かして検索できます。');scheduleViewportSearch();return;}
 mapNotice('現在地を取得しています…');
 navigator.geolocation.getCurrentPosition(p=>{
  nearLocation={lat:p.coords.latitude,lng:p.coords.longitude};coords=nearLocation;
  if(nearSelf)nearMap.removeLayer(nearSelf);
  nearSelf=L.circleMarker([coords.lat,coords.lng],{radius:9,color:'#fff',weight:3,fillColor:'#2687ee',fillOpacity:1}).addTo(nearMap).bindPopup('📍 現在地');
  nearMap.setView([coords.lat,coords.lng],15);
  scheduleViewportSearch();
 },e=>{mapNotice('現在地を取得できませんでした。地図を動かして検索できます。');scheduleViewportSearch();},{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
}
document.getElementById('mapRefresh')?.addEventListener('click',()=>{nearCache.clear();refreshNearMap();});
document.getElementById('nearby')?.addEventListener('click',e=>{e.stopImmediatePropagation();e.preventDefault();refreshNearMap();},true);
window.addEventListener('load',()=>{if(initNearMap())refreshNearMap();});

(function(){
 let resizeTimer;
 const fixMapSize=()=>{
  if(typeof nearMap!=='undefined'&&nearMap){
   nearMap.invalidateSize({pan:false,animate:false});
  }
 };
 window.addEventListener('pageshow',()=>setTimeout(fixMapSize,300));
 window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(fixMapSize,150)});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(fixMapSize,250)});
 window.addEventListener('load',()=>setTimeout(fixMapSize,600));
})();
