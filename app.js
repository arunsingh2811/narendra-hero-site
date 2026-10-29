(function(){
var S=window.SITE,$=function(i){return document.getElementById(i)};
var API=(S.supabaseUrl||"").replace(/\/$/,""),KEY=S.supabaseKey||"",USE_DB=!!(API&&KEY);
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function wa(t){return "https://wa.me/"+S.whatsapp+"?text="+encodeURIComponent(t||("Hello "+S.name+", I want to know about bikes."))}
// ---- static parts
$("offer").textContent=S.offerBanner;$("offer").style.display=S.offerBanner?"block":"none";
if(S.heroLogo){var li=new Image();li.alt="Hero MotoCorp";li.src=S.heroLogo;li.className="logo";li.onerror=function(){li.remove()};$("hlogo").appendChild(li);var l2=li.cloneNode();$("flogo").appendChild(l2)}
$("brand").textContent=S.name.split(" ").map(function(w){return w[0]}).join("").slice(0,3);
$("h1").textContent=S.name;$("full").textContent=S.fullName;$("tag").textContent=S.tagline+" - "+S.city;
$("waTop").href=wa();$("waUsed").href=wa("Hello, I want to know about used bikes available at "+S.name);
$("barCall").href="tel:+91"+S.phone;$("barWa").href=wa();
$("addr").textContent=S.address;$("hrs").textContent=S.hours;
$("telA").textContent=S.phone;$("telA").href="tel:+91"+S.phone;if(S.email){$("mailA").textContent=S.email;$("mailA").href="mailto:"+S.email}else{$("mailP").style.display="none"}
$("yr").textContent=new Date().getFullYear();$("fname").textContent=S.fullName+" ("+S.name+")";
if(S.mapLink){$("dir").href=S.mapLink}else{$("dir").parentNode.style.display="none"}
if(S.mapEmbed){$("mapBox").innerHTML='<iframe loading="lazy" src="'+S.mapEmbed+'" title="Map"></iframe>'}
// ---- data
var BIKES=[],USED=[],cur="All";
function fallback(){return (window.MODELS||[]).map(function(m){return {id:m.id,name:m.name,type:m.type,cc:m.cc,price:m.price||"",mileage:m.mileage||"",colours:"",note:m.note||"",description:"",images:m.image?[m.image]:[]}})}
function rest(path){return fetch(API+"/rest/v1/"+path,{headers:{apikey:KEY,Accept:"application/json"}}).then(function(r){if(!r.ok)throw new Error("http "+r.status);return r.json()})}
function load(){
  if(!USE_DB)return;
  rest("bikes?select=*&active=eq.true&order=sort.asc,name.asc").then(function(b){BIKES=b;draw()}).catch(function(){});
  rest("used_bikes?select=*&status=eq.available&order=created_at.desc").then(function(u){USED=u;drawUsed()}).catch(function(){});
}
// ---- new bikes
function imgTag(m){var u=m.images&&m.images[0];return u?'<img loading="lazy" src="'+esc(u)+'" alt="'+esc(m.name||m.title)+'">':'<span>Photo coming soon</span>'}
function badge(m){return m.images&&m.images.length>1?'<span class="badge">'+m.images.length+' photos</span>':""}
function drawFilters(){var t=["All"];BIKES.forEach(function(b){if(t.indexOf(b.type)<0)t.push(b.type)});if(t.indexOf(cur)<0)cur="All";
  var h="";t.forEach(function(x){h+='<button type="button" class="chip'+(x===cur?' on':'')+'" data-t="'+esc(x)+'">'+esc(x)+'</button>'});$("filters").innerHTML=t.length>2?h:""}
function drawGrid(){var h="";BIKES.forEach(function(m,i){if(cur!=="All"&&m.type!==cur)return;
  h+='<div class="card"><div class="img" data-open="b:'+i+'">'+imgTag(m)+badge(m)+'</div><div class="b"><h3>'+esc(m.name)+'</h3><div class="tags"><span class="tag">'+esc(m.type)+'</span>'+(m.cc?'<span class="tag">'+m.cc+' cc</span>':'')+(m.mileage?'<span class="tag">'+esc(m.mileage)+'</span>':'')+'</div><div>'+esc(m.note||"")+'</div><div class="price">'+(m.price?'Ex-showroom '+esc(m.price):'Call for price')+'</div><button class="btn btn-red" data-m="'+esc(m.name)+'">Get Best Price</button></div></div>'});
  $("grid").innerHTML=h||"<p>No bike in this category.</p>"}
function fillModels(){var o='<option>Not sure yet</option>';BIKES.forEach(function(m){o+='<option>'+esc(m.name)+'</option>'});var v=$("fModel").value;$("fModel").innerHTML=o;if(v)$("fModel").value=v}
function draw(){drawFilters();drawGrid();fillModels()}
// ---- used bikes
function drawUsed(){var h="";USED.forEach(function(m,i){
  var t="";if(m.year)t+='<span class="tag">'+m.year+'</span>';if(m.km!=null&&m.km!=="")t+='<span class="tag">'+Number(m.km).toLocaleString("en-IN")+' km</span>';if(m.owner)t+='<span class="tag">'+esc(m.owner)+'</span>';if(m.colour)t+='<span class="tag">'+esc(m.colour)+'</span>';
  h+='<div class="card"><div class="img" data-open="u:'+i+'">'+imgTag(m)+badge(m)+'</div><div class="b"><h3>'+esc(m.title)+'</h3><div class="tags">'+t+'</div><div class="price">'+(m.price?'Offer price '+esc(m.price):'Call for price')+'</div><a class="btn btn-red" target="_blank" rel="noopener" href="'+esc(wa("Hello, I am interested in the used bike: "+m.title+(m.year?" ("+m.year+")":"")))+'">Enquire on WhatsApp</a></div></div>'});
  $("usedGrid").innerHTML=h;$("usedSub").textContent=USED.length?"Checked second-hand bikes with offer price. Tap a photo to see more.":"No used bike listed right now. Call or WhatsApp us to know what is coming."}
// ---- detail popup
function openModal(kind,i){var m=(kind==="b"?BIKES:USED)[i];if(!m)return;var im=m.images||[];
  var g=im.length?'<img class="gmain" id="gmain" src="'+esc(im[0])+'" alt="">'+(im.length>1?'<div class="thumbs">'+im.map(function(u,k){return '<img data-g="'+esc(u)+'" class="'+(k?'':'on')+'" src="'+esc(u)+'" alt="">'}).join("")+'</div>':""):'<div class="gph">Photo coming soon</div>';
  var tags=kind==="b"?[m.type,m.cc?m.cc+" cc":"",m.mileage,m.colours]:[m.year,m.km!=null&&m.km!==""?Number(m.km).toLocaleString("en-IN")+" km":"",m.owner,m.colour];
  var title=kind==="b"?m.name:m.title,price=kind==="b"?(m.price?"Ex-showroom "+m.price:"Call for price"):(m.price?"Offer price "+m.price:"Call for price");
  var txt=(m.description||m.note||"");
  $("mbody").innerHTML=g+'<h3>'+esc(title)+'</h3><div class="tags">'+tags.filter(Boolean).map(function(x){return '<span class="tag">'+esc(x)+'</span>'}).join("")+'</div><p><b>'+esc(price)+'</b></p>'+(txt?'<p>'+esc(txt)+'</p>':'')+
   '<div class="mbtns">'+(kind==="b"?'<button class="btn btn-red" type="button" data-m="'+esc(title)+'">Get Best Price</button>':'')+'<a class="btn btn-wa" target="_blank" rel="noopener" href="'+esc(wa("Hello, I want details of: "+title))+'">WhatsApp</a><a class="btn btn-line" href="tel:+91'+S.phone+'">Call</a></div>';
  $("modal").hidden=false}
function closeModal(){$("modal").hidden=true}
$("mclose").addEventListener("click",closeModal);
$("modal").addEventListener("click",function(e){if(e.target===$("modal"))closeModal();var g=e.target.getAttribute&&e.target.getAttribute("data-g");if(g){$("gmain").src=g;[].forEach.call(document.querySelectorAll(".thumbs img"),function(x){x.classList.toggle("on",x===e.target)})}var m=e.target.getAttribute&&e.target.getAttribute("data-m");if(m)pick(m)});
document.addEventListener("keydown",function(e){if(e.key==="Escape")closeModal()});
function pick(name){closeModal();$("fModel").value=name;$("enquiry").scrollIntoView({behavior:"smooth"})}
function onGrid(e){var o=e.target.closest&&e.target.closest("[data-open]");if(o){var p=o.getAttribute("data-open").split(":");return openModal(p[0],+p[1])}var m=e.target.getAttribute&&e.target.getAttribute("data-m");if(m)pick(m)}
$("grid").addEventListener("click",onGrid);$("usedGrid").addEventListener("click",onGrid);
$("filters").addEventListener("click",function(e){var t=e.target.getAttribute("data-t");if(t){cur=t;drawFilters();drawGrid()}});
BIKES=fallback();draw();drawUsed();load();
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
  var text="New enquiry - "+S.name+"\nName: "+d.name+"\nMobile: "+d.mobile+"\nModel: "+d.model+"\nWants: "+d.want+"\nPlace: "+(d.city||"-");
  if(!USE_DB&&!S.web3formsKey){return viaWhatsApp(text)}
  var b=$("send");b.disabled=true;b.textContent="Sending...";
  var jobs=[];
  if(USE_DB){jobs.push(fetch(API+"/rest/v1/enquiries",{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({name:d.name,mobile:d.mobile,model:d.model||"",want:d.want||"",place:d.city||""})}).then(function(r){if(!r.ok)throw new Error("db")}))}
  if(S.web3formsKey){jobs.push(fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({access_key:S.web3formsKey,subject:"New bike enquiry - "+d.model,from_name:S.name,name:d.name,mobile:d.mobile,model:d.model,want:d.want,place:d.city||"-"})}).then(function(r){return r.json()}).then(function(j){if(!j||!j.success)throw new Error("mail")}))}
  Promise.all(jobs.map(function(p){return p.then(function(){return true},function(){return false})})).then(function(res){
    if(res.some(Boolean)){say("Thank you! Our team will call you soon.",1);f.reset()}else{viaWhatsApp(text)}
    b.disabled=false;b.textContent="Send Enquiry"})});
})();
