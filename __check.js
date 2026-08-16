
if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));
const key='novelNestFull';
const categoryMap={'都市':'都市纯爱','现代':'现代幻想','古代':'古代纯爱','未来幻想':'未来幻想','都市纯爱':'都市纯爱','现代幻想':'现代幻想','古代纯爱':'古代纯爱'};

let bookSearchKeyword='';
let bookViewMode=localStorage.getItem('bookViewMode')||'card';
let bookPage=1;

let data=JSON.parse(localStorage.getItem(key)||'null')||{
  theme:'#9d8bd7',books:[
    {id:1,title:'偷藏星光',author:'示例作者',platform:'晋江文学城',type:'现代',status:'已看完',score:5,emoji:'♡',dateStart:'2026-08-13',dateEnd:'2026-08-15',note:'',reason:'',tags:['甜宠'],cover:'',rank:1},
    {id:2,title:'难哄',author:'示例作者',platform:'番茄小说',type:'现代',status:'在读',score:5,emoji:'☁',dateStart:'2026-08-18',dateEnd:'2026-08-20',note:'',reason:'',tags:['治愈'],cover:'',rank:2},
    {id:3,title:'等风热吻你',author:'示例作者',platform:'长佩文学',type:'都市',status:'在读',score:4,emoji:'✦',dateStart:'2026-08-18',dateEnd:'2026-08-20',note:'',reason:'',tags:['甜宠'],cover:'',rank:3},
    {id:4,title:'白日梦我',author:'示例作者',platform:'晋江文学城',type:'现代',status:'已看完',score:4,emoji:'♡',dateStart:'2026-08-10',dateEnd:'2026-08-24',note:'',reason:'',tags:['校园'],cover:'',rank:4}
  ],customTags:[]
};
const typeMap={'都市':'都市纯爱','现代':'现代幻想','古代':'古代纯爱','未来幻想':'未来幻想'}; data.books.forEach(b=>{b.type=typeMap[b.type]||b.type; b.dateStart=b.dateStart||b.date||'';b.dateEnd=b.dateEnd||((b.status==='已看完')?b.dateStart:'');b.tags=b.tags||[];b.reason=b.reason||'';b.cover=b.cover||''});
data.customTags=data.customTags||[];
let page='home',filter='全部',detailId=null,newCover='',newTags=[],editCover='',editTags=[],newScoreVal=0,newEmoji='♡';
let calCursor=new Date(); calCursor.setDate(1);
const $=id=>document.getElementById(id);
data.books=(data.books||[]).map(b=>({...b,type:categoryMap[b.type]||b.type}));
function save(){localStorage.setItem(key,JSON.stringify(data))}
function filterShelfTag(tag){
  filter = (filter===tag ? '全部' : tag);
  bookPage=1;
  render();
}
function go(p){page=p;render()}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function isoDate(d){return d.toISOString().slice(0,10)}
function parseDate(s){if(!s)return null;let [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)}
function fmt(s){if(!s)return '未设置';let [y,m,d]=s.split('-');return `${y}.${m}.${d}`}
function daysInMonth(y,m){return new Date(y,m+1,0).getDate()}
function stars(b){return '<div class="stars">'+[1,2,3,4,5].map(n=>`<button class="star ${n<=Number(b.score||0)?'':'off'}" onclick="event.stopPropagation();rating(${n},${b.id})">★</button>`).join('')+'</div>'}
function rating(n,id){let b=data.books.find(x=>x.id===id);b.score=n;save();render()}
function statusPill(status){return `<span class="pill ${status==='已看完'?'done':status==='弃文'?'drop':''}">${status}</span>`}
function coverHtml(b,cls='cover'){return `<div class="${cls}">${b.cover?`<img src="${b.cover}" alt="">`:'纯色封面'}</div>`}
function card(b,grid=false){
  if(grid)return `<div class="cardbook" onclick="openDetail(${b.id})">${coverHtml(b)}<h3>${esc(b.title)}</h3><div class="muted">${esc(b.author)}</div>${stars(b)}${statusPill(b.status)}<div class="dateMini">${fmt(b.dateStart)}${b.dateEnd&&b.dateEnd!==b.dateStart?' – '+fmt(b.dateEnd):''}</div><div class="metaRow">${[b.type,...(b.tags||[])].filter(Boolean).slice(0,3).map(t=>`<span class="miniTag">${esc(t)}</span>`).join('')}</div><button class="deleteMini" onclick="event.stopPropagation();deleteBook(${b.id})">删除</button></div>`;
  return `<div class="book" onclick="openDetail(${b.id})">${coverHtml(b)}<div style="min-width:0"><h3>${esc(b.title)}</h3><div class="muted">${esc(b.author)}${b.platform?' · '+esc(b.platform):''}</div>${stars(b)}${statusPill(b.status)}<div class="metaRow"><span class="miniTag">${fmt(b.dateStart)}${b.dateEnd&&b.dateEnd!==b.dateStart?' – '+fmt(b.dateEnd):''}</span></div></div></div>`;
}
function render(){
  document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));
  let active={home:'n-home',shelf:'n-shelf',rank:'n-rank',cal:'n-cal'}[page];if(active)$(active).classList.add('active');
  let v=$('view');
  if(page==='home')renderHome(v);
  if(page==='shelf')renderShelf(v);
  if(page==='rank')renderRank(v);
  if(page==='cal')renderCalendar(v);
}
function renderHome(v){
  let done=data.books.filter(b=>b.status==='已看完').length;
  let now=new Date(),ym=now.toISOString().slice(0,7);
  let monthDone=data.books.filter(b=>b.status==='已看完'&&b.dateEnd&&b.dateEnd.startsWith(ym)).length;
  let sorted=data.books.slice().sort((a,b)=>(b.dateStart||'').localeCompare(a.dateStart||''));
  v.innerHTML=`<div class="card"><div class="stats"><div class="stat"><small>本月读完</small><b>${monthDone}</b><small>本</small></div><div class="stat"><small>总共已看</small><b>${done}</b><small>本</small></div></div></div>
  <div class="card"><div class="sectionhead"><h2>阅读时间轴</h2><button class="link" onclick="go('cal')">看日历 →</button></div>
  <div class="timeline">${sorted.map(b=>`<div class="event"><i class="dot"></i><div class="date">${fmt(b.dateStart)}${b.dateEnd&&b.dateEnd!==b.dateStart?' → '+fmt(b.dateEnd):''}</div>${card(b)}</div>`).join('')||'<div class="empty">还没有阅读记录，去添加第一本吧。</div>'}</div></div>`;
}

function doBookSearch(){
  let input=document.getElementById('bookSearchInput');
  bookSearchKeyword=input?input.value:'';
  bookPage=1;
  renderShelf($('view'));
}
function clearBookSearch(){
  bookSearchKeyword='';
  renderShelf($('view'));
}

function renderShelf(v){
  let list=data.books.filter(b=>filter==='全部'||b.status===filter||b.type===filter||(b.tags||[]).includes(filter));
  if(bookSearchKeyword.trim()){
    let k=bookSearchKeyword.trim().toLowerCase();
    list=list.filter(b=>[b.title,b.author,b.type,...(b.tags||[])].join(' ').toLowerCase().includes(k));
  }

  let builtInTags=['甜宠','治愈','校园','虐恋','悬疑','群像'];
  let filters=['全部','在读','已看完','弃文','都市纯爱','现代幻想','古代纯爱','未来幻想',...builtInTags,...data.customTags];

  let pageSize=bookViewMode==='list'?24:12;
  let totalPages=Math.max(1,Math.ceil(list.length/pageSize));
  if(bookPage>totalPages) bookPage=totalPages;
  if(bookPage<1) bookPage=1;
  let start=(bookPage-1)*pageSize;
  let visible=list.slice(start,start+pageSize);

  let searchIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"></circle><path d="M16 16l5 5"></path></svg>';
  let viewIcon=bookViewMode==='card'
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6"></rect><rect x="14" y="4" width="6" height="6"></rect><rect x="4" y="14" width="6" height="6"></rect><rect x="14" y="14" width="6" height="6"></rect></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14"></path></svg>';

  v.innerHTML=`<div class="card"><div class="sectionhead"><h2>我的书架</h2><button class="link" onclick="openAdd()">＋ 添加小说</button></div>
  <div class="book-search-box"><input id="bookSearchInput" value="${esc(bookSearchKeyword)}" placeholder="搜索书名、作者、标签"><button type="button" class="search-btn" aria-label="搜索" onclick="doBookSearch()">${searchIcon}</button></div>
  <div class="shelf-tools"><button type="button" class="shelf-view-toggle" aria-label="切换显示模式" onclick="toggleBookView()">${viewIcon}</button></div>
  <div class="tabs">${filters.map(x=>`<button type="button" data-tag="${esc(x)}" class="${filter===x?'active':''}" onclick="filterShelfTag(this.dataset.tag)">${esc(x)}</button>`).join('')}</div>
  <div class="filterline"><span>${list.length} 本</span><button class="link" onclick="addCustomTag()">＋ 自定义标签</button></div>
  ${visible.length?`<div class="${bookViewMode==='card'?'grid':'shelf-grid-list'}">${visible.map(b=>card(b,bookViewMode==='card')).join('')}</div>`:'<div class="empty">这个筛选里还没有书</div>'}
  ${totalPages>1?`<div class="shelf-pages"><button type="button" onclick="changeBookPage(-1)" ${bookPage===1?'disabled':''}>上一页</button><span class="shelf-page-info">${bookPage} / ${totalPages}</span><button type="button" onclick="changeBookPage(1)" ${bookPage===totalPages?'disabled':''}>下一页</button></div>`:''}
  </div>`;
}
function toggleBookView(){
  bookViewMode=bookViewMode==='card'?'list':'card';
  localStorage.setItem('bookViewMode',bookViewMode);
  bookPage=1;
  render();
}
function changeBookPage(delta){
  bookPage=Math.max(1,bookPage+delta);
  render();
}
function renderRank(v){
  let list=data.books.slice().sort((a,b)=>(a.rank||999)-(b.rank||999));
  v.innerHTML=`<div class="card"><div class="sectionhead"><h2>我的排名</h2><small>只自己看 · 展示前十</small></div>${list.slice(0,10).map((b,i)=>`<div class="rankrow"><span class="ranknum">${i+1}</span>${coverHtml(b)}<div style="flex:1;min-width:0"><b style="font-size:13px">${esc(b.title)}</b><div class="muted">${esc(b.author)}</div>${stars(b)}</div><button class="link" onclick="moveRank(${b.id},-1)">↑</button><button class="link" onclick="moveRank(${b.id},1)">↓</button></div>`).join('')||'<div class="empty">还没有排名</div>'}</div>`;
}
function renderCalendar(v){
  let y=calCursor.getFullYear(),m=calCursor.getMonth(),first=new Date(y,m,1).getDay(),total=daysInMonth(y,m);
  let weeks=[];let day=1-first;
  while(day<=total){let start=Math.max(1,day),end=Math.min(total,day+6);weeks.push({start,end,offset:day<1?1-day:0});day+=7}
  let bars=buildCalendarBars(y,m,weeks);
  let html=`<div class="card calendarWrap"><div class="calHead"><button class="arrow" onclick="changeMonth(-1)">‹</button><div class="monthTitle">${y}年${m+1}月</div><button class="arrow" onclick="changeMonth(1)">›</button></div><div class="calWeek">${['日','一','二','三','四','五','六'].map(x=>`<div class="weekday">${x}</div>`).join('')}</div>`;
  weeks.forEach((w,wi)=>{
    let rowStart=wi*7+1;let cells='';
    for(let c=0;c<7;c++){let n=rowStart+c;let valid=n>=1&&n<=total;let today=(isoDate(new Date())===`${y}-${String(m+1).padStart(2,'0')}-${String(n).padStart(2,'0')}`);cells+=`<div class="daynum ${today?'today':''}">${valid?n:''}</div>`}
    html+=`<div class="week">${cells}${bars.filter(x=>x.week===wi).map(b=>`<div class="spanbar" style="grid-column:${b.colStart}/${b.colEnd};grid-row:${b.lane+2};background:${b.bg}" onclick="openDetail(${b.id})" title="${esc(b.title)}">${esc(b.title)}</div>`).join('')}</div>`;
  });
  v.innerHTML=html;
}
const palette=['#ddd4f7','#cdeedf','#f6d7e3','#d6e3f8','#f6e1b7','#d9e7df'];
function buildCalendarBars(y,m,weeks){
  let result=[];
  weeks.forEach((w,wi)=>{
    let weekMin=wi*7+1,weekMax=Math.min(daysInMonth(y,m),wi*7+7);
    data.books.forEach((b,idx)=>{
      let s=parseDate(b.dateStart),e=parseDate(b.dateEnd||b.dateStart);if(!s||!e)return;
      let monthStart=new Date(y,m,weekMin),monthEnd=new Date(y,m,weekMax);
      let sDay=(s.getFullYear()===y&&s.getMonth()===m)?s.getDate():weekMin;
      let eDay=(e.getFullYear()===y&&e.getMonth()===m)?e.getDate():weekMax;
      if(s<=monthEnd&&e>=monthStart){
        let a=Math.max(weekMin,sDay),z=Math.min(weekMax,eDay);
        let lane=0;while(result.some(x=>x.week===wi&&x.lane===lane&&!(z<x.start||a>x.end)))lane++;
        let bg=palette[idx%palette.length];
        result.push({week:wi,id:b.id,title:b.title,start:a,end:z,lane, colStart:(a-weekMin)+1,colEnd:(z-weekMin)+2,bg});
      }
    });
  });
  return result;
}
function changeMonth(d){calCursor.setMonth(calCursor.getMonth()+d);render()}
function addCustomTag(){
  let t=prompt('输入自定义标签');
  t=(t||'').trim();
  if(!t)return;
  if(!data.customTags.includes(t)){data.customTags.push(t);save()}
  render();
}
function openTagManager(){
  $('modal').classList.add('show');
  document.body.classList.add('modal-open');
  $('sheet').innerHTML=`<button class="close" onclick="closeModal()">×</button><h2>自定义标签</h2>
    <p class="muted" style="margin:6px 0 14px">可以修改名称，也可以删除。删除标签不会删除已经写进小说记录里的标签。</p>
    <div id="customTagList"></div>
    <button class="primary" style="margin-top:14px" onclick="addCustomTagFromManager()">＋ 新增标签</button>`;
  renderCustomTagManager();
}
function renderCustomTagManager(){
  const el=$('customTagList'); if(!el)return;
  const tags=data.customTags||[];
  el.innerHTML=tags.length?tags.map((t,i)=>`<div class="customTagRow">
    <span class="miniTag">${esc(t)}</span>
    <div class="customTagActions"><button type="button" class="link" onclick="editCustomTag(${i})">修改</button><button type="button" class="danger" onclick="deleteCustomTag(${i})">删除</button></div>
  </div>`).join(''):`<div class="empty">还没有自定义标签</div>`;
}
function addCustomTagFromManager(){
  let t=prompt('输入自定义标签');
  t=(t||'').trim();
  if(!t)return;
  if(data.customTags.includes(t))return alert('这个标签已经存在');
  data.customTags.push(t);save();renderCustomTagManager();
}
function editCustomTag(i){
  const old=data.customTags[i];
  if(old==null)return;
  let t=prompt('修改标签名称',old);
  t=(t||'').trim();
  if(!t||t===old)return;
  if(data.customTags.some((x,j)=>j!==i&&x===t))return alert('这个标签已经存在');
  data.customTags[i]=t;
  // Keep existing books' tag references in sync with the renamed custom tag.
  data.books.forEach(b=>{if((b.tags||[]).includes(old)){b.tags=b.tags.map(x=>x===old?t:x)}});
  save();renderCustomTagManager();
}
function deleteCustomTag(i){
  const old=data.customTags[i];
  if(old==null)return;
  if(!confirm(`确定删除自定义标签“${old}”吗？\n已经添加到小说里的标签会保留。`))return;
  data.customTags.splice(i,1);save();renderCustomTagManager();
}
function chooseCover(input,target){let file=input.files[0];if(!file)return;let r=new FileReader();r.onload=()=>{if(target==='new'){newCover=r.result;let x=$('newCoverPreview');if(x)x.innerHTML='<img src="'+r.result+'">'}else{editCover=r.result;let x=$('editCoverPreview');if(x)x.innerHTML='<img src="'+r.result+'">'}};r.readAsDataURL(file)}
function renderTagButtons(target){
  const el=$(target==='new'?'newTags':'editTags'); if(!el)return;
  const arr=target==='new'?newTags:editTags;
  const builtInTags=['甜宠','治愈','校园','虐恋','悬疑','群像'];
  const tags=[...new Set([...builtInTags,...(data.customTags||[])])];
  el.innerHTML=tags.map((t,i)=>`<button type="button" class="tagChoice ${arr.includes(t)?'sel':''}" data-tag-index="${i}" onclick="event.preventDefault();event.stopPropagation();toggleTagByIndex(${i},'${target}')">${esc(t)}</button>`).join('');
  el.dataset.target=target;
  el._tags=tags;
}
function toggleTagByIndex(i,target){
  const el=$(target==='new'?'newTags':'editTags');
  const tags=el&&el._tags?el._tags:[];
  const t=tags[i];
  if(t==null)return;
  toggleTag(t,target);
}
function toggleTag(t,target){
  const arr=target==='new'?newTags:editTags;
  const i=arr.indexOf(t);
  if(i>=0)arr.splice(i,1);else arr.push(t);
  renderTagButtons(target);
}
function openAdd(){
  $('modal').classList.add('show');document.body.classList.add('modal-open');newCover='';newTags=[];newScoreVal=0;newEmoji='♡';
  $('sheet').innerHTML=`<button class="close" onclick="closeModal()">×</button><h2>添加小说</h2>
  <div class="field"><label>小说名 · 必填</label><input id="f_title" placeholder="请输入书名"></div>
  <div class="field"><label>作者 · 必填</label><input id="f_author" placeholder="请输入作者"></div>
  <div class="field"><label>平台 · 选填</label><input id="f_platform" placeholder="晋江 / 长佩 / 番茄……"></div>
  <div class="field"><label>分类</label><select id="f_type"><option>都市纯爱</option><option>现代幻想</option><option>古代纯爱</option><option>未来幻想</option></select></div>
  <div class="field"><label>标签 · 可多选</label><div id="newTags" class="tagrow"></div></div>
  <div class="field"><label>阅读状态</label><select id="f_status"><option>在读</option><option>已看完</option><option>弃文</option></select></div>
  <div class="field"><label>开始阅读日期</label><input id="f_start" type="date"></div>
  <div class="field"><label>结束日期 · 在读可留空</label><input id="f_end" type="date"></div>
  <div class="field"><label>封面 · 可选</label><div class="coverUpload"><div id="newCoverPreview" class="cover">纯色封面</div><label class="uploadBtn">从相册选择<input type="file" accept="image/*" style="display:none" onchange="chooseCover(this,'new')"></label></div></div>
  <div class="field"><label>评分 · 点星星</label><div id="newstars" class="stars">${[1,2,3,4,5].map(n=>`<button class="star off" onclick="newScore(${n})">★</button>`).join('')}</div></div>
  <div class="field"><label>笔记 / 名场面 / 字数 · 选填</label><textarea id="f_note" placeholder="懒得填就留空，详情里也不会显示空项"></textarea></div>
  <div class="field"><label>弃文原因 · 可自定义</label><input id="f_reason" placeholder="弃文时填写"></div>
  <button class="primary" onclick="createBook()">保存到书架</button>`;
  f_start.value=isoDate(new Date());renderTagButtons('new');
}
function newScore(n){newScoreVal=n;document.querySelectorAll('#newstars .star').forEach((x,i)=>x.classList.toggle('off',i>=n))}
function createBook(){
  let t=f_title.value.trim(),a=f_author.value.trim();if(!t||!a)return alert('小说名和作者都要填写');
  let ds=f_start.value||isoDate(new Date()),de=f_end.value,status=f_status.value;if(status==='已看完'&&!de)de=ds;
  let b={id:Date.now(),title:t,author:a,platform:f_platform.value.trim(),type:f_type.value,status,score:newScoreVal,emoji:newEmoji,dateStart:ds,dateEnd:de,note:f_note.value.trim(),reason:f_reason.value.trim(),tags:[...newTags],cover:newCover,rank:data.books.length+1};
  data.books.unshift(b);save();closeModal();filter='全部';go('shelf')
}
function openDetail(id){
  detailId=id;let b=data.books.find(x=>x.id===id);$('modal').classList.add('show');document.body.classList.add('modal-open');
  $('sheet').innerHTML=`<button class="close" onclick="closeModal()">×</button><div class="detailTitle">${coverHtml(b)}<div><h2 style="margin:0 0 5px">${esc(b.title)}</h2><div class="muted">${esc(b.author)}</div>${b.platform?`<div class="muted">${esc(b.platform)}</div>`:''}${stars(b)}${statusPill(b.status)}</div></div>
  <div class="detailBox"><div class="detailLine"><span>分类</span><b>${esc(b.type||'未填写')}</b></div><div class="detailLine"><span>标签</span><b>${(b.tags||[]).map(esc).join('、')||'无'}</b></div><div class="detailLine"><span>阅读日期</span><b>${fmt(b.dateStart)}${b.dateEnd&&b.dateEnd!==b.dateStart?' → '+fmt(b.dateEnd):''}</b></div>${b.note?`<div class="detailLine notePreviewRow" onclick="openNoteReader(${id})"><span>笔记</span><b class="notePreview">${esc(b.note)}</b><small class="noteTap">轻触放大阅读</small></div>`:''}${b.reason?`<div class="detailLine"><span>弃文原因</span><b>${esc(b.reason)}</b></div>`:''}</div>
  <button class="primary" style="margin-top:12px" onclick="editBook(${id})">编辑小说</button><button class="danger" style="width:100%;margin-top:9px" onclick="deleteBook(${id})">删除这本书</button>`;
}
function deleteBook(id){if(!confirm('确定删除这本书吗？'))return;data.books=data.books.filter(b=>b.id!==id);save();closeModal();render()}
function editBook(id){
  document.body.classList.add('modal-open');
  let b=data.books.find(x=>x.id===id);editCover=b.cover||'';editTags=[...(b.tags||[])];
  $('sheet').innerHTML=`<button class="close" onclick="closeModal()">×</button><h2>编辑小说</h2>
  <div class="field"><label>小说名</label><input id="e_title" value="${esc(b.title)}"></div><div class="field"><label>作者 · 必填</label><input id="e_author" value="${esc(b.author)}"></div>
  <div class="field"><label>平台 · 选填</label><input id="e_platform" value="${esc(b.platform||'')}"></div>
  <div class="field"><label>分类</label><select id="e_type">${['都市纯爱','现代幻想','古代纯爱','未来幻想'].map(x=>`<option ${b.type===x?'selected':''}>${x}</option>`).join('')}</select></div>
  <div class="field"><label>标签</label><div id="editTags" class="tagrow"></div></div>
  <div class="field"><label>阅读状态</label><select id="e_status"><option ${b.status==='在读'?'selected':''}>在读</option><option ${b.status==='已看完'?'selected':''}>已看完</option><option ${b.status==='弃文'?'selected':''}>弃文</option></select></div>
  <div class="field"><label>开始阅读日期</label><input id="e_start" type="date" value="${b.dateStart||''}"></div><div class="field"><label>结束日期</label><input id="e_end" type="date" value="${b.dateEnd||''}"></div>
  <div class="field"><label>封面</label><div class="coverUpload"><div id="editCoverPreview" class="cover">${editCover?'<img src="'+editCover+'">':'纯色封面'}</div><label class="uploadBtn">从相册选择<input type="file" accept="image/*" style="display:none" onchange="chooseCover(this,'edit')"></label></div></div>
  <div class="field"><label>评分 · 点星星</label><div class="stars">${[1,2,3,4,5].map(n=>`<button class="star ${n<=b.score?'':'off'}" onclick="rate(${id},${n});editBook(${id})">★</button>`).join('')}</div></div>
  <div class="field"><label>笔记 / 名场面 / 字数 · 选填</label><textarea id="e_note">${esc(b.note||'')}</textarea></div><div class="field"><label>弃文原因 · 可自定义</label><input id="e_reason" value="${esc(b.reason||'')}"></div>
  <button class="primary" onclick="updateBook(${id})">保存修改</button>`;
  renderTagButtons('edit')
}
function rate(id,n){let b=data.books.find(x=>x.id===id);b.score=n;save()}
function updateBook(id){
  let b=data.books.find(x=>x.id===id);b.title=e_title.value.trim();b.author=e_author.value.trim();b.platform=e_platform.value.trim();b.type=e_type.value;b.status=e_status.value;b.dateStart=e_start.value;b.dateEnd=e_end.value;b.note=e_note.value.trim();b.reason=e_reason.value.trim();b.tags=[...editTags];b.cover=editCover;
  if(b.status==='已看完'&&!b.dateEnd)b.dateEnd=b.dateStart;save();closeModal();render()
}

function exportData(){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='我的小说小窝备份.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
function importData(e){
  const file=e && e.target && e.target.files ? e.target.files[0] : null;
  if(!file)return;
  const reader=new FileReader();
  reader.onload=function(){
    try{
      const raw=JSON.parse(reader.result);
      // 兼容旧版/当前版备份：允许直接是数据对象，也允许包在 data / novelNestFull 中。
      const obj = raw && raw.books ? raw :
                  (raw && raw.data && raw.data.books ? raw.data : null) ||
                  (raw && raw.novelNestFull && raw.novelNestFull.books ? raw.novelNestFull : null);
      if(!obj || !Array.isArray(obj.books)) throw new Error('invalid');

      const imported={
        theme:obj.theme || '#9d8bd7',
        books:Array.isArray(obj.books)?obj.books.map((b,i)=>({
          ...b,
          id:b.id ?? Date.now()+i,
          title:b.title || '',
          author:b.author || '',
          platform:b.platform || '',
          type:({'都市':'都市纯爱','现代':'现代幻想','古代':'古代纯爱','未来幻想':'未来幻想'}[b.type]||b.type||''),
          status:b.status || '在读',
          score:Number.isFinite(Number(b.score))?Number(b.score):0,
          emoji:b.emoji || '♡',
          dateStart:b.dateStart || b.date || '',
          dateEnd:b.dateEnd || '',
          note:b.note || '',
          reason:b.reason || '',
          tags:Array.isArray(b.tags)?b.tags:[],
          cover:b.cover || '',
          rank:b.rank ?? i+1
        })):[],
        customTags:Array.isArray(obj.customTags)?obj.customTags:[]
      };

      data=imported;
      bookSearchKeyword='';
      bookPage=1;
      localStorage.setItem(key,JSON.stringify(data));
      document.documentElement.style.setProperty('--accent',data.theme);
      alert('恢复成功');
      closeModal();
      render();
    }catch(err){
      console.error('导入备份失败:',err);
      alert('备份文件无效或格式无法识别');
    }finally{
      // 允许再次选择同一个备份文件
      e.target.value='';
    }
  };
  reader.onerror=function(){
    e.target.value='';
    alert('读取备份文件失败');
  };
  reader.readAsText(file,'utf-8');
}

function openSettings(){
  $('modal').classList.add('show');document.body.classList.add('modal-open');$('sheet').innerHTML=`<button class="close" onclick="closeModal()">×</button><h2>设置</h2>
  <div class="settingrow"><span>主题颜色</span><div class="colors">${['#9d8bd7','#9eb9e9','#9ed7c0','#efb4c7','#f0c98d','#9faec3'].map(c=>`<button class="color" style="background:${c}" onclick="setTheme('${c}')"></button>`).join('')}</div></div>
  <div class="settingrow"><span>自定义标签</span><button class="link" onclick="openTagManager()">管理</button></div>
  <div class="settingrow"><span>数据管理</span><div><button class="link" onclick="exportData()">导出</button><button class="link" onclick="$('backupInput').click()">导入</button></div></div>
  <input id="backupInput" type="file" accept="application/json" style="display:none" onchange="importData(event)">`;
}
function setTheme(c){data.theme=c;document.documentElement.style.setProperty('--accent',c);document.querySelectorAll('.primary').forEach(x=>x.style.background=c);save();closeModal();render()}
function closeModal(){$('modal').classList.remove('show');document.body.classList.remove('modal-open')}
$('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
render();


function openNoteReader(id){
  const b=data.books.find(x=>x.id===id); if(!b||!b.note)return;
  $('noteReaderBody').textContent=b.note;
  $('noteReader').classList.add('show');
}
function closeNoteReader(){ $('noteReader').classList.remove('show'); }
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNoteReader()});


window.bookSearchKeyword = "";

function searchBookMatch(book){
 const key=(window.bookSearchKeyword||"").trim().toLowerCase();
 if(!key) return true;
 const data=[
  book.title||"",
  book.author||"",
  ...(book.tags||[])
 ].join(" ").toLowerCase();
 return data.includes(key);
}

document.addEventListener("DOMContentLoaded",function(){
 const input=document.getElementById("bookSearchInput");
 if(input){
  input.addEventListener("input",function(e){
   window.bookSearchKeyword=e.target.value;
   if(typeof renderBooks==="function"){
    renderBooks();
   }
  });
 }
});


(function(){
  function normalizeImportedData(raw){
    if(!raw || typeof raw!=="object") return null;
    var d=raw.data && typeof raw.data==="object" ? raw.data : raw;
    if(Array.isArray(d.books) || Array.isArray(d.records) || Array.isArray(d.tags) || Array.isArray(d.customTags)){
      d.books=Array.isArray(d.books)?d.books:[];
      d.records=Array.isArray(d.records)?d.records:[];
      d.tags=Array.isArray(d.tags)?d.tags:[];
      d.customTags=Array.isArray(d.customTags)?d.customTags:[];
      return d;
    }
    return null;
  }

  function install(){
    var inputs=document.querySelectorAll('input[type="file"]');
    inputs.forEach(function(input){
      if(input.dataset.importFixInstalled) return;
      var accept=(input.getAttribute("accept")||"").toLowerCase();
      var parentText=(input.parentElement&&input.parentElement.innerText||"").toLowerCase();
      if(!(accept.indexOf("json")>=0 || parentText.indexOf("导入")>=0 || parentText.indexOf("备份")>=0)) return;
      input.dataset.importFixInstalled="1";
      input.addEventListener("change",function(e){
        var file=e.target.files&&e.target.files[0];
        if(!file) return;
        var reader=new FileReader();
        reader.onload=function(ev){
          try{
            var raw=JSON.parse(ev.target.result);
            var imported=normalizeImportedData(raw);
            if(!imported) throw new Error("invalid");
            if(typeof window.data!=="undefined"){
              window.data=Object.assign(window.data, imported);
              try{localStorage.setItem("novelNookData",JSON.stringify(window.data));}catch(_){}
            }
            if(typeof window.render==="function") window.render();
            else if(typeof window.renderShelf==="function"){
              var v=document.getElementById("view"); if(v) window.renderShelf(v);
            }
            input.value="";
          }catch(err){
            // Do not show a stale success state; let the original handler decide
            // if it already owns this input. This branch is only a fallback.
            console.warn("备份导入失败",err);
          }
        };
        reader.readAsText(file);
      }, true);
    });
  }
  document.addEventListener("DOMContentLoaded",install);
  window.addEventListener("load",install);
  setTimeout(install,500);
})();
