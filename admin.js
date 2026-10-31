(function(){
var S=window.SITE,API=S.supabaseUrl.replace(/\/$/,""),KEY=S.supabaseKey,APP=document.getElementById("app");
var BUCKET="bike-photos";
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function $(s,r){return (r||document).querySelector(s)}
function toast(t,bad){var d=document.createElement("div");d.className="toast"+(bad?" bad":"");d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},bad?5000:2200)}
// ---------- auth
var auth=null;
try{auth=JSON.parse(localStorage.getItem("nh_auth")||"null")}catch(e){}
function saveAuth(a){auth=a;try{if(a)localStorage.setItem("nh_auth",JSON.stringify(a));else localStorage.removeItem("nh_auth")}catch(e){}}
function tokenCall(grant,body){return fetch(API+"/auth/v1/token?grant_type="+grant,{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error_description||j.msg||j.message||"Login failed");return j})})}
function setSession(j){saveAuth({access:j.access_token,refresh:j.refresh_token,exp:Date.now()+(j.expires_in||3600)*1000,email:(j.user&&j.user.email)||""})}
function fresh(){
  if(!auth)return Promise.reject(new Error("login"));
  if(auth.exp-Date.now()>60000)return Promise.resolve(auth.access);
  return tokenCall("refresh_token",{refresh_token:auth.refresh}).then(function(j){var em=auth.email;setSession(j);if(!auth.email)auth.email=em;return auth.access}).catch(function(){logout();throw new Error("Session ended. Please login again.")})
}
function logout(){saveAuth(null);showLogin()}
function call(method,path,body,extra){
  return fresh().then(function(tok){
    var h=Object.assign({apikey:KEY,Authorization:"Bearer "+tok},extra||{});
    var o={method:method,headers:h};
    if(body!==undefined){h["Content-Type"]="application/json";o.body=JSON.stringify(body)}
    return fetch(API+path,o).then(function(r){
      if(r.status===401){logout();throw new Error("Session ended. Please login again.")}
      return r.text().then(function(t){var j=null;try{j=t?JSON.parse(t):null}catch(e){}
        if(!r.ok)throw new Error((j&&(j.message||j.error))||("Error "+r.status));return j})})})}
function rest(m,p,b,rep){return call(m,"/rest/v1/"+p,b,rep?{Prefer:"return=representation"}:{Prefer:"return=minimal"})}
// ---------- photos
function shrink(file,max){return new Promise(function(res,rej){
  var url=URL.createObjectURL(file),im=new Image();
  im.onload=function(){var M=max||1280,w=im.naturalWidth,h=im.naturalHeight,k=Math.min(1,M/Math.max(w,h));w=Math.round(w*k);h=Math.round(h*k);
    var c=document.createElement("canvas");c.width=w;c.height=h;var x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,w,h);x.drawImage(im,0,0,w,h);
    c.toBlob(function(b){URL.revokeObjectURL(url);b?res(b):rej(new Error("Photo could not be read"))},"image/jpeg",0.82)};
  im.onerror=function(){URL.revokeObjectURL(url);rej(new Error("This file is not a photo: "+file.name))};im.src=url})}
function uid(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)}
function upload(blob,path){return fresh().then(function(tok){return fetch(API+"/storage/v1/object/"+BUCKET+"/"+path,{method:"POST",headers:{apikey:KEY,Authorization:"Bearer "+tok,"Content-Type":"image/jpeg","x-upsert":"false"},body:blob}).then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error("Photo upload failed ("+r.status+")")});return API+"/storage/v1/object/public/"+BUCKET+"/"+path})})}
function pathOf(url){var k="/object/public/"+BUCKET+"/",i=String(url).indexOf(k);return i<0?null:url.slice(i+k.length)}
function dropPhotos(urls){return Promise.all((urls||[]).map(function(u){var p=pathOf(u);if(!p)return null;return fresh().then(function(tok){return fetch(API+"/storage/v1/object/"+BUCKET+"/"+p,{method:"DELETE",headers:{apikey:KEY,Authorization:"Bearer "+tok}})}).catch(function(){})}))}
// ---------- screens
function showLogin(){
  APP.innerHTML='<div class="login box"><h2 style="margin:0 0 4px">Staff login</h2><p class="hint">Narendra Hero admin</p><form id="lf"><label>Email</label><input name="email" type="email" required autocomplete="username"><label>Password</label><input name="password" type="password" required autocomplete="current-password"><button class="btn btn-red" style="width:100%;margin-top:14px" type="submit">Login</button><div class="msg" id="lm"></div></form></div>';
  $("#lf").addEventListener("submit",function(e){e.preventDefault();var f=e.target,b=$("button",f);b.disabled=true;
    tokenCall("password",{email:f.email.value.trim(),password:f.password.value}).then(function(j){setSession(j);showMain()}).catch(function(er){var m=$("#lm");m.textContent=er.message;m.className="msg err";b.disabled=false})})}
var tab="bikes",tabs={};
function showMain(){
  APP.innerHTML='<div class="top"><div class="wrap"><b>Narendra Hero - Admin</b><span><span class="hint" id="who"></span> <a class="btn btn-line sm" href="index.html" target="_blank">View site</a> <button class="btn btn-line sm" id="lo" type="button">Logout</button></span></div></div><div class="wrap"><div class="vstat" id="vstat" hidden></div><div class="tabs" id="tabs"></div><div id="pane"></div></div>';
  $("#who").textContent=auth&&auth.email||"";$("#lo").addEventListener("click",logout);
  try{localStorage.setItem("nh_staff","1")}catch(e){}   // this device is staff: its visits are not counted on the website
  visitors();go(tab)}
// website visitors (counted by the home page, one per device per day, staff devices excluded)
function visitors(){
  var ist=function(back){return new Date(Date.now()+19800000-(back||0)*86400000).toISOString().slice(0,10)};
  Promise.all([rest("GET","site_stats?select=day,visits&order=day.desc&limit=400"),call("POST","/rest/v1/rpc/count_visit",{p_new:false})]).then(function(a){
    var rows=a[0]||[],total=Number(a[1]),t=ist(0),w=ist(6),today=0,week=0;
    rows.forEach(function(r){if(r.day===t)today+=r.visits;if(r.day>=w)week+=r.visits});
    var el=$("#vstat");if(!el)return;
    el.innerHTML='<div><b>'+today.toLocaleString("en-IN")+'</b><small>Visitors today</small></div><div><b>'+week.toLocaleString("en-IN")+'</b><small>Last 7 days</small></div><div><b>'+(isFinite(total)?total:0).toLocaleString("en-IN")+'</b><small>Total visitors</small></div>';el.hidden=false}).catch(function(){})}
function cnt(n){return n?" ("+n+" new)":""}
var LEADTABS=[{table:"enquiries",tab:"enq",name:"Enquiries",key:"newCount"},{table:"sell_requests",tab:"sell",name:"Sell Requests",key:"sellCount"}];
function counts(){LEADTABS.forEach(function(c){rest("GET",c.table+"?select=id&status=eq.new").then(function(r){tabs[c.key]=r.length;var b=$('[data-t="'+c.tab+'"]');if(b)b.textContent=c.name+cnt(r.length)}).catch(function(){})})}
function go(t){tab=t;
  var el=$("#tabs");el.innerHTML=[["bikes","New Bikes"],["used","Used Bikes"],["ban","Banners"],["sell","Sell Requests"+cnt(tabs.sellCount)],["enq","Enquiries"+cnt(tabs.newCount)]].map(function(x){return '<button type="button" class="chip'+(x[0]===t?' on':'')+'" data-t="'+x[0]+'">'+x[1]+'</button>'}).join("");
  el.onclick=function(e){var v=e.target.getAttribute("data-t");if(v)go(v)};
  var p=$("#pane");p.innerHTML='<p class="hint">Loading...</p>';
  (t==="bikes"?crud(p,BIKES):t==="used"?crud(p,USEDC):t==="ban"?banners(p):t==="sell"?leads(p,SELLC):leads(p,ENQC)).catch(function(e){p.innerHTML='<p class="msg err" style="display:block">'+esc(e.message)+'</p>'});
  counts()}
// ---------- generic list + form
var BIKES={table:"bikes",order:"sort.asc,name.asc",label:"bike",add:"+ Add new bike",titleKey:"name",
 fields:[{k:"name",l:"Bike name *",req:1,ph:"Splendor+ i3s"},{k:"type",l:"Type",t:"select",o:["Motorcycle","Scooter"]},{k:"cc",l:"Engine (cc)",t:"number"},{k:"price",l:"Ex-showroom price",ph:"Rs 76,000"},{k:"mileage",l:"Mileage",ph:"65 kmpl"},{k:"colours",l:"Colours",ph:"Black, Red, Blue"},{k:"note",l:"One line about the bike",full:1},{k:"description",l:"Details (optional)",t:"textarea",full:1},{k:"sort",l:"Order number (small = first)",t:"number",d:100},{k:"active",l:"Show on website",t:"check",d:true}],
 sub:function(r){return [r.type,r.cc?r.cc+" cc":"",r.price||"no price"].filter(Boolean).join(" | ")},
 flag:function(r){return r.active?"":'<span class="chipx off">Hidden</span>'},
 toggle:function(r){return r.active?{l:"Hide",p:{active:false}}:{l:"Show",p:{active:true}}}};
var price0=function(r){return r.sale_price!=null&&r.sale_price!==""?"Rs "+Number(r.sale_price).toLocaleString("en-IN"):(r.price||"")};
var USEDC={table:"used_bikes",order:"created_at.desc",label:"used bike",add:"+ Add used bike",titleKey:"title",minPhotos:1,maxPhotos:4,
 fields:[{k:"make",l:"Make *",req:1,ph:"Hero, Bajaj, Honda...",list:"Make"},{k:"model",l:"Model *",req:1,ph:"Splendor, Platina...",list:"Model"},{k:"year",l:"Year",t:"number",ph:"2020"},{k:"km",l:"Run (km)",t:"number",ph:"25000"},{k:"warranty",l:"Warranty",ph:"6 months / No warranty",list:"Warranty"},{k:"sale_price",l:"Sale price (Rs) *",t:"number",req:1,ph:"38000",pre:function(r){var d=String(r.price||"").replace(/[^0-9]/g,"");return d?Number(d):""}},{k:"owner",l:"Owner",t:"select",o:["","1st owner","2nd owner","3rd owner","4th+ owner"]},{k:"colour",l:"Colour"},{k:"description",l:"Other details (optional)",t:"textarea",full:1},{k:"status",l:"Status",t:"select",o:["available","sold","hidden"],d:"available"}],
 beforeSave:function(d){d.title=[d.make,d.model,d.year].filter(Boolean).join(" ");d.price=d.sale_price!=null&&d.sale_price!==""?"Rs "+Number(d.sale_price).toLocaleString("en-IN"):""},
 sub:function(r){return [r.year,r.km!=null?Number(r.km).toLocaleString("en-IN")+" km":"",r.warranty?"Warranty "+r.warranty:"",price0(r)||"no price"].filter(Boolean).join(" | ")},
 flag:function(r){return r.status==="available"?"":'<span class="chipx off">'+esc(r.status)+'</span>'},
 toggle:function(r){return r.status==="available"?{l:"Mark sold",p:{status:"sold"}}:{l:"Make available",p:{status:"available"}}}};
function crud(pane,C){
  return rest("GET",C.table+"?select=*&order="+C.order).then(function(rows){
    pane.innerHTML='<p><button class="btn btn-red" id="add" type="button">'+C.add+'</button></p><div id="list"></div>';
    var L=$("#list",pane);
    L.innerHTML=rows.length?rows.map(function(r,i){var t=toggle(r);return '<div class="row"><div class="th">'+(r.images&&r.images[0]?'<img class="th" src="'+esc(r.images[0])+'" alt="">':'No photo')+'</div><div class="info"><b>'+esc(r[C.titleKey])+C.flag(r)+'</b><small>'+esc(C.sub(r))+' | '+(r.images||[]).length+' photo(s)</small></div><div class="acts"><button class="btn btn-line sm" data-a="edit" data-i="'+i+'" type="button">Edit</button><button class="btn btn-line sm" data-a="tog" data-i="'+i+'" type="button">'+t.l+'</button><button class="btn btn-line sm" data-a="del" data-i="'+i+'" type="button">Delete</button></div></div>'}).join(""):'<p class="hint">Nothing here yet. Press the button above to add.</p>';
    function toggle(r){return C.toggle(r)}
    $("#add",pane).onclick=function(){form(C,null,function(){go(tab)})};
    L.onclick=function(e){var a=e.target.getAttribute("data-a");if(!a)return;var r=rows[+e.target.getAttribute("data-i")];
      if(a==="edit")form(C,r,function(){go(tab)});
      if(a==="tog")rest("PATCH",C.table+"?id=eq."+r.id,C.toggle(r).p).then(function(){toast("Updated");go(tab)}).catch(function(er){toast(er.message,1)});
      if(a==="del"){if(!confirm("Delete \""+r[C.titleKey]+"\" and its photos? This cannot be undone."))return;
        rest("DELETE",C.table+"?id=eq."+r.id).then(function(){return dropPhotos(r.images)}).then(function(){toast("Deleted");go(tab)}).catch(function(er){toast(er.message,1)})}}})}
function form(C,row,done){
  var imgs=(row&&row.images||[]).slice(),files=[];
  var ov=document.createElement("div");ov.className="modal";
  var MINP=C.minPhotos||0,MAXP=C.maxPhotos||0;
  function fld(f){var v=row?row[f.k]:f.d;if((v==null||v==="")&&row&&f.pre)v=f.pre(row);if(v==null)v="";var id="f_"+f.k,w=f.full?' style="grid-column:1/-1"':"";
    if(f.t==="check")return '<div class="fld"'+w+'><label><input type="checkbox" id="'+id+'" '+(v?"checked":"")+' style="width:auto"> '+f.l+'</label></div>';
    var inp=f.t==="select"?'<select id="'+id+'">'+f.o.map(function(o){return '<option value="'+esc(o)+'"'+(o===v?" selected":"")+'>'+esc(o||"-")+'</option>'}).join("")+'</select>':f.t==="textarea"?'<textarea id="'+id+'" rows="3">'+esc(v)+'</textarea>':'<input id="'+id+'" type="'+(f.t==="number"?"number":"text")+'"'+(f.t==="number"?' inputmode="numeric" min="0"':'')+(f.list?' list="dl'+f.list+'" autocomplete="off"':'')+' value="'+esc(v)+'" placeholder="'+esc(f.ph||"")+'">';
    return '<div class="fld"'+w+'><label>'+f.l+'</label>'+inp+'</div>'}
  ov.innerHTML='<div class="mbox"><button class="mclose" type="button" id="x">&times;</button><h3 style="margin-top:0">'+(row?"Edit ":"Add ")+C.label+'</h3><div class="grid2">'+C.fields.map(fld).join("")+'</div><label>Photos '+(MAXP?'('+(MINP||0)+' to '+MAXP+') ':'')+'- first photo is the main one <span class="hint" id="pc"></span></label><div class="photos" id="ph"></div><input type="file" id="fi" accept="image/*" multiple><datalist id="dlMake"></datalist><datalist id="dlModel"></datalist><datalist id="dlWarranty"></datalist><p class="hint">Phone se seedha photo le sakte ho. Photo apne aap chhoti ho jati hai.</p><div class="mbtns"><button class="btn btn-red" id="sv" type="button">Save</button><button class="btn btn-line" id="cn" type="button">Cancel</button></div><div class="msg" id="fm"></div></div>';
  document.body.appendChild(ov);
  function close(){ov.remove()}
  function msg(t,ok){var m=$("#fm",ov);m.textContent=t;m.className="msg "+(ok?"ok":"err")}
  function paint(){var h="";imgs.forEach(function(u,i){h+='<div class="ph"><img src="'+esc(u)+'" alt=""><button class="btn btn-line" type="button" data-x="e'+i+'">Remove</button>'+(i?'<button class="btn btn-line" type="button" data-x="m'+i+'">Make main</button>':'')+'</div>'});
    files.forEach(function(f,i){h+='<div class="ph"><img src="'+esc(f.prev)+'" alt=""><button class="btn btn-line" type="button" data-x="n'+i+'">Remove</button></div>'});$("#ph",ov).innerHTML=h;
    var n=imgs.length+files.length;$("#pc",ov).textContent=MAXP?"["+n+" of "+MAXP+"]":"";$("#fi",ov).style.display=MAXP&&n>=MAXP?"none":""}
  var L=window.USED_LISTS||{makes:[],models:{},warranty:[]};
  function opts(a){return (a||[]).map(function(x){return '<option value="'+esc(x)+'">'}).join("")}
  function models(){var m=$("#f_make",ov);if(!m)return;var v=m.value.trim().toLowerCase(),a=[];Object.keys(L.models||{}).forEach(function(k){if(k.toLowerCase()===v)a=L.models[k]});$("#dlModel",ov).innerHTML=opts(a)}
  $("#dlMake",ov).innerHTML=opts(L.makes);$("#dlWarranty",ov).innerHTML=opts(L.warranty);
  if($("#f_make",ov)){$("#f_make",ov).addEventListener("input",models);models()}
  paint();
  $("#ph",ov).onclick=function(e){var x=e.target.getAttribute("data-x");if(!x)return;var i=+x.slice(1);
    if(x[0]==="e")imgs.splice(i,1);if(x[0]==="m"){var u=imgs.splice(i,1)[0];imgs.unshift(u)}if(x[0]==="n"){URL.revokeObjectURL(files[i].prev);files.splice(i,1)}paint()};
  $("#fi",ov).onchange=function(e){var full=false;[].forEach.call(e.target.files,function(f){if(MAXP&&imgs.length+files.length>=MAXP){full=true;return}files.push({file:f,prev:URL.createObjectURL(f)})});e.target.value="";paint();if(full)msg("You can add only "+MAXP+" photos. Remove one to add another.")};
  $("#x",ov).onclick=close;$("#cn",ov).onclick=close;
  $("#sv",ov).onclick=function(){
    var data={};
    for(var k=0;k<C.fields.length;k++){var f=C.fields[k],el=$("#f_"+f.k,ov),v;
      if(f.t==="check")v=el.checked;else if(f.t==="number")v=el.value===""?null:Number(el.value);else v=el.value.trim();
      if(f.req&&!v){msg("Please fill: "+f.l.replace(" *",""));return}
      if(f.t==="number"&&(f.k==="sort"||f.k==="cc"||f.k==="year"||f.k==="km")&&v===null&&f.k==="sort")v=100;
      data[f.k]=v}
    if(C.beforeSave)C.beforeSave(data);
    var nph=imgs.length+files.length;
    if(MINP&&nph<MINP){msg("Please add at least "+MINP+" photo of the bike.");return}
    if(MAXP&&nph>MAXP){msg("Only "+MAXP+" photos are allowed. Remove some.");return}
    var b=$("#sv",ov);b.disabled=true;var removed=row?(row.images||[]).filter(function(u){return imgs.indexOf(u)<0}):[];
    var folder=C.table+"/"+uid(),up=[];
    msg("Saving...",1);
    var chain=Promise.resolve();
    files.forEach(function(f,i){chain=chain.then(function(){msg("Uploading photo "+(i+1)+" of "+files.length+"...",1);return shrink(f.file)}).then(function(bl){return upload(bl,folder+"/"+Date.now()+"-"+i+".jpg")}).then(function(u){up.push(u)})});
    chain.then(function(){data.images=imgs.concat(up);return row?rest("PATCH",C.table+"?id=eq."+row.id,data):rest("POST",C.table,data)})
      .then(function(){return dropPhotos(removed)}).then(function(){toast("Saved");close();done()})
      .catch(function(er){msg(er.message,0);b.disabled=false})}}
// ---------- banner photos for the top of the home page
var BANMAX=6;
function banners(pane){
  return rest("GET","banners?select=*&order=sort.asc,id.asc").then(function(rows){
    pane.innerHTML='<div class="box"><h3 style="margin:0 0 4px">Home page banner photos</h3><p class="hint">These photos slide automatically behind the top of the home page. Best: 3 or 4 wide (landscape) photos of the showroom or bikes. Up to '+BANMAX+' photos. First photo shows first.</p><input type="file" id="bf" accept="image/*" multiple><div class="msg" id="bm"></div></div><div class="bgrid" id="bl"></div>';
    function msg(t,ok){var m=$("#bm");m.textContent=t;m.className="msg "+(ok?"ok":"err")}
    $("#bl").innerHTML=rows.length?rows.map(function(r,i){return '<div class="bc'+(r.active?'':' hid')+'"><img src="'+esc(r.image_url)+'" alt=""><div class="b"><b>Photo '+(i+1)+(r.active?'':' (hidden)')+'</b>'+(i?'<button class="btn btn-line sm" type="button" data-a="up" data-i="'+i+'">Move up</button>':'')+(i<rows.length-1?'<button class="btn btn-line sm" type="button" data-a="dn" data-i="'+i+'">Move down</button>':'')+'<button class="btn btn-line sm" type="button" data-a="hide" data-i="'+i+'">'+(r.active?'Hide':'Show')+'</button><button class="btn btn-line sm" type="button" data-a="del" data-i="'+i+'">Delete</button></div></div>'}).join(""):'<p class="hint">No banner photo yet. The home page shows the plain top section until you add photos.</p>';
    $("#bf").onchange=function(e){
      var files=[].slice.call(e.target.files);e.target.value="";if(!files.length)return;
      if(rows.length+files.length>BANMAX){return msg("Only "+BANMAX+" banner photos are allowed. You have "+rows.length+". Delete some first.")}
      var top=rows.reduce(function(m,r){return Math.max(m,r.sort||0)},0),chain=Promise.resolve(),done=0;
      files.forEach(function(f,i){chain=chain.then(function(){msg("Uploading photo "+(i+1)+" of "+files.length+"...",1);return shrink(f,1600)}).then(function(o){return upload(o.blob,"banners/"+uid()+".jpg")}).then(function(u){return rest("POST","banners",{image_url:u,sort:top+10*(i+1)})}).then(function(){done++})});
      chain.then(function(){toast(done+" photo(s) added");go("ban")}).catch(function(er){msg((done?done+" added. ":"")+er.message);if(done)setTimeout(function(){go("ban")},2500)})};
    $("#bl").onclick=function(e){var a=e.target.getAttribute("data-a");if(!a)return;var i=+e.target.getAttribute("data-i"),r=rows[i],job;
      if(a==="hide")job=rest("PATCH","banners?id=eq."+r.id,{active:!r.active});
      else if(a==="del"){if(!confirm("Delete this banner photo?"))return;job=rest("DELETE","banners?id=eq."+r.id).then(function(){return dropPhotos([r.image_url])})}
      else{var j=a==="up"?i-1:i+1,o=rows.slice();o[i]=rows[j];o[j]=rows[i];
        job=o.reduce(function(p,x,k){var s=(k+1)*10;return x.sort===s?p:p.then(function(){return rest("PATCH","banners?id=eq."+x.id,{sort:s})})},Promise.resolve())}
      job.then(function(){toast("Done");go("ban")}).catch(function(er){toast(er.message,1)})}})}
// ---------- leads: enquiries and customers who want to sell their bike
var ENQC={table:"enquiries",tab:"enq",name:"Enquiries",key:"newCount",none:"No enquiries here.",what:"enquiry",
 info:function(r){return [r.model||"-",r.want||"-",r.place||"-"]}};
var SELLC={table:"sell_requests",tab:"sell",name:"Sell Requests",key:"sellCount",none:"No sell request here.",what:"request",
 info:function(r){return [[r.make,r.model,r.year].filter(Boolean).join(" ")||"-",r.km!=null?Number(r.km).toLocaleString("en-IN")+" km":"-",r.expected_price?"Expects Rs "+Number(r.expected_price).toLocaleString("en-IN"):"-",r.place||"-"]}};
function leads(pane,C){var flt="all";
  return rest("GET",C.table+"?select=*&order=created_at.desc&limit=300").then(function(rows){
    tabs[C.key]=rows.filter(function(r){return r.status==="new"}).length;var tb=$('[data-t="'+C.tab+'"]');if(tb)tb.textContent=C.name+cnt(tabs[C.key]);
    function draw(){
      var ch=["all","new","called","closed"].map(function(x){return '<button type="button" class="chip'+(x===flt?' on':'')+'" data-f="'+x+'">'+x[0].toUpperCase()+x.slice(1)+'</button>'}).join("");
      var list=rows.filter(function(r){return flt==="all"||r.status===flt});
      pane.innerHTML='<div class="filters">'+ch+'</div>'+(list.length?list.map(function(r){var i=rows.indexOf(r);
        return '<div class="row" style="align-items:flex-start"><div class="info"><b>'+esc(r.name)+' <span class="chipx'+(r.status==="new"?" off":"")+'">'+esc(r.status)+'</span></b><small>'+new Date(r.created_at).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})+' | '+C.info(r).map(esc).join(' | ')+'</small><input class="note" data-n="'+i+'" placeholder="Note (e.g. will visit Sunday)" value="'+esc(r.note)+'"></div><div class="acts"><a class="btn btn-red sm" href="tel:+91'+esc(r.mobile)+'">Call '+esc(r.mobile)+'</a><a class="btn btn-line sm" target="_blank" rel="noopener" href="https://wa.me/91'+esc(r.mobile)+'">WhatsApp</a>'+['new','called','closed'].filter(function(s){return s!==r.status}).map(function(s){return '<button class="btn btn-line sm" type="button" data-s="'+s+'" data-i="'+i+'">Mark '+s+'</button>'}).join("")+'<button class="btn btn-line sm" type="button" data-d="'+i+'">Delete</button></div></div>'}).join(""):'<p class="hint">'+C.none+'</p>');
      pane.onclick=function(e){var t=e.target,f=t.getAttribute("data-f");if(f){flt=f;return draw()}
        var s=t.getAttribute("data-s");if(s){var r=rows[+t.getAttribute("data-i")];return rest("PATCH",C.table+"?id=eq."+r.id,{status:s}).then(function(){r.status=s;toast("Updated");go(C.tab)}).catch(function(er){toast(er.message,1)})}
        var d=t.getAttribute("data-d");if(d!==null&&d!==undefined){var q=rows[+d];if(!confirm("Delete "+C.what+" of "+q.name+"?"))return;rest("DELETE",C.table+"?id=eq."+q.id).then(function(){toast("Deleted");go(C.tab)}).catch(function(er){toast(er.message,1)})}};
      pane.onchange=function(e){var n=e.target.getAttribute("data-n");if(n===null||n===undefined)return;var r=rows[+n];rest("PATCH",C.table+"?id=eq."+r.id,{note:e.target.value.trim()}).then(function(){r.note=e.target.value.trim();toast("Note saved")}).catch(function(er){toast(er.message,1)})}}
    draw()})}
if(auth)showMain();else showLogin();
})();
