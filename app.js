(function(){
var S=window.SITE,$=function(i){return document.getElementById(i)};
// defaults for the staff shortcut and visitor counter (config.js can override any of these)
var DEF={staffLink:"https://www.bizbale.com/x/7d9kQ2pLm8R4",adminLink:"admin.html",countVisits:true,showVisitors:true};
Object.keys(DEF).forEach(function(k){if(S[k]===undefined)S[k]=DEF[k]});
var API=(S.supabaseUrl||"").replace(/\/$/,""),KEY=S.supabaseKey||"",USE_DB=!!(API&&KEY);
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function wa(t){return "https://wa.me/"+S.whatsapp+"?text="+encodeURIComponent(t||("Hello "+S.name+", I want to know about bikes."))}
// ---- static parts
$("offer").textContent=S.offerBanner;$("offer").style.display=S.offerBanner?"block":"none";
if(S.heroLogo){var li=new Image();li.alt="Hero MotoCorp";li.src=S.heroLogo;li.className="logo";li.onerror=function(){li.remove()};$("hlogo").appendChild(li);var l2=li.cloneNode();l2.draggable=false;$("flogo").appendChild(l2)}
$("brand").textContent=S.name.split(" ").map(function(w){return w[0]}).join("").slice(0,3);
$("h1").textContent=S.name;$("full").textContent=S.fullName;$("tag").textContent=S.tagline+" - "+S.city;
$("hphone").textContent=S.phone;$("hphone").href="tel:+91"+S.phone;$("hcall").href="tel:+91"+S.phone;$("hwa").href=wa();$("waUsed").href=wa("Hello, I want to know about used bikes available at "+S.name);
$("barCall").href="tel:+91"+S.phone;$("barWa").href=wa();
$("addr").textContent=S.address;$("hrs").textContent=S.hours;
$("telA").textContent=S.phone;$("telA").href="tel:+91"+S.phone;if(S.email){$("mailA").textContent=S.email;$("mailA").href="mailto:"+S.email}else{$("mailP").style.display="none"}
$("yr").textContent=new Date().getFullYear();$("fname").textContent=S.fullName+" ("+S.name+")";
// ---- hidden staff shortcut: tap the Hero logo in the footer 5 times (each tap within 1.5 sec of the last) -> BizBale staff login
(function(){
  var n=0,last=0;
  $("flogo").addEventListener("click",function(e){
    if(!S.staffLink||!e.target||e.target.tagName!=="IMG")return;
    var now=Date.now();n=now-last>1500?1:n+1;last=now;
    if(n>=5){n=0;try{localStorage.setItem("nh_staff","1")}catch(x){}location.href=S.staffLink}
  });
})();
// ---- hidden admin shortcut: tap the "Website visitors" line (or the copyright line) in the footer 5 times (each tap within 1.5 sec of the last) -> this site's staff admin login
(function(){
  var n=0,last=0;
  function tap(){
    if(!S.adminLink)return;
    var now=Date.now();n=now-last>1500?1:n+1;last=now;
    if(n>=5){n=0;try{localStorage.setItem("nh_staff","1")}catch(x){}location.href=S.adminLink}
  }
  ["vis","fname"].forEach(function(id){var el=$(id);if(el)el.addEventListener("click",tap)});
})();
// ---- visitor counter: one count per device per day. Staff devices and robots are not counted. Needs the count_visit SQL.
(function(){
  if(!USE_DB||(S.countVisits===false&&S.showVisitors===false))return;
  var staff=false,seen="",day=new Date(Date.now()+19800000).toISOString().slice(0,10);
  try{staff=!!localStorage.getItem("nh_staff");seen=localStorage.getItem("nh_seen")||""}catch(e){}
  var bot=!!navigator.webdriver||/bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent||"");
  var isNew=S.countVisits!==false&&!staff&&!bot&&seen!==day;
  fetch(API+"/rest/v1/rpc/count_visit",{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json"},body:JSON.stringify({p_new:isNew})})
    .then(function(r){if(!r.ok)throw new Error("stats");return r.json()})
    .then(function(n){
      if(isNew){try{localStorage.setItem("nh_seen",day)}catch(e){}}
      n=Number(n);if(S.showVisitors===false||!isFinite(n)||n<1)return;
      var v=$("vis");v.textContent="Website visitors: "+n.toLocaleString("en-IN");v.hidden=false})
    .catch(function(){});
})();
if(S.mapLink){$("dir").href=S.mapLink}else{$("dir").parentNode.style.display="none"}
if(S.mapEmbed){$("mapBox").innerHTML='<iframe loading="lazy" src="'+S.mapEmbed+'" title="Map"></iframe>'}
// ---- data
var BIKES=[],USED=[],cur="All",curMake="All",L=window.USED_LISTS||{makes:[],models:{},warranty:[]};
function fallback(){return (window.MODELS||[]).map(function(m){return {id:m.id,name:m.name,type:m.type,cc:m.cc,price:m.price||"",mileage:m.mileage||"",colours:"",note:m.note||"",description:"",images:m.image?[m.image]:[]}})}
function rest(path){return fetch(API+"/rest/v1/"+path,{headers:{apikey:KEY,Accept:"application/json"}}).then(function(r){if(!r.ok)throw new Error("http "+r.status);return r.json()})}
function load(){
  if(!USE_DB)return;
  rest("bikes?select=*&active=eq.true&order=sort.asc,name.asc").then(function(b){BIKES=b;draw()}).catch(function(){});
  rest("used_bikes?select=*&status=eq.available&order=created_at.desc").then(function(u){USED=u;drawUsed()}).catch(function(){});
  rest("banners?select=image_url&active=eq.true&order=sort.asc,id.asc&limit=6").then(setBanners).catch(function(){});
}
// ---- home page banner slideshow (photos are added in Admin > Banners)
function setBanners(rows){
  var urls=(rows||[]).map(function(r){return r.image_url}).filter(Boolean);if(!urls.length)return;
  var box=$("slides"),hero=$("top"),dots=$("sdots");
  box.innerHTML=urls.map(function(){return '<div class="slide"></div>'}).join("");hero.className+=" has-slides";
  var sl=[].slice.call(box.children),cur=0,timer=null;
  function loadAt(i){if(!sl[i].style.backgroundImage)sl[i].style.backgroundImage="url('"+urls[i].replace(/'/g,"%27")+"')"}
  function show(i){cur=(i+sl.length)%sl.length;loadAt(cur);sl.forEach(function(e,k){e.classList.toggle("on",k===cur)});[].forEach.call(dots.children,function(e,k){e.classList.toggle("on",k===cur)});
    if(sl.length>1){var n=new Image();n.src=urls[(cur+1)%sl.length]}}
  function restart(){clearInterval(timer);if(sl.length>1&&!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches))timer=setInterval(function(){if(!document.hidden)show(cur+1)},5000)}
  if(sl.length>1){dots.innerHTML=urls.map(function(_,i){return '<button type="button" aria-label="Show photo '+(i+1)+'"></button>'}).join("");
    dots.addEventListener("click",function(e){var k=[].indexOf.call(dots.children,e.target);if(k>=0){show(k);restart()}})}
  show(0);restart()}
// ---- new bikes
function imgTag(m){var u=m.images&&m.images[0];return u?'<img loading="lazy" src="'+esc(u)+'" alt="'+esc(m.name||m.title)+'">':'<span>Photo coming soon</span>'}
function badge(m){return m.images&&m.images.length>1?'<span class="badge">'+m.images.length+' photos</span>':""}
function drawFilters(){var t=["All"];BIKES.forEach(function(b){if(t.indexOf(b.type)<0)t.push(b.type)});if(t.indexOf(cur)<0)cur="All";
  var h="";t.forEach(function(x){h+='<button type="button" class="chip'+(x===cur?' on':'')+'" data-t="'+esc(x)+'">'+esc(x)+'</button>'});$("filters").innerHTML=t.length>2?h:""}
// ---- bike card (cream card, key points, strike-through ex-showroom price, offer price, orange button)
var LANT='<svg class="lants" viewBox="0 0 70 96" aria-hidden="true"><g stroke="#8a6a3a" stroke-width="1.2" fill="none"><path d="M22 0v18M52 0v10"/></g><g><rect x="18" y="18" width="8" height="4" rx="1" fill="#c9922e"/><path d="M14 26c0-3 3-4 8-4s8 1 8 4v22c0 3-3 4-8 4s-8-1-8-4z" fill="#e8472b"/><path d="M22 22v30M14 32h16M14 42h16" stroke="#f6c445" stroke-width="2"/><path d="M22 52v10M19 62h6" stroke="#c9922e" stroke-width="2"/><rect x="48" y="10" width="8" height="4" rx="1" fill="#c9922e"/><path d="M42 18c0-3 4-5 10-5s10 2 10 5v32c0 3-4 5-10 5s-10-2-10-5z" fill="#d9322a"/><path d="M52 13v42M42 26h20M42 40h20" stroke="#f6c445" stroke-width="2.4"/><circle cx="52" cy="30" r="5" fill="#2f8f4e"/><path d="M52 55v16M48 71h8" stroke="#c9922e" stroke-width="2.4"/></g></svg>';
function rupee(s){s=String(s||"").trim();return s?s.replace(/^\s*(rs\.?|inr|₹)\s*/i,"₹ "):""}
function today(){return new Date(Date.now()+19800000).toISOString().slice(0,10)}
function offerOn(m){return !!(m.offer_price&&(!m.offer_till||String(m.offer_till).slice(0,10)>=today()))}
function tillTxt(m){var d=String(m.offer_till||"").slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(d)?"(Valid Till "+d.slice(8,10)+"/"+d.slice(5,7)+"/"+d.slice(2,4)+")":""}
function specsOf(m){var a=String(m.specs||"").split(/\r?\n/).map(function(x){return x.trim()}).filter(Boolean);
  if(!a.length){if(m.cc)a.push(m.cc+"cc Engine Displacement");if(m.mileage)a.push("Mileage "+m.mileage);if(m.colours)a.push("Colours: "+m.colours);if(m.note)a.push(m.note)}
  return a.slice(0,4)}
function drawGrid(){var h="";BIKES.forEach(function(m,i){if(cur!=="All"&&m.type!==cur)return;
  var sp=specsOf(m).map(function(x){return "<li>"+esc(x)+"</li>"}).join(""),on=offerOn(m),pr=rupee(m.price),city=String(S.city||"").toUpperCase(),pb;
  if(on)pb='<div class="p1"><s>'+esc(pr||"")+'</s><small>Ex-Showroom Price'+(city?", "+esc(city):"")+'</small></div><div class="p2"><b>'+esc(rupee(m.offer_price))+'</b><small class="og">Offer Price*</small>'+(tillTxt(m)?'<small class="rd">'+tillTxt(m)+'</small>':'')+'</div>';
  else pb='<div class="p1 only">'+(pr?'<b>'+esc(pr)+'</b><small>Ex-Showroom Price'+(city?", "+esc(city):"")+'</small>':'<b class="cp">Call for price</b>')+'</div>';
  h+='<div class="bcard"><div class="bin">'+LANT+'<div class="bimg" data-open="b:'+i+'">'+imgTag(m)+badge(m)+'</div><h3>'+esc(m.name)+'</h3><ul class="specs">'+sp+'</ul><div class="prow">'+pb+'</div><button type="button" class="deal" data-m="'+esc(m.name)+'">GET BEST DEAL</button></div></div>'});
  $("grid").innerHTML=h||"<p>No bike in this category.</p>"}
function draw(){drawFilters();drawGrid()}
// ---- used bikes
function usedPrice(m){return m.sale_price!=null&&m.sale_price!==""?"Rs "+Number(m.sale_price).toLocaleString("en-IN"):(m.price||"")}
function usedMake(m){return m.make||String(m.title||"").split(" ")[0]||""}
function usedTags(m){var t=[];if(m.year)t.push(String(m.year));if(m.km!=null&&m.km!=="")t.push(Number(m.km).toLocaleString("en-IN")+" km");if(m.warranty)t.push("Warranty: "+m.warranty);if(m.owner)t.push(m.owner);if(m.colour)t.push(m.colour);return t}
function drawUsedFilters(){var t=["All"];USED.forEach(function(b){var k=usedMake(b);if(k&&t.indexOf(k)<0)t.push(k)});if(t.indexOf(curMake)<0)curMake="All";
  var h="";t.forEach(function(x){h+='<button type="button" class="chip'+(x===curMake?' on':'')+'" data-um="'+esc(x)+'">'+esc(x)+'</button>'});$("usedFilters").innerHTML=t.length>2?h:""}
function drawUsed(){drawUsedFilters();var h="";USED.forEach(function(m,i){if(curMake!=="All"&&usedMake(m)!==curMake)return;
  var t=usedTags(m).map(function(x){return '<span class="tag">'+esc(x)+'</span>'}).join(""),pr=usedPrice(m);
  h+='<div class="card"><div class="img" data-open="u:'+i+'">'+imgTag(m)+badge(m)+'</div><div class="b"><h3>'+esc(m.title)+'</h3><div class="tags">'+t+'</div><div class="price">'+(pr?'Sale price '+esc(pr):'Call for price')+'</div><a class="btn btn-red" target="_blank" rel="noopener" href="'+esc(wa("Hello, I am interested in the used bike: "+m.title+(pr?" ("+pr+")":"")))+'">Enquire on WhatsApp</a></div></div>'});
  $("usedGrid").innerHTML=h;$("usedSub").textContent=USED.length?"Checked second-hand bikes with sale price. Tap a photo to see more.":"No used bike listed right now. Call or WhatsApp us to know what is coming."}
$("usedFilters").addEventListener("click",function(e){var t=e.target.getAttribute("data-um");if(t){curMake=t;drawUsed()}});
// ---- detail popup
function openModal(kind,i){var m=(kind==="b"?BIKES:USED)[i];if(!m)return;var im=m.images||[];
  var g=im.length?'<img class="gmain" id="gmain" src="'+esc(im[0])+'" alt="">'+(im.length>1?'<div class="thumbs">'+im.map(function(u,k){return '<img data-g="'+esc(u)+'" class="'+(k?'':'on')+'" src="'+esc(u)+'" alt="">'}).join("")+'</div>':""):'<div class="gph">Photo coming soon</div>';
  var tags=kind==="b"?[m.type,m.cc?m.cc+" cc":"",m.mileage,m.colours]:usedTags(m);
  var title=kind==="b"?m.name:m.title,price=kind==="b"?(offerOn(m)?"Offer price "+rupee(m.offer_price)+" (Ex-showroom "+rupee(m.price)+")":m.price?"Ex-showroom "+rupee(m.price):"Call for price"):(usedPrice(m)?"Sale price "+usedPrice(m):"Call for price");
  var txt=(m.description||m.note||"");
  $("mbody").innerHTML=g+'<h3>'+esc(title)+'</h3><div class="tags">'+tags.filter(Boolean).map(function(x){return '<span class="tag">'+esc(x)+'</span>'}).join("")+'</div><p><b>'+esc(price)+'</b></p>'+(txt?'<p>'+esc(txt)+'</p>':'')+
   '<div class="mbtns">'+(kind==="b"?'<button class="btn btn-red" type="button" data-m="'+esc(title)+'">Get Best Deal</button>':'')+'<a class="btn btn-wa" target="_blank" rel="noopener" href="'+esc(wa("Hello, I want details of: "+title))+'">WhatsApp</a><a class="btn btn-line" href="tel:+91'+S.phone+'">Call</a></div>';
  $("modal").hidden=false}
function closeModal(){$("modal").hidden=true}
$("mclose").addEventListener("click",closeModal);
$("modal").addEventListener("click",function(e){if(e.target===$("modal"))closeModal();var g=e.target.getAttribute&&e.target.getAttribute("data-g");if(g){$("gmain").src=g;[].forEach.call(document.querySelectorAll(".thumbs img"),function(x){x.classList.toggle("on",x===e.target)})}var m=e.target.getAttribute&&e.target.getAttribute("data-m");if(m)pick(m)});
document.addEventListener("keydown",function(e){if(e.key==="Escape")closeModal()});
// the bike the customer tapped "Get Best Price" on (shown as a line above the button, sent with the enquiry)
var picked="";
function setPicked(n){picked=n||"";var p=$("picked");p.hidden=!picked;p.innerHTML=picked?'Enquiry for: <b>'+esc(picked)+'</b> <button type="button" id="unpick" aria-label="Remove">&times;</button>':""}
$("picked").addEventListener("click",function(e){if(e.target.id==="unpick")setPicked("")});
function pick(name){closeModal();setPicked(name);$("enquiry").scrollIntoView({behavior:"smooth"})}
function onGrid(e){var o=e.target.closest&&e.target.closest("[data-open]");if(o){var p=o.getAttribute("data-open").split(":");return openModal(p[0],+p[1])}var m=e.target.getAttribute&&e.target.getAttribute("data-m");if(m)pick(m)}
$("grid").addEventListener("click",onGrid);$("usedGrid").addEventListener("click",onGrid);
$("filters").addEventListener("click",function(e){var t=e.target.getAttribute("data-t");if(t){cur=t;drawFilters();drawGrid()}});
BIKES=fallback();draw();drawUsed();load();
// ---- sell your bike (customer leaves details so we can call)
(function(){
  var mk=$("makeList"),md=$("modelList"),f=$("sellForm");
  mk.innerHTML=(L.makes||[]).map(function(x){return '<option value="'+esc(x)+'">'}).join("");
  function models(){var v=f.elements["make"].value.trim().toLowerCase(),a=[];Object.keys(L.models||{}).forEach(function(k){if(k.toLowerCase()===v)a=L.models[k]});md.innerHTML=a.map(function(x){return '<option value="'+esc(x)+'">'}).join("")}
  f.elements["make"].addEventListener("input",models);models();
  function sm(t,ok){var m=$("sellMsg");m.textContent=t;m.className="msg "+(ok?"ok":"err")}
  f.addEventListener("submit",function(ev){
    ev.preventDefault();var d={};new FormData(f).forEach(function(v,k){d[k]=String(v).trim()});
    if(d.botcheck){return}
    if(!d.name||d.name.length<2){return sm("Please enter your name.",0)}
    if(!/^[6-9]\d{9}$/.test(d.mobile)){return sm("Please enter a valid 10 digit mobile number.",0)}
    if(!d.make){return sm("Please enter the bike make, for example Hero or Bajaj.",0)}
    if(!d.model){return sm("Please enter the bike model, for example Splendor or Platina.",0)}
    var yr=d.year?+d.year:null;
    if(d.year&&(!/^\d{4}$/.test(d.year)||yr<1990||yr>new Date().getFullYear()+1)){return sm("Please enter the year in 4 digits, for example 2019.",0)}
    var kmT=d.km.replace(/[, ]/g,""),prT=d.price.replace(/[, ]/g,"");
    if(kmT&&!/^\d{1,7}$/.test(kmT)){return sm("Please enter the run in numbers only, for example 25000.",0)}
    if(prT&&!/^\d{1,9}$/.test(prT)){return sm("Please enter the price in numbers only, for example 40000.",0)}
    var text="I want to sell my bike - "+S.name+"\nName: "+d.name+"\nMobile: "+d.mobile+"\nBike: "+d.make+" "+d.model+(yr?" ("+yr+")":"")+"\nRun: "+(kmT?kmT+" km":"-")+"\nExpected price: "+(prT?"Rs "+prT:"-")+"\nPlace: "+(d.place||"-");
    function viaWa(){window.open(wa(text),"_blank");sm("Opening WhatsApp. Please press Send there.",1)}
    if(!USE_DB&&!S.web3formsKey){return viaWa()}
    var b=$("sellSend");b.disabled=true;b.textContent="Sending...";var jobs=[];
    if(USE_DB){jobs.push(fetch(API+"/rest/v1/sell_requests",{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({name:d.name,mobile:d.mobile,make:d.make,model:d.model,year:yr,km:kmT?+kmT:null,expected_price:prT,place:d.place||""})}).then(function(r){if(!r.ok)throw new Error("db")}))}
    if(S.web3formsKey){jobs.push(fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({access_key:S.web3formsKey,subject:"Customer wants to sell a bike - "+d.make+" "+d.model,from_name:S.name,name:d.name,mobile:d.mobile,make:d.make,model:d.model,year:d.year||"-",km:kmT||"-",expected_price:prT||"-",place:d.place||"-"})}).then(function(r){return r.json()}).then(function(j){if(!j||!j.success)throw new Error("mail")}))}
    Promise.all(jobs.map(function(p){return p.then(function(){return true},function(){return false})})).then(function(res){
      if(res.some(Boolean)){sm("Thank you! Our team will call you soon.",1);f.reset();models()}else{viaWa()}
      b.disabled=false;b.textContent="Send Details"})});
})();
// ---- EMI
function emi(){var P=+$("emiP").value||0,D=+$("emiD").value||0,r=(+$("emiR").value||0)/1200,n=+$("emiN").value,L=Math.max(0,P-D),e;
  e=r>0?L*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):L/n;
  $("emiOut").innerHTML='Loan: Rs '+Math.round(L).toLocaleString("en-IN")+'<br>Monthly EMI: <b>Rs '+Math.round(e).toLocaleString("en-IN")+'</b> x '+n+' months<br><small>Total payable: Rs '+Math.round(e*n+D).toLocaleString("en-IN")+'</small>'}
["emiP","emiD","emiR","emiN"].forEach(function(i){$(i).addEventListener("input",emi)});emi();
// ---- enquiry
function say(t,ok){var m=$("msg");m.textContent=t;m.className="msg "+(ok?"ok":"err")}
function viaWhatsApp(text){window.open(wa(text),"_blank");say("Opening WhatsApp. Please press Send there.",1)}
$("form").addEventListener("submit",function(ev){
  ev.preventDefault();var f=ev.target,d={};new FormData(f).forEach(function(v,k){d[k]=String(v).trim()});
  if(d.botcheck){return}
  if(!d.name||d.name.length<2){return say("Please enter your name.",0)}
  if(!/^[6-9]\d{9}$/.test(d.mobile)){return say("Please enter a valid 10 digit mobile number.",0)}
  var text="New enquiry - "+S.name+"\nName: "+d.name+"\nMobile: "+d.mobile+(picked?"\nModel: "+picked:"")+"\nWants: Best price / test ride";
  if(!USE_DB&&!S.web3formsKey){return viaWhatsApp(text)}
  var b=$("send");b.disabled=true;b.textContent="Sending...";
  var jobs=[];
  if(USE_DB){jobs.push(fetch(API+"/rest/v1/enquiries",{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({name:d.name,mobile:d.mobile,model:picked,want:"Best price / test ride",place:""})}).then(function(r){if(!r.ok)throw new Error("db")}))}
  if(S.web3formsKey){jobs.push(fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({access_key:S.web3formsKey,subject:"New bike enquiry"+(picked?" - "+picked:""),from_name:S.name,name:d.name,mobile:d.mobile,model:picked||"-",want:"Best price / test ride",place:"-"})}).then(function(r){return r.json()}).then(function(j){if(!j||!j.success)throw new Error("mail")}))}
  Promise.all(jobs.map(function(p){return p.then(function(){return true},function(){return false})})).then(function(res){
    if(res.some(Boolean)){say("Thank you! Our team will call you soon.",1);f.reset();setPicked("")}else{viaWhatsApp(text)}
    b.disabled=false;b.textContent="Send Enquiry"})});
})();
