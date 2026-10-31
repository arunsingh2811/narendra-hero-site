/* Hindi / English switch. English text in the page is the key; the Hindi text is looked up here.
   To change a Hindi word, edit the right-hand side below. */
(function(){
var HI={
"Bikes":"बाइक्स","Used Bikes":"पुरानी बाइक्स","Sell Your Bike":"अपनी बाइक बेचें","Enquiry":"पूछताछ","Contact":"संपर्क",
"Get Best Price":"बेस्ट प्राइस पाएं","Call":"कॉल करें","WhatsApp":"व्हाट्सऐप","See Bikes":"बाइक्स देखें","Book Test Ride":"टेस्ट राइड बुक करें",
"Our Bikes and Scooters":"हमारी बाइक्स और स्कूटर",
"Tap \"Get Onroad Price\" on any model. We will call you back.":"किसी भी मॉडल पर \"ऑनरोड प्राइस पाएं\" दबाएं। हम आपको वापस कॉल करेंगे।",
"Used Bikes ":"पुरानी बाइक्स",
"Checked second-hand bikes with sale price.":"जांची-परखी पुरानी बाइक्स, बिक्री मूल्य के साथ।",
"Checked second-hand bikes with sale price. Tap a photo to see more.":"जांची-परखी पुरानी बाइक्स, बिक्री मूल्य के साथ। और देखने के लिए फोटो दबाएं।",
"No used bike listed right now. Call or WhatsApp us to know what is coming.":"अभी कोई पुरानी बाइक सूची में नहीं है। कौन सी आने वाली है, जानने के लिए हमें कॉल या व्हाट्सऐप करें।",
"Ask about used bikes on WhatsApp":"पुरानी बाइक्स के बारे में व्हाट्सऐप पर पूछें",
"Want to sell your old bike? Share a few details and our team will call you.":"अपनी पुरानी बाइक बेचना चाहते हैं? कुछ जानकारी भेजें, हमारी टीम आपको कॉल करेगी।",
"Your name *":"आपका नाम *","Mobile number *":"मोबाइल नंबर *","Bike make *":"बाइक कंपनी *","Model *":"मॉडल *","Year":"वर्ष","Run (km)":"चली हुई दूरी (किमी)",
"Price you expect (Rs)":"आपकी अपेक्षित कीमत (रु)","Village / City":"गांव / शहर","Send Details":"जानकारी भेजें",
"10 digit number":"10 अंकों का नंबर","Hero, Bajaj...":"हीरो, बजाज...","Splendor, Platina...":"स्प्लेंडर, प्लेटिना...","Optional":"जरूरी नहीं",
"Get Best Price / Book Test Ride":"बेस्ट प्राइस पाएं / टेस्ट राइड बुक करें","Fill 2 details. Our team will call you.":"सिर्फ 2 जानकारी भरें। हमारी टीम आपको कॉल करेगी।",
"Send Enquiry":"पूछताछ भेजें","Visit Us":"हमसे मिलें","Phone:":"फोन:","Email:":"ईमेल:","Get Directions":"रास्ता देखें",
"Prices and offers may change. Please confirm at the showroom.":"कीमतें और ऑफर बदल सकते हैं। कृपया शोरूम पर पुष्टि कर लें।",
"Call Now":"अभी कॉल करें","Get Onroad Price":"ऑनरोड प्राइस पाएं","Your name":"आपका नाम","Mobile number (10 digits)":"मोबाइल नंबर (10 अंक)","SAVE":"सेव करें","SAVING...":"सेव हो रहा है...",
"Sending...":"भेज रहे हैं...",
"All":"सभी","Photo coming soon":"फोटो जल्द आएगी","photos":"फोटो","No bike in this category.":"इस श्रेणी में कोई बाइक नहीं है।",
"GET ONROAD PRICE":"ऑनरोड प्राइस पाएं","Ex-Showroom Price":"एक्स-शोरूम कीमत","Offer Price*":"ऑफर कीमत*","Call for price":"कीमत के लिए कॉल करें",
"Valid Till":"मान्य तारीख","USED":"पुरानी","Sale Price":"बिक्री मूल्य","Model Year":"मॉडल वर्ष","km Driven":"किमी चली","Warranty:":"वारंटी:","Colour:":"रंग:","Colours:":"रंग:",
"ENQUIRE ON WHATSAPP":"व्हाट्सऐप पर पूछें","Engine Displacement":"इंजन क्षमता","Mileage":"माइलेज",
"Offer price":"ऑफर कीमत","Ex-showroom":"एक्स-शोरूम","Sale price":"बिक्री मूल्य","Enquiry for:":"पूछताछ इस बाइक के लिए:",
"Website visitors:":"वेबसाइट पर आए लोग:",
"Please enter your name.":"कृपया अपना नाम लिखें।","Please enter a valid 10 digit mobile number.":"कृपया सही 10 अंकों का मोबाइल नंबर लिखें।",
"Please enter the bike make, for example Hero or Bajaj.":"कृपया बाइक कंपनी लिखें, जैसे हीरो या बजाज।",
"Please enter the bike model, for example Splendor or Platina.":"कृपया बाइक का मॉडल लिखें, जैसे स्प्लेंडर या प्लेटिना।",
"Please enter the year in 4 digits, for example 2019.":"कृपया वर्ष 4 अंकों में लिखें, जैसे 2019।",
"Please enter the run in numbers only, for example 25000.":"कृपया चली दूरी सिर्फ अंकों में लिखें, जैसे 25000।",
"Please enter the price in numbers only, for example 40000.":"कृपया कीमत सिर्फ अंकों में लिखें, जैसे 40000।",
"Opening WhatsApp. Please press Send there.":"व्हाट्सऐप खुल रहा है। कृपया वहां Send दबाएं।",
"Thank you! Our team will call you with the onroad price soon.":"धन्यवाद! हमारी टीम जल्द ही आपको ऑनरोड प्राइस के लिए कॉल करेगी।",
"Thank you! Our team will call you soon.":"धन्यवाद! हमारी टीम जल्द ही आपको कॉल करेगी।",
"Show photo":"फोटो देखें"
};
var lang="en";try{lang=localStorage.getItem("nh_lang")==="hi"?"hi":"en"}catch(e){}
function T(s){return lang==="hi"&&HI[s]?HI[s]:s}
window.T=T;window.NH_LANG=function(){return lang};
// static text: elements marked data-i (text) or data-ip (placeholder); the English text is remembered in the page
function apply(){
  document.documentElement.lang=lang==="hi"?"hi":"en";
  [].forEach.call(document.querySelectorAll("[data-i]"),function(e){if(e.dataset.en===undefined)e.dataset.en=e.textContent.trim();e.textContent=T(e.dataset.en)});
  [].forEach.call(document.querySelectorAll("[data-ip]"),function(e){if(e.dataset.en===undefined)e.dataset.en=e.getAttribute("placeholder")||"";e.setAttribute("placeholder",T(e.dataset.en))});
  var b=document.getElementById("lang");if(b){b.setAttribute("data-l",lang);b.setAttribute("aria-label",lang==="hi"?"Switch to English":"हिन्दी में देखें")}
}
window.NH_APPLY=apply;
function set(l){lang=l;try{localStorage.setItem("nh_lang",l)}catch(e){}apply();if(window.NH_REDRAW)window.NH_REDRAW()}
document.addEventListener("DOMContentLoaded",function(){var b=document.getElementById("lang");if(b)b.addEventListener("click",function(){set(lang==="hi"?"en":"hi")});apply()});
})();
