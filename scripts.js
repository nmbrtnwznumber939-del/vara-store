/* =========================
   Sections + Animations
========================= */

let activeSectionId = 'chooser-panel';

function staggerFadeIn(selector) {
  const elements = document.querySelectorAll(selector);

  elements.forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(10px)';
    item.style.transition =
      'opacity 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
  });

  elements.forEach((item, index) => {
    setTimeout(() => {
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    }, 50 + (index * 110));
  });
}

function setSidebarActive(navKey) {
  document.querySelectorAll('.sidebar-item').forEach(a => a.classList.remove('active'));
  const target = document.querySelector(`.sidebar-item[data-nav="${navKey}"]`);
  if (target) target.classList.add('active');
}

function showSection(sectionId, itemSelector, displayType = 'block') {
  const allSections = document.querySelectorAll('.store-section');
  const targetSection = document.getElementById(sectionId);
  if (!targetSection) return;

  allSections.forEach(section => {
    section.classList.remove('active');
    section.style.display = 'none';
  });

  targetSection.style.display = displayType;

  setTimeout(() => {
    targetSection.classList.add('active');
    if (itemSelector) staggerFadeIn(itemSelector);
  }, 10);

  activeSectionId = sectionId;

  // ✅ Sidebar فقط قسمين:
  if (sectionId === 'news-section') setSidebarActive('news');
  else setSidebarActive('chooser');
}

function showChooser() { showSection('chooser-panel', '.choice-card', 'block'); }
function showNews() { showSection('news-section', '.news-card', 'block'); }

function showSMP() { showSection('smp-section', '.rank-card', 'block'); }
function showBoxPVPChooser() { showSection('boxpvp-chooser', '.choice-card', 'block'); }
function showRanks() { showSection('ranks-section', '.rank-card', 'block'); }
function showCrates() { showSection('crate-section', '.key-card-old', 'block'); }

function showOffers() { showSection('offers-section', '.info-card', 'block'); }
function showTopSellers() { showSection('topsellers-section', '.info-card', 'block'); }
function showBundles() { showSection('bundles-section', '.info-card', 'block'); }
function showHowToBuy() { showSection('howtobuy-section', '.howto-step', 'block'); }

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

/* =========================
   3D Tilt
========================= */
(function enableTiltForShopCards(){
  const selectors = ['.choice-card', '.rank-card', '.key-card-old', '.news-card', '.info-card'];
  const cards = () => document.querySelectorAll(selectors.join(','));

  function onMove(e){
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const midX = rect.width / 2;
    const midY = rect.height / 2;

    const rotY = ((x - midX) / midX) * 10;
    const rotX = -((y - midY) / midY) * 10;

    el.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
    el.style.setProperty('--my', `${(y / rect.height) * 100}%`);

    el.style.transform = `translateY(-12px) scale(1.015) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }

  function onLeave(e){
    const el = e.currentTarget;
    el.style.transform = '';
    el.style.removeProperty('--mx');
    el.style.removeProperty('--my');
  }

  function bind(){
    cards().forEach(el => {
      if (el.dataset.tiltBound === '1') return;
      el.dataset.tiltBound = '1';
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    });
  }

  bind();
  const obs = new MutationObserver(bind);
  obs.observe(document.body, { childList: true, subtree: true });
})();

/* =========================
   Sidebar Toggle
========================= */
function toggleSidebar(){
  document.body.classList.toggle('sidebar-open');
}

/* =========================
   SFX (beep)
========================= */
let _audioCtx = null;
function beep(freq=520, dur=0.02, vol=0.02){
  try{
    if(!_audioCtx){
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = _audioCtx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = vol;

    o.connect(g);
    g.connect(ctx.destination);

    const t = ctx.currentTime;
    o.start(t);
    o.stop(t + dur);
  }catch(e){}
}

let hoverLock = false;
function playHover(){
  if(hoverLock) return;
  hoverLock = true;
  beep(520, 0.02, 0.02);
  setTimeout(()=> hoverLock=false, 60);
}
function playClick(){
  beep(720, 0.03, 0.03);
}

/* =========================
   Cart + Orders (LocalStorage)
========================= */
const CART_KEY = "vara_cart_v1";
const ORDERS_KEY = "vara_orders_v1";

const COUPONS = {
  "VARA10": { type:"percent", value:10, label:"خصم 10%" },
  "WEEKEND25": { type:"percent", value:25, label:"خصم 25%" }
};

let cart = loadCart();
let appliedCoupon = null;
let _lastCartCount = 0;

function loadCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch(e){ return []; }
}
function saveCart(){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge(){
  const count = cart.reduce((a,i)=>a+(i.qty||0),0);

  const badge = document.getElementById('cart-badge');
  if(badge) badge.textContent = count;

  const stickyCount = document.getElementById('sticky-cart-count');
  if(stickyCount) stickyCount.textContent = count;

  const stickyBtn = document.getElementById('sticky-cart');
  if(stickyBtn && count > _lastCartCount){
    stickyBtn.classList.remove('pop');
    void stickyBtn.offsetWidth; // restart animation
    stickyBtn.classList.add('pop');
  }

  _lastCartCount = count;
}

function addToCart(item){
  const found = cart.find(x => x.id === item.id);
  if(found) found.qty += 1;
  else cart.push({ ...item, qty:1 });
  saveCart();
}

/* =========================
   Cart Modal
========================= */
function openCart(){
  playClick();
  renderCart();

  const modal = document.getElementById('cart-modal');
  if(!modal) return;

  modal.style.display = 'block';
  requestAnimationFrame(() => modal.classList.add('open'));
}
function closeCart(){
  const modal = document.getElementById('cart-modal');
  if(!modal) return;

  modal.classList.remove('open');
  setTimeout(()=>{ modal.style.display = 'none'; }, 230);
}

function clearCart(){
  playClick();
  cart = [];
  appliedCoupon = null;
  const msg = document.getElementById('coupon-msg');
  if(msg) msg.textContent = "";
  saveCart();
  renderCart();
}

function incQty(id){
  const it = cart.find(x=>x.id===id);
  if(!it) return;
  it.qty++;
  saveCart(); renderCart();
}
function decQty(id){
  const it = cart.find(x=>x.id===id);
  if(!it) return;
  it.qty--;
  if(it.qty<=0) cart = cart.filter(x=>x.id!==id);
  saveCart(); renderCart();
}

function money(n){ return `$${Number(n).toFixed(2)}`; }

function calcTotals(){
  const subtotal = cart.reduce((a,i)=> a + (i.price*i.qty), 0);
  let discount = 0;

  if(appliedCoupon){
    if(appliedCoupon.type==="percent"){
      discount = subtotal * (appliedCoupon.value/100);
    }
  }
  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total };
}

function renderCart(){
  const box = document.getElementById('cart-items');
  if(!box) return;

  if(cart.length === 0){
    box.innerHTML = `<p style="color:#aaa; text-align:right;">السلة فارغة حالياً.</p>`;
  }else{
    box.innerHTML = cart.map(i=>`
      <div class="cart-item">
        <div>
          <div style="font-weight:800;">${i.title}</div>
          <div style="color:#aaa; font-size:.9rem;">${money(i.price)} لكل واحد</div>
        </div>
        <div class="qty">
          <button onclick="decQty('${i.id}')">-</button>
          <span>${i.qty}</span>
          <button onclick="incQty('${i.id}')">+</button>
        </div>
      </div>
    `).join("");
  }

  const t = calcTotals();
  const sub = document.getElementById('cart-subtotal');
  const dis = document.getElementById('cart-discount');
  const tot = document.getElementById('cart-total');

  if(sub) sub.textContent = money(t.subtotal);
  if(dis) dis.textContent = "-" + money(t.discount);
  if(tot) tot.textContent = money(t.total);

  updateCartBadge();
}

function applyCoupon(){
  playClick();
  const input = document.getElementById('coupon-input');
  const msg = document.getElementById('coupon-msg');
  if(!input || !msg) return;

  const code = input.value.trim().toUpperCase();
  if(!code){
    appliedCoupon = null;
    msg.textContent = "أكتب كود الخصم.";
    renderCart();
    return;
  }
  if(!COUPONS[code]){
    appliedCoupon = null;
    msg.textContent = "الكود غير صحيح.";
    renderCart();
    return;
  }
  appliedCoupon = COUPONS[code];
  msg.textContent = `تم تطبيق: ${appliedCoupon.label} (${code})`;
  renderCart();
}

function checkout(){
  playClick();
  if(cart.length === 0){
    alert("السلة فارغة.");
    return;
  }

  const t = calcTotals();
  const order = {
    id: "ORD-" + Date.now(),
    date: new Date().toLocaleString("ar-IQ"),
    items: cart.map(i=>({ title:i.title, qty:i.qty, price:i.price })),
    coupon: appliedCoupon ? { code: Object.keys(COUPONS).find(k=>COUPONS[k]===appliedCoupon) || null, ...appliedCoupon } : null,
    total: t.total
  };

  const orders = loadOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  clearCart();
  closeCart();
  alert("تم حفظ طلبك ✅ روح على (طلباتي) وشوفه.");
}

function loadOrders(){
  try{ return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }
  catch(e){ return []; }
}

function renderOrders(){
  const list = document.getElementById('orders-list');
  if(!list) return;

  const orders = loadOrders();
  if(orders.length === 0){
    list.innerHTML = `<p style="color:#aaa;">ماكو طلبات محفوظة.</p>`;
    return;
  }

  list.innerHTML = orders.map(o=>`
    <div class="order-card">
      <div class="top">
        <span>${o.id}</span>
        <span>${o.date}</span>
      </div>
      <ul>
        ${o.items.map(it=>`<li>${it.qty}x ${it.title} — ${money(it.price)}</li>`).join("")}
      </ul>
      <div style="display:flex; justify-content:space-between; margin-top:10px;">
        <span style="color:#aaa;">${o.coupon ? ("كود: " + o.coupon.code) : "بدون خصم"}</span>
        <strong style="color:var(--primary-color);">الإجمالي: ${money(o.total)}</strong>
      </div>
    </div>
  `).join("");
}

function showOrders(){
  showSection('orders-section', null, 'block');
  renderOrders();
}

function formatOrderText(o){
  if(!o) return "ماكو طلبات.";
  const lines = [];
  lines.push(`🧾 رقم الطلب: ${o.id}`);
  lines.push(`🕒 التاريخ: ${o.date}`);
  lines.push(`------------------------`);
  o.items.forEach(it=>{
    lines.push(`• ${it.qty}x ${it.title} — ${money(it.price)}`);
  });
  lines.push(`------------------------`);
  lines.push(`🏷️ الخصم: ${o.coupon ? (o.coupon.label + " (" + o.coupon.code + ")") : "بدون"}`);
  lines.push(`💰 الإجمالي: ${money(o.total)}`);
  return lines.join("\n");
}

async function copyLastOrder(){
  playClick();
  const orders = loadOrders();
  const text = formatOrderText(orders[0]);

  try{
    await navigator.clipboard.writeText(text);
    alert("✅ تم نسخ آخر طلب");
  }catch(e){
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    alert("✅ تم نسخ آخر طلب");
  }
}

function downloadOrdersJSON(){
  playClick();
  const orders = loadOrders();
  const blob = new Blob([JSON.stringify(orders, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "vara-orders.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

/* =========================
   PDF Invoice (jsPDF)
========================= */
function exportLastOrderPDF(){
  playClick();

  const orders = loadOrders();
  const o = orders[0];
  if(!o){
    alert("ماكو طلبات.");
    return;
  }

  if(!window.jspdf || !window.jspdf.jsPDF){
    alert("مكتبة PDF ما انحملت.\nتأكد ضفت jsPDF قبل scripts.js ونتك شغال.");
    console.log("jsPDF missing:", window.jspdf);
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // ملاحظة: العربي بالـ jsPDF يحتاج خط عربي، لذلك نخليها English مرتبة
  let y = 50;
  doc.setFontSize(16);
  doc.text("Vara Store - Invoice", 40, y); y += 25;

  doc.setFontSize(11);
  doc.text(`Order ID: ${o.id}`, 40, y); y += 18;
  doc.text(`Date: ${o.date}`, 40, y); y += 18;

  y += 10;
  doc.line(40, y, 555, y); y += 18;

  doc.setFontSize(12);
  doc.text("Items:", 40, y); y += 18;

  doc.setFontSize(11);
  o.items.forEach(it=>{
    doc.text(`${it.qty}x ${it.title}  -  ${money(it.price)}`, 50, y);
    y += 16;
    if(y > 760){ doc.addPage(); y = 50; }
  });

  y += 10;
  doc.line(40, y, 555, y); y += 22;

  const couponText = o.coupon ? `${o.coupon.label} (${o.coupon.code})` : "None";
  doc.text(`Coupon: ${couponText}`, 40, y); y += 18;

  doc.setFontSize(13);
  doc.text(`Total: ${money(o.total)}`, 40, y);

  doc.save(`vara-invoice-${o.id}.pdf`);
}

/* =========================
   Auto add "Add to cart" buttons
========================= */
function ensureAddCartButtons(){

  // ranks + smp
  document.querySelectorAll('#ranks-section .rank-card, #smp-section .rank-card').forEach(card=>{
    const footer = card.querySelector('.rank-footer');
    if(!footer) return;
    if(footer.dataset.hasAdd === "1") return;
    footer.dataset.hasAdd = "1";

    const buy = footer.querySelector('.buy-btn');
    const price = footer.querySelector('.price');
    if(!buy || !price) return;

    const right = document.createElement('div');
    right.className = 'buy-actions';

    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'add-cart-btn';
    add.textContent = 'أضف للسلة';

    right.appendChild(buy);
    right.appendChild(add);

    footer.innerHTML = '';
    footer.appendChild(price);
    footer.appendChild(right);
  });

  // keys
  document.querySelectorAll('#crate-section .key-card-old').forEach(card=>{
    const footer = card.querySelector('.key-footer-old');
    if(!footer) return;
    if(footer.dataset.hasAdd === "1") return;
    footer.dataset.hasAdd = "1";

    const buy = footer.querySelector('.buy-btn-old');
    const price = footer.querySelector('.price');
    if(!buy || !price) return;

    const right = document.createElement('div');
    right.className = 'buy-actions';

    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'add-cart-btn';
    add.textContent = 'أضف للسلة';

    right.appendChild(buy);
    right.appendChild(add);

    footer.innerHTML = '';
    footer.appendChild(price);
    footer.appendChild(right);
  });

  // info cards (offers/top/bundles)
  document.querySelectorAll('#offers-section .info-card, #topsellers-section .info-card, #bundles-section .info-card').forEach(card=>{
    if(card.dataset.hasActions==="1") return;
    card.dataset.hasActions="1";

    const buy = card.querySelector('.buy-btn');
    if(!buy) return;

    buy.textContent = 'شراء';

    let priceEl = card.querySelector('.price');
    if(!priceEl){
      priceEl = document.createElement('div');
      priceEl.className = 'price';
      priceEl.style.marginTop = '10px';
      priceEl.style.fontWeight = '900';
      priceEl.style.color = 'var(--primary-color)';
      priceEl.textContent = '$0.00';
      card.appendChild(priceEl);
    }

    const actions = document.createElement('div');
    actions.className = 'buy-actions';
    actions.style.marginTop = '12px';

    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'add-cart-btn';
    add.textContent = 'أضف للسلة';

    actions.appendChild(buy);
    actions.appendChild(add);

    card.appendChild(actions);
  });
}

/* =========================
   Bind Buy Buttons
   - إذا الزر عنده onclick="buy('key_daily')" نخليه مثل ما هو (يفتح Tebex)
   - غيره: شراء = يضيف للسلة ويفتح السلة
========================= */
function bindBuyButtons(){

  // ranks + smp (شراء يفتح السلة)
  document.querySelectorAll('#ranks-section .buy-btn, #smp-section .buy-btn').forEach(btn=>{
    if(btn.dataset.bound==="1") return;

    // إذا هذا زر Tebex (عنده buy() على onclick) لا نلمسه
    const oc = (btn.getAttribute("onclick") || "");
    if(oc.includes("buy(")) return;

    btn.dataset.bound="1";
    btn.onclick = null;

    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      playClick();

      const card = btn.closest('.rank-card');
      if(!card) return;

      const title = (card.querySelector('.rank-header')?.textContent || "Item").trim();
      const priceText = (card.querySelector('.price')?.textContent || "$0").replace("$","").trim();
      const price = parseFloat(priceText) || 0;

      addToCart({ id: "rank_"+title.replace(/\s+/g,"_"), title, price });
      openCart();
    }, true);
  });

  // keys (نفس الشي: إذا الزر Tebex لا نلمسه)
  document.querySelectorAll('#crate-section .buy-btn-old').forEach(btn=>{
    if(btn.dataset.bound==="1") return;

    const oc = (btn.getAttribute("onclick") || "");
    if(oc.includes("buy(")) return;

    btn.dataset.bound="1";
    btn.onclick = null;

    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      playClick();

      const card = btn.closest('.key-card-old');
      if(!card) return;

      const title = (card.querySelector('.key-header')?.textContent || "Key").trim();
      const priceText = (card.querySelector('.price')?.textContent || "$0").replace("$","").trim();
      const price = parseFloat(priceText) || 0;

      addToCart({ id: "key_"+title.replace(/\s+/g,"_"), title, price });
      openCart();
    }, true);
  });

  // info cards buy (شراء يفتح السلة)
  document.querySelectorAll('#offers-section .buy-btn, #topsellers-section .buy-btn, #bundles-section .buy-btn').forEach(btn=>{
    if(btn.dataset.boundInfo==="1") return;

    const oc = (btn.getAttribute("onclick") || "");
    if(oc.includes("buy(")) return;

    btn.dataset.boundInfo="1";

    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      playClick();

      const card = btn.closest('.info-card');
      if(!card) return;

      const title = (card.querySelector('.info-title')?.textContent || "Bundle").trim();
      const priceText = (card.querySelector('.price')?.textContent || "$0").replace("$","").trim();
      const price = parseFloat(priceText) || 0;

      addToCart({ id: "bundle_"+title.replace(/\s+/g,"_"), title, price });
      openCart();
    }, true);
  });
}

/* =========================
   Bind Add-to-Cart Buttons
========================= */
function bindAddToCartButtons(){
  document.querySelectorAll('.add-cart-btn').forEach(btn=>{
    if(btn.dataset.boundAdd==="1") return;
    btn.dataset.boundAdd="1";

    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      playClick();

      const card =
        btn.closest('.rank-card') ||
        btn.closest('.key-card-old') ||
        btn.closest('.info-card') ||
        btn.closest('.choice-card');

      if(!card) return;

      const title =
        (card.querySelector('.rank-header')?.textContent ||
         card.querySelector('.key-header')?.textContent ||
         card.querySelector('.info-title')?.textContent ||
         card.querySelector('h2')?.textContent ||
         "Item").trim();

      const priceText = (card.querySelector('.price')?.textContent || "$0").replace("$","").trim();
      const price = parseFloat(priceText) || 0;

      const id =
        (card.classList.contains('rank-card') ? "rank_" :
         card.classList.contains('key-card-old') ? "key_" :
         card.classList.contains('info-card') ? "bundle_" : "item_")
        + title.replace(/\s+/g,"_");

      addToCart({ id, title, price });
    }, true);
  });
}

/* =========================
   Search UI
========================= */
function addSearchUI(){
  const ranks = document.getElementById('ranks-section');
  const crates = document.getElementById('crate-section');

  function inject(section, gridSelector){
    if(!section || section.dataset.searchAdded==="1") return;
    const gridEl = section.querySelector(gridSelector);
    if(!gridEl) return;

    section.dataset.searchAdded="1";

    const bar = document.createElement('div');
    bar.style.display='flex';
    bar.style.gap='10px';
    bar.style.flexWrap='wrap';
    bar.style.margin='10px 0 20px';

    bar.innerHTML = `
      <input class="search-input" type="text" placeholder="بحث..." style="flex:1; min-width:200px; background:#111; border:1px solid #333; color:#fff; border-radius:10px; padding:10px;">
      <select class="sort-select" style="background:#111; border:1px solid #333; color:#fff; border-radius:10px; padding:10px;">
        <option value="default">الترتيب الافتراضي</option>
        <option value="low">الأرخص</option>
        <option value="high">الأغلى</option>
        <option value="az">A → Z</option>
      </select>
    `;

    section.insertBefore(bar, gridEl);

    const input = bar.querySelector('.search-input');
    const select = bar.querySelector('.sort-select');
    const grid = gridEl;

    function getCards(){ return Array.from(grid.children); }
    function getTitle(card){
      return (card.querySelector('.rank-header, .key-header')?.textContent || "").trim().toLowerCase();
    }
    function getPrice(card){
      const p = (card.querySelector('.price')?.textContent || "$0").replace("$","").trim();
      return parseFloat(p) || 0;
    }

    let original = getCards();

    function apply(){
      const q = input.value.trim().toLowerCase();
      let cards = original.slice();

      cards.forEach(c=>{
        const ok = !q || getTitle(c).includes(q);
        c.style.display = ok ? "" : "none";
      });

      const visible = cards.filter(c => c.style.display !== "none");
      const sort = select.value;

      if(sort === "low") visible.sort((a,b)=>getPrice(a)-getPrice(b));
      if(sort === "high") visible.sort((a,b)=>getPrice(b)-getPrice(a));
      if(sort === "az") visible.sort((a,b)=>getTitle(a).localeCompare(getTitle(b)));

      visible.forEach(v=> grid.appendChild(v));
    }

    input.addEventListener('input', apply);
    select.addEventListener('change', apply);
  }

  inject(ranks, '.rank-grid');
  inject(crates, '.key-grid-old');
}

/* =========================
   Countdown
========================= */
function startCountdown(){
  const endKey = "vara_deal_end_v1";
  let end = parseInt(localStorage.getItem(endKey),10);
  if(!end){
    end = Date.now() + (48 * 60 * 60 * 1000);
    localStorage.setItem(endKey, String(end));
  }

  const el = document.getElementById('deal-countdown');
  if(!el) return;

  setInterval(()=>{
    const diff = end - Date.now();
    if(diff <= 0){
      el.textContent = "انتهى";
      return;
    }
    const s = Math.floor(diff/1000);
    const hh = String(Math.floor(s/3600)).padStart(2,'0');
    const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
    const ss = String(s%60).padStart(2,'0');
    el.textContent = `${hh}:${mm}:${ss}`;
  }, 1000);
}

/* =========================
   SFX binding
========================= */
function bindSfx(){
  const sel = '.choice-card, .rank-card, .key-card-old, .news-card, .info-card, .buy-btn, .buy-btn-old, .add-cart-btn, .sidebar-item, .mini-btn';
  document.querySelectorAll(sel).forEach(el=>{
    if(el.dataset.sfx==="1") return;
    el.dataset.sfx="1";
    el.addEventListener('mouseenter', playHover);
    el.addEventListener('click', playClick);
  });
}

/* =========================
   ✅ Tebex Links + buy()
========================= */
const TEBEX = {
  key_daily: "https://vara-webstore.tebex.io/package/7173735",
  key_vote: "",
  key_rare: "",
  key_kit: "",
  key_legendary: "",
};

function buy(key){
  const url = TEBEX[key];
  if(!url){
    alert("رابط الشراء بعد ما مضاف لهذا المنتج.");
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/* =========================
   Init
========================= */
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  addSearchUI();
  startCountdown();

  ensureAddCartButtons();
  bindBuyButtons();
  bindAddToCartButtons();
  bindSfx();
});

// لأن أقسامك تتبدّل، نعيد الربط تلقائياً
const autoBind = new MutationObserver(()=>{
  ensureAddCartButtons();
  bindBuyButtons();
  bindAddToCartButtons();
  bindSfx();
});
autoBind.observe(document.body, { childList:true, subtree:true });
