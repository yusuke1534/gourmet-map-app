const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];const genreCodes={'和食':'G004','洋食':'G005','中華':'G007','焼肉':'G008','居酒屋':'G001','カフェ':'G014','ラーメン':'G017'};const cats=[['🍱','和食'],['🍝','洋食'],['🥟','中華'],['🥩','焼肉'],['🍺','居酒屋'],['☕','カフェ'],['🍜','ラーメン'],['🍴','その他']];let shops=[],coords=null,lastQuery='',lastCategory='',favorites=JSON.parse(localStorage.getItem('gourmet_favorites')||'{}');const API_ENDPOINT='https://xlmxqrlxizlivhtpphtq.supabase.co/functions/v1/hotpepper-search';const PUBLIC_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbXhxcmx4aXpsaXZodHBwaHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDgxODQsImV4cCI6MjEwNDM4NDE4NH0.cHbPnw43x7utmA9FHQd4vDLJpXVE7ypilOebm4zLUDY';const endpoint=()=>API_ENDPOINT;function page(id){$$('main').forEach(e=>e.classList.toggle('hidden',e.id!==id));$$('nav button').forEach(e=>e.classList.toggle('selected',e.dataset.page===id));if(id==='favorites')renderFavorites();window.scrollTo(0,0)}function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function url(u){try{let x=new URL(u);return ['http:','https:'].includes(x.protocol)?x.href:''}catch{return ''}}function normalize(h){return {id:String(h.id||''),name:h.name||'店舗名未登録',address:h.address||'',genre:typeof h.genre==='object'?h.genre.name:h.genre||'',access:h.access||'',open:h.open||'',photo:url(h.photo?.pc?.l||h.photo?.mobile?.l||h.photo||h.image||''),booking:url(h.urls?.pc||h.booking_url||''),lat:Number(h.lat),lng:Number(h.lng)}}function card(h){let fav=!!favorites[h.id];let maps=h.lat&&h.lng?`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.address||h.name)}`;return `<article class="restaurant">${h.photo?`<img src="${esc(h.photo)}" alt="${esc(h.name)}" loading="lazy" onerror="this.style.display='none'">`:'<div class="fallback">🍽️</div>'}<div class="details"><h3>${esc(h.name)}</h3><p>${esc(h.genre)}</p><p>📍 ${esc(h.address||'住所情報なし')}</p><p>🕒 ${esc(h.open||'営業時間は店舗で確認')}</p><div class="actions"><a href="${esc(maps)}" target="_blank" rel="noopener">地図</a>${h.booking?`<a href="${esc(h.booking)}" target="_blank" rel="noopener">店舗ページ・予約</a>`:''}<button class="heart" data-fav="${esc(h.id)}">${fav?'♥ 保存済み':'♡ 保存'}</button></div></div></article>`}function render(items,target){$(target).innerHTML=items.length?items.map(card).join(''):'<div class="empty">表示できる店舗がありません。<br>検索条件またはAPI接続設定をご確認ください。</div>'}function renderFavorites(){render(Object.values(favorites),'#favList')}function showStatus(s){$('#status').textContent=s}async function search(query='',category=''){
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
// 現在地周辺の飲食店マップ（ホットペッパーAPI / OpenStreetMap）
let nearMap=null,nearPins=null,nearSelf=null,nearRequest=0;
function mapNotice(message){const el=document.getElementById('mapMessage');if(el)el.textContent=message;}
function initNearMap(){
 if(nearMap)return true;
 if(typeof L==='undefined'){mapNotice('地図ライブラリを読み込めませんでした。通信環境を確認してください。');return false;}
 nearMap=L.map('nearMap',{scrollWheelZoom:false}).setView([35.222,138.622],12);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(nearMap);
 nearPins=L.layerGroup().addTo(nearMap);
 return true;
}
async function refreshNearMap(){
 if(!initNearMap())return;
 const request=++nearRequest;
 mapNotice('現在地を取得しています…');
 if(!navigator.geolocation){mapNotice('この端末では位置情報を利用できません。');return;}
 navigator.geolocation.getCurrentPosition(async position=>{
  if(request!==nearRequest)return;
  const lat=position.coords.latitude,lng=position.coords.longitude;
  coords={lat,lng};
  nearMap.setView([lat,lng],14);
  if(nearSelf)nearMap.removeLayer(nearSelf);
  nearSelf=L.circleMarker([lat,lng],{radius:9,color:'#fff',weight:3,fillColor:'#2687ee',fillOpacity:1}).addTo(nearMap).bindPopup('📍 現在地');
  nearPins.clearLayers();
  mapNotice('近くの飲食店を検索しています…');
  try{
   const response=await fetch(API_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','apikey':PUBLIC_ANON_KEY,'Authorization':'Bearer '+PUBLIC_ANON_KEY},body:JSON.stringify({lat,lng,range:3,count:30,start:1})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||'APIエラー '+response.status);
   if(request!==nearRequest)return;
   const found=(data.shops||[]).map(normalize).filter(s=>Number.isFinite(s.lat)&&Number.isFinite(s.lng)&&s.lat!==0&&s.lng!==0);
   for(const shop of found){
    const link=shop.booking?'<a href="'+esc(shop.booking)+'" target="_blank" rel="noopener noreferrer">店舗情報を見る ›</a>':'';
    L.marker([shop.lat,shop.lng]).addTo(nearPins).bindPopup('<strong>'+esc(shop.name)+'</strong><div>'+esc(shop.genre)+'</div><div>'+esc(shop.address)+'</div>'+link);
   }
   document.getElementById('mapCount').textContent='📍 周辺の飲食店 '+found.length+'件';
   mapNotice(found.length?'':'この範囲で表示できる店舗がありません。');
  }catch(error){if(request===nearRequest)mapNotice('店舗の取得に失敗しました。API接続をご確認ください。');}
 },error=>{
  if(request!==nearRequest)return;
  const reasons={1:'位置情報が許可されていません。Safariの位置情報設定をご確認ください。',2:'現在地を取得できませんでした。',3:'位置情報の取得がタイムアウトしました。'};
  mapNotice(reasons[error.code]||'現在地を取得できませんでした。');
 },{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
}
document.getElementById('mapRefresh')?.addEventListener('click',refreshNearMap);
document.getElementById('nearby')?.addEventListener('click',e=>{e.stopImmediatePropagation();e.preventDefault();refreshNearMap();},true);
window.addEventListener('load',()=>{if(initNearMap())refreshNearMap();});
