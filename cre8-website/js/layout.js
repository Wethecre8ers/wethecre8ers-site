/* ============================================================
   SHARED CHROME — header, footer, cart drawer, modals, toast.
   renderChrome() injects all of it so the markup lives in one
   place across every page. Call it FIRST in a page's bootstrap,
   before updateCartUI() / handleCheckoutReturn().
   ============================================================ */

const CATEGORY_PAGES = [
  { name: 'Home & Desk',       href: '/shop-home-desk.html' },
  { name: 'Personalized',      href: '/shop-personalized.html' },
  { name: 'Tactical Training', href: '/shop-tactical-training.html' }
];

function renderChrome(){
  const path = location.pathname;
  const onHome = path === '/' || path.endsWith('/index.html');
  // Section anchors (process / about / contact) live on the home page,
  // so from any other page they need the leading "/".
  const to = (id) => (onHome ? '' : '/') + '#' + id;
  const here = (href) => path === href || path.endsWith(href);

  const shopSub =
    `<a href="/shop.html"${here('/shop.html') ? ' class="current"' : ''}>All Products</a>` +
    CATEGORY_PAGES
      .map(c => `<a href="${c.href}"${here(c.href) ? ' class="current"' : ''}>${c.name}</a>`)
      .join('');

  document.body.insertAdjacentHTML('afterbegin', `
<header>
  <div class="nav">
    <a href="/" class="brand">
      <img src="/images/logo.jpg" alt="Cre8 logo">
      <div>
        <div class="word">Cre<span>8</span></div>
        <div class="tag">WeTheCre8ers</div>
      </div>
    </a>
    <nav class="links">
      <span class="hasSub">
        <a href="/shop.html">Shop</a>
        <span class="subMenu">${shopSub}</span>
      </span>
      <a href="${to('process')}">Process</a>
      <a href="${to('about')}">About</a>
      <a href="${to('contact')}">Contact</a>
    </nav>
    <div class="navRight">
      <button class="cartBtn" onclick="openCart()">
        Cart <span class="cartCount" id="cartCount">0</span>
      </button>
      <button class="menuToggle" id="menuToggleBtn" onclick="toggleMobileNav()">&#9776;</button>
    </div>
  </div>
  <div class="mobileMenu" id="mobileMenu">
    <a href="/shop.html" onclick="closeMobileNav()">Shop — All Products</a>
    <a href="/shop-home-desk.html" onclick="closeMobileNav()">Shop — Home &amp; Desk</a>
    <a href="/shop-personalized.html" onclick="closeMobileNav()">Shop — Personalized</a>
    <a href="/shop-tactical-training.html" onclick="closeMobileNav()">Shop — Tactical Training</a>
    <a href="${to('process')}" onclick="closeMobileNav()">Process</a>
    <a href="${to('about')}" onclick="closeMobileNav()">About</a>
    <a href="${to('contact')}" onclick="closeMobileNav()">Contact</a>
  </div>
</header>`);

  document.body.insertAdjacentHTML('beforeend', `
<footer>
  <div class="wrap">
    <div class="footGrid">
      <div class="footBrand">
        <div class="word">Cre<span>8</span></div>
        <p>The making division of WeTheCre8ers. Envision. Design. Produce.</p>
      </div>
      <div>
        <h5>Shop</h5>
        <ul>
          <li><a href="/shop.html">All Products</a></li>
          ${CATEGORY_PAGES.map(c => `<li><a href="${c.href}">${c.name}</a></li>`).join('')}
        </ul>
      </div>
      <div>
        <h5>Company</h5>
        <ul>
          <li><a href="${to('about')}">About</a></li>
          <li><a href="${to('process')}">Our Process</a></li>
          <li><a href="${to('contact')}">Contact</a></li>
        </ul>
      </div>
    </div>
    <div class="footBottom">
      <span>&copy; 2026 WeTheCre8ers. All rights reserved.</span>
      <span>Envision &nbsp;&middot;&nbsp; Design &nbsp;&middot;&nbsp; Produce</span>
    </div>
  </div>
</footer>

<div class="overlay" id="overlay" onclick="closeAllOverlays()"></div>
<div class="drawer" id="drawer">
  <div class="drawerHead">
    <h3>Your Cart</h3>
    <button class="closeX" onclick="closeCart()">&times;</button>
  </div>
  <div class="drawerBody" id="cartBody"></div>
  <div class="drawerFoot" id="cartFoot"></div>
</div>

<div class="modalOverlay" id="productModalOverlay" onclick="closeOnBackdrop(event,'productModalOverlay')">
  <div class="modal" id="productModal"></div>
</div>

<div class="modalOverlay" id="checkoutModalOverlay" onclick="closeOnBackdrop(event,'checkoutModalOverlay')">
  <div class="modal" id="checkoutModal" style="max-width:960px;"></div>
</div>

<div class="toast" id="toast"><span class="dot"></span><span id="toastMsg"></span></div>`);
}
