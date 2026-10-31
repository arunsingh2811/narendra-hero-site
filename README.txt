Narendra Hero site. Plain HTML, no build. Staff admin at /admin (login). Showroom details: config.js. Photos/prices: edit from /admin.
Used bikes: admin > Used Bikes (make, model, year, run, warranty, sale price, 1 to 4 photos). Customers who want to sell their bike use "Sell Your Bike" on the site; you see them in admin > Sell Requests.
Cloudflare Pages: build command empty, output directory "/".
Staff shortcut: tap the Hero logo in the footer 5 times (each tap within 1.5 sec) -> opens the BizBale login. Change or switch off with window.SITE.staffLink in config.js (default is set in app.js).
Visitor counter: one count per device per day, staff devices and robots not counted. Needs the count_visit SQL. Hide it from the public with showVisitors:false in config.js (counting continues); admin always shows today / 7 days / total.
Admin shortcut: tap the "Website visitors" line (or the copyright line) in the footer 5 times (each tap within 1.5 sec) -> opens this site's /admin login. Switch off with adminLink:"" in config.js.
Bike cards: Admin > New Bikes > Edit has Key points (one per line, best 4), Offer price and Offer valid till. After the date passes the offer hides by itself and the Ex-showroom price shows normally. Needs narendra-bike-cards.sql once.
