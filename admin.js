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
function shrink(file){return new Promise(function(res,rej){
  var url=URL.createObjectURL(file),im=new Image();
  im.onload=function(){var M=1280,w=im.naturalWidth,h=im.naturalHeight,k=Math.min(1,M/Math.max(w,h));w=Math.round(w*k);h=Math.round(h*k);
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
  APP.innerHTML='<div class="top"><div class="wrap"><b>Narendra Hero - Admin</b><span><span class="hint" id="who"></span> <a class="btn btn-line sm" href="index.html" target="_blank">View site</a> <button class="btn btn-line sm" id="lo" type="button">Logout</button></span></div></div><div class="wrap"><div class="tabs" id="tabs"></div><div id="pane"></div></div>';
  $("#who").textContent=auth&&auth.email||"";$("#lo").addEventListener("click",logout);
  go(tab)}
function go(t){tab=t;
  var el=$("#tabs");el.innerHTML=[["bikes","New Bikes"],["used","Used Bikes"],["enq","Enquiries"+(tabs.newCount?" ("+tabs.newCount+" new)":"")]].map(function(x){return '<button type="button" class="chip'+(x[0]===t?' on':'')+'" data-t="'+x[0]+'">'+x[1]+'</button>'}).join("");
  el.onclick=function(e){var v=e.target.getAttribute("data-t");if(v)go(v)};
  var p=$("#pane");p.innerHTML='<p class="hint">Loading...</p>';
  (t==="bikes"?crud(p,BIKES):t==="used"?crud(p,USEDC):enquiries(p)).catch(function(e){p.innerHTML='<p class="msg err" style="display:block">'+esc(e.message)+'</p>'});
  if(t!=="enq")rest("GET","enquiries?select=id&status=eq.new").then(function(r){tabs.newCount=r.length;var b=$('[data-t="enq"]');if(b)b.textContent="Enquiries"+(r.length?" ("+r.length+" new)":"")}).catch(function(){})}
// ---------- generic list + form
var BIKES={table:"bikes",order:"sort.asc,name.asc",label:"bike",add:"+ Add new bike",titleKey:"name",
 fields:[{k:"name",l:"Bike name *",req:1,ph:"Splendor+ i3s"},{k:"type",l:"Type",t:"select",o:["Motorcycle","Scooter"]},{k:"cc",l:"Engine (cc)",t:"number"},{k:"price",l:"Ex-showroom price",ph:"Rs 76,000"},{k:"mileage",l:"Mileage",ph:"65 kmpl"},{k:"colours",l:"Colours",ph:"Black, Red, Blue"},{k:"note",l:"One line about the bike",full:1},{k:"description",l:"Details (optional)",t:"textarea",full:1},{k:"sort",l:"Order number (small = first)",t:"number",d:100},{k:"active",l:"Show on website",t:"check",d:true}],
 sub:function(r){return [r.type,r.cc?r.cc+" cc":"",r.price||"no price"].filter(Boolean).join(" | ")},
 flag:function(r){return r.active?"":'<span class="chipx off">Hidden</span>'},
 toggle:function(r){return r.active?{l:"Hide",p:{active:false}}:{l:"Show",p:{active:true}}}};
var USEDC={table:"used_bikes",order:"created_at.desc",label:"used bike",add:"+ Add used bike",titleKey:"title",
 fields:[{k:"title",l:"Bike and model *",req:1,ph:"Splendor+ 2021"},{k:"year",l:"Year",t:"number"},{k:"km",l:"Kilometres driven",t:"number"},{k:"owner",l:"Owner",t:"select",o:["1st owner","2nd owner","3rd owner","4th+ owner"]},{k:"colour",l:"Colour"},{k:"price",l:"Offer price",ph:"Rs 38,000"},{k:"description",l:"Condition / details",t:"textarea",full:1},{k:"status",l:"Status",t:"select",o:["available","sold","hidden"],d:"available"}],
 sub:function(r){return [r.year,r.km!=null?r.km+" km":"",r.price||"no price"].filter(Boolean).join(" | ")},
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
  function fld(f){var v=row?row[f.k]:f.d;if(v==null)v="";var id="f_"+f.k,w=f.full?' style="grid-column:1/-1"':"";
    if(f.t==="check")return '<div class="fld"'+w+'><label><input type="checkbox" id="'+id+'" '+(v?"checked":"")+' style="width:auto"> '+f.l+'</label></div>';
    var inp=f.t==="select"?'<select id="'+id+'">'+f.o.map(function(o){return '<option'+(o===v?" selected":"")+'>'+esc(o)+'</option>'}).join("")+'</select>':f.t==="textarea"?'<textarea id="'+id+'" rows="3">'+esc(v)+'</textarea>':'<input id="'+id+'" type="'+(f.t==="number"?"number":"text")+'" value="'+esc(v)+'" placeholder="'+esc(f.ph||"")+'">';
    return '<div class="fld"'+w+'><label>'+f.l+'</label>'+inp+'</div>'}
  ov.innerHTML='<div class="mbox"><button class="mclose" type="button" id="x">&times;</button><h3 style="margin-top:0">'+(row?"Edit ":"Add ")+C.label+'</h3><div class="grid2">'+C.fields.map(fld).join("")+'</div><label>Photos (first photo is the main one)</label><div class="photos" id="ph"></div><input type="file" id="fi" accept="image/*" multiple><p class="hint">Phone se seedha photo le sakte ho. Photo apne aap chhoti ho jati hai.</p><div class="mbtns"><button class="btn btn-red" id="sv" type="button">Save</button><button class="btn btn-line" id="cn" type="button">Cancel</button></div><div class="msg" id="fm"></div></div>';
  document.body.appendChild(ov);
  function close(){ov.remove()}
  function msg(t,ok){var m=$("#fm",ov);m.textContent=t;m.className="msg "+(ok?"ok":"err")}
  function paint(){var h="";imgs.forEach(function(u,i){h+='<div class="ph"><img src="'+esc(u)+'" alt=""><button class="btn btn-line" type="button" data-x="e'+i+'">Remove</button>'+(i?'<button class="btn btn-line" type="button" data-x="m'+i+'">Make main</button>':'')+'</div>'});
    files.forEach(function(f,i){h+='<div class="ph"><img src="'+esc(f.prev)+'" alt=""><button class="btn btn-line" type="button" data-x="n'+i+'">Remove</button></div>'});$("#ph",ov).innerHTML=h}
  paint();
  $("#ph",ov).onclick=function(e){var x=e.target.getAttribute("data-x");if(!x)return;var i=+x.slice(1);
    if(x[0]==="e")imgs.splice(i,1);if(x[0]==="m"){var u=imgs.splice(i,1)[0];imgs.unshift(u)}if(x[0]==="n"){URL.revokeObjectURL(files[i].prev);files.splice(i,1)}paint()};
  $("#fi",ov).onchange=function(e){[].forEach.call(e.target.files,function(f){files.push({file:f,prev:URL.createObjectURL(f)})});e.target.value="";paint()};
  $("#x",ov).onclick=close;$("#cn",ov).onclick=close;
  $("#sv",ov).onclick=function(){
    var data={};
    for(var k=0;k<C.fields.length;k++){var f=C.fields[k],el=$("#f_"+f.k,ov),v;
      if(f.t==="check")v=el.checked;else if(f.t==="number")v=el.value===""?null:Number(el.value);else v=el.value.trim();
      if(f.req&&!v){msg("Please fill: "+f.l.replace(" *",""));return}
      if(f.t==="number"&&(f.k==="sort"||f.k==="cc"||f.k==="year"||f.k==="km")&&v===null&&f.k==="sort")v=100;
      data[f.k]=v}
    var b=$("#sv",ov);b.disabled=true;var removed=row?(row.images||[]).filter(function(u){return imgs.indexOf(u)<0}):[];
    var folder=C.table+"/"+uid(),up=[];
    msg("Saving...",1);
    var chain=Promise.resolve();
    files.forEach(function(f,i){chain=chain.then(function(){msg("Uploading photo "+(i+1)+" of "+files.length+"...",1);return shrink(f.file)}).then(function(bl){return upload(bl,folder+"/"+Date.now()+"-"+i+".jpg")}).then(function(u){up.push(u)})});
    chain.then(function(){data.images=imgs.concat(up);return row?rest("PATCH",C.table+"?id=eq."+row.id,data):rest("POST",C.table,data)})
      .then(function(){return dropPhotos(removed)}).then(function(){toast("Saved");close();done()})
      .catch(function(er){msg(er.message,0);b.disabled=false})}}
// ---------- enquiries
function enquiries(pane){var flt="all";
  return rest("GET","enquiries?select=*&order=created_at.desc&limit=300").then(function(rows){
    tabs.newCount=rows.filter(function(r){return r.status==="new"}).length;var tb=$('[data-t="enq"]');if(tb)tb.textContent="Enquiries"+(tabs.newCount?" ("+tabs.newCount+" new)":"");
    function draw(){
      var ch=["all","new","called","closed"].map(function(x){return '<button type="button" class="chip'+(x===flt?' on':'')+'" data-f="'+x+'">'+x[0].toUpperCase()+x.slice(1)+'</button>'}).join("");
      var list=rows.filter(function(r){return flt==="all"||r.status===flt});
      pane.innerHTML='<div class="filters">'+ch+'</div>'+(list.length?list.map(function(r){var i=rows.indexOf(r);
        return '<div class="row" style="align-items:flex-start"><div class="info"><b>'+esc(r.name)+' <span class="chipx'+(r.status==="new"?" off":"")+'">'+esc(r.status)+'</span></b><small>'+new Date(r.created_at).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})+' | '+esc(r.model||"-")+' | '+esc(r.want||"-")+' | '+esc(r.place||"-")+'</small><input class="note" data-n="'+i+'" placeholder="Note (e.g. will visit Sunday)" value="'+esc(r.note)+'"></div><div class="acts"><a class="btn btn-red sm" href="tel:+91'+esc(r.mobile)+'">Call '+esc(r.mobile)+'</a><a class="btn btn-line sm" target="_blank" rel="noopener" href="https://wa.me/91'+esc(r.mobile)+'">WhatsApp</a>'+['new','called','closed'].filter(function(s){return s!==r.status}).map(function(s){return '<button class="btn btn-line sm" type="button" data-s="'+s+'" data-i="'+i+'">Mark '+s+'</button>'}).join("")+'<button class="btn btn-line sm" type="button" data-d="'+i+'">Delete</button></div></div>'}).join(""):'<p class="hint">No enquiries here.</p>');
      pane.onclick=function(e){var t=e.target,f=t.getAttribute("data-f");if(f){flt=f;return draw()}
        var s=t.getAttribute("data-s");if(s){var r=rows[+t.getAttribute("data-i")];return rest("PATCH","enquiries?id=eq."+r.id,{status:s}).then(function(){r.status=s;toast("Updated");go("enq")}).catch(function(er){toast(er.message,1)})}
        var d=t.getAttribute("data-d");if(d!==null&&d!==undefined){var q=rows[+d];if(!confirm("Delete enquiry of "+q.name+"?"))return;rest("DELETE","enquiries?id=eq."+q.id).then(function(){toast("Deleted");go("enq")}).catch(function(er){toast(er.message,1)})}};
      pane.onchange=function(e){var n=e.target.getAttribute("data-n");if(n===null||n===undefined)return;var r=rows[+n];rest("PATCH","enquiries?id=eq."+r.id,{note:e.target.value.trim()}).then(function(){r.note=e.target.value.trim();toast("Note saved")}).catch(function(er){toast(er.message,1)})}}
    draw()})}
if(auth)showMain();else showLogin();
})();
