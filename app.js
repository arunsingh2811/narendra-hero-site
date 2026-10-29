(function(){
var S=window.SITE,M=window.MODELS,$=function(i){return document.getElementById(i)};
function wa(t){return "https://wa.me/"+S.whatsapp+"?text="+encodeURIComponent(t||("Hello "+S.name+", I want to know about bikes."))}
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
// models
var types=["All","Motorcycle","Scooter"],cur="All";
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function drawFilters(){var h="";types.forEach(function(t){h+='<button type="button" class="chip'+(t===cur?' on':'')+'" data-t="'+t+'">'+t+'</button>'});$("filters").innerHTML=h}
function drawGrid(){var h="";M.filter(function(m){return cur==="All"||m.type===cur}).forEach(function(m){
  var img=m.image?'<img loading="lazy" src="'+esc(m.image)+'" alt="'+esc(m.name)+'">':'<span>Photo coming soon</span>';
  h+='<div class="card"><div class="img">'+img+'</div><div class="b"><h3>'+esc(m.name)+'</h3><div class="tags"><span class="tag">'+esc(m.type)+'</span><span class="tag">'+m.cc+' cc</span>'+(m.mileage?'<span class="tag">'+esc(m.mileage)+'</span>':'')+'</div><div>'+esc(m.note||"")+'</div><div class="price">'+(m.price?'Ex-showroom '+esc(m.price):'Call for price')+'</div><button class="btn btn-red" data-m="'+esc(m.name)+'">Get Best Price</button></div></div>'});
  $("grid").innerHTML=h||"<p>No bike in this category.</p>"}
drawFilters();drawGrid();
$("filters").addEventListener("click",function(e){var t=e.target.getAttribute("data-t");if(t){cur=t;drawFilters();drawGrid()}});
$("grid").addEventListener("click",function(e){var m=e.target.getAttribute("data-m");if(m){$("fModel").value=m;$("enquiry").scrollIntoView({behavior:"smooth"})}});
var opt='<option>Not sure yet</option>';M.forEach(function(m){opt+='<option>'+esc(m.name)+'</option>'});$("fModel").innerHTML=opt;
// EMI
function emi(){var P=+$("emiP").value||0,D=+$("emiD").value||0,r=(+$("emiR").value||0)/1200,n=+$("emiN").value,L=Math.max(0,P-D),e;
  e=r>0?L*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):L/n;
  $("emiOut").innerHTML='Loan: Rs '+Math.round(L).toLocaleString("en-IN")+'<br>Monthly EMI: <b>Rs '+Math.round(e).toLocaleString("en-IN")+'</b> x '+n+' months<br><small>Total payable: Rs '+Math.round(e*n+D).toLocaleString("en-IN")+'</small>'}
["emiP","emiD","emiR","emiN"].forEach(function(i){$(i).addEventListener("input",emi)});emi();
// enquiry
function say(t,ok){var m=$("msg");m.textContent=t;m.className="msg "+(ok?"ok":"err")}
$("form").addEventListener("submit",function(ev){
  ev.preventDefault();var f=ev.target,d={};new FormData(f).forEach(function(v,k){d[k]=String(v).trim()});
  if(d.botcheck){return}
  if(!d.name||d.name.length<2){return say("Please enter your name.",0)}
  if(!/^[6-9]\d{9}$/.test(d.mobile)){return say("Please enter a valid 10 digit mobile number.",0)}
  var text="New enquiry - "+S.name+"\nName: "+d.name+"\nMobile: "+d.mobile+"\nModel: "+d.model+"\nWants: "+d.want+"\nPlace: "+(d.city||"-");
  if(!S.web3formsKey){window.open(wa(text),"_blank");return say("Opening WhatsApp. Please press Send there.",1)}
  var b=$("send");b.disabled=true;b.textContent="Sending...";
  fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},
    body:JSON.stringify({access_key:S.web3formsKey,subject:"New bike enquiry - "+d.model,from_name:S.name,name:d.name,mobile:d.mobile,model:d.model,want:d.want,place:d.city||"-"})})
  .then(function(r){return r.json()}).then(function(j){
    if(j&&j.success){say("Thank you! Our team will call you soon.",1);f.reset()}else{throw new Error("fail")}})
  .catch(function(){say("Could not send. Please call "+S.phone+" or use WhatsApp.",0)})
  .then(function(){b.disabled=false;b.textContent="Send Enquiry"})});
})();
