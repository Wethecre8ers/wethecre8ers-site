/* ============================================================
   CART — cart state, drawer rendering, and shared UI helpers
   (modals, mobile nav, toast). The cart is saved to
   localStorage on every change and reloaded on page load, so
   it survives navigating between pages.
   ============================================================ */
const CART_STORAGE_KEY = 'cre8_cart';

// Load a saved cart, dropping any lines whose product no longer
// exists so the rest of the code can trust every entry.
function loadCart(){
  try {
    const raw = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(c => c && typeof c.productId === 'string' && PRODUCTS.some(p => p.id === c.productId))
      .map(c => ({
        productId: c.productId,
        qty: Math.max(1, parseInt(c.qty, 10) || 1),
        material: String(c.material == null ? '' : c.material),
        color: String(c.color == null ? '' : c.color)
      }));
  } catch (_) {
    return [];
  }
}

// Called from updateCartUI(), so every cart change is persisted.
function saveCart(){
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); } catch (_) {}
}

let cart = loadCart(); // {productId, qty, material, color}

function addToCart(id, qty, material, color){
  const existing = cart.find(c => c.productId===id && c.material===material && c.color===color);
  if(existing){ existing.qty += qty; } else { cart.push({productId:id, qty, material, color}); }
  updateCartUI();
}
function changeQty(idx, delta){
  cart[idx].qty += delta;
  if(cart[idx].qty <= 0) cart.splice(idx,1);
  updateCartUI();
}
function removeItem(idx){ cart.splice(idx,1); updateCartUI(); }

function cartTotal(){
  return cart.reduce((sum,c)=>{
    const p = PRODUCTS.find(x=>x.id===c.productId);
    return sum + p.price * c.qty;
  },0);
}
function cartCount(){ return cart.reduce((s,c)=>s+c.qty,0); }

function updateCartUI(){
  saveCart();
  document.getElementById('cartCount').textContent = cartCount();
  const body = document.getElementById('cartBody');
  const foot = document.getElementById('cartFoot');
  if(cart.length===0){
    body.innerHTML = `<div class="emptyState">
      <svg viewBox="0 0 24 24" fill="none" stroke="#B7B9BC" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      <p>Your cart is empty.</p>
    </div>`;
    foot.innerHTML = '';
    return;
  }
  body.innerHTML = cart.map((c,idx) => {
    const p = PRODUCTS.find(x=>x.id===c.productId);
    return `
    <div class="cartItem">
      <div class="mini">${ICONS[p.icon]}</div>
      <div>
        <h4>${p.name}</h4>
        <div class="opt">${c.material === 'As-is' ? 'One-of-a-kind, as-is' : `${c.material} · ${c.color}`}</div>
        <div class="qtyRow">
          <button class="qtyBtn" onclick="changeQty(${idx},-1)">-</button>
          <span>${c.qty}</span>
          <button class="qtyBtn" onclick="changeQty(${idx},1)">+</button>
        </div>
      </div>
      <div class="right">
        <div class="lineTotal">${money(p.price*c.qty)}</div>
        <button class="removeLink" onclick="removeItem(${idx})">Remove</button>
      </div>
    </div>`;
  }).join('');
  const sub = cartTotal();
  const shipping = sub > 0 ? 6.5 : 0;
  const total = sub + shipping;
  foot.innerHTML = `
    <div class="sumRow"><span>Subtotal</span><span>${money(sub)}</span></div>
    <div class="sumRow"><span>Estimated Shipping</span><span>${money(shipping)}</span></div>
    <div class="sumRow total"><span>Total</span><span>${money(total)}</span></div>
    <button class="btn btn-gold btn-block" style="margin-top:16px;" onclick="openCheckout()">Checkout</button>
  `;
}

/* ---------------- Cart Drawer + Modals ---------------- */
function openCart(){ document.getElementById('drawer').classList.add('show'); document.getElementById('overlay').classList.add('show'); }
function closeCart(){ document.getElementById('drawer').classList.remove('show'); document.getElementById('overlay').classList.remove('show'); }
function closeAllOverlays(){ closeCart(); }
function openModal(id){ document.getElementById(id).classList.add('show'); }
function closeModal(id){ document.getElementById(id).classList.remove('show'); }
function closeOnBackdrop(e, id){ if(e.target.id===id) closeModal(id); }
function toggleMobileNav(){ document.getElementById('mobileMenu').classList.toggle('show'); }
function closeMobileNav(){ document.getElementById('mobileMenu').classList.remove('show'); }

function showToast(msg){
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}
