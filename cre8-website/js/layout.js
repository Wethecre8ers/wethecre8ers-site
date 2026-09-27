/* ============================================================
   SHARED CHROME — header, footer, cart drawer, modals, toast.
   renderChrome() injects all of it so the markup lives in one
   place across every page. Call it FIRST in a page's bootstrap,
   before updateCartUI() / handleCheckoutReturn().
   ============================================================ */

const CATEGORY_PAGES = [
  { name: 'Fidgets',                            href: '/shop-fidgets.html' },
  { name: 'Halloween',                          href: '/shop-halloween.html' },
  { name: 'Home & Desk',                        href: '/shop-home-desk.html' },
  { name: 'Inspirational Signs & Light Boards', href: '/shop-inspirational-signs.html' },
  { name: 'Personalized',                       href: '/shop-personalized.html' },
  { name: 'Tactical Training',                  href: '/shop-tactical-training.html' }
];

/* ============================================================
   GUMMY SHARK CONTEST — banner shown on every page until endsAt,
   then it disappears on its own. Keep endsAt in sync with
   CONTEST_ENDS_AT in api/contest-entry.js.
   ============================================================ */
const CONTEST = {
  id: 'gummy-shark-2026',
  endsAt: '2026-11-01T03:59:59Z', // 11:59:59 PM Eastern on Oct 31, 2026 (Halloween)
  endsText: 'Halloween, October 31',
  page: '/contest.html'
};
function contestIsOpen(){ return Date.now() < Date.parse(CONTEST.endsAt); }
function contestSharkSVG(color){
  return `<svg viewBox="0 0 60 30" aria-hidden="true" focusable="false"><path fill="${color}" d="M4 16C10 4 30 2 44 12L56 4L54 16L58 26L44 20C30 28 10 28 4 16Z"/><path fill="${color}" d="M24 8L30 0L34 9Z"/><circle cx="14" cy="14" r="1.8" fill="#3C1053"/></svg>`;
}
function contestBannerDismissed(){
  try { return localStorage.getItem('cre8_contest_banner') === CONTEST.id; } catch (_) { return false; }
}
function dismissContestBanner(){
  const el = document.getElementById('contestBanner');
  if (el) el.remove();
  try { localStorage.setItem('cre8_contest_banner', CONTEST.id); } catch (_) {}
}
function contestBannerHTML(){
  return `
<div class="contestBanner" id="contestBanner" role="region" aria-label="Gummy shark contest">
  <button class="cbClose" type="button" onclick="dismissContestBanner()" aria-label="Hide the contest banner">&times;</button>
  <span class="cbShark s1">${contestSharkSVG('#FF4F9A')}</span>
  <span class="cbShark s2">${contestSharkSVG('#2FB86B')}</span>
  <span class="cbShark s3">${contestSharkSVG('#FF7A1A')}</span>
  <div class="cbText">
    <div class="cbHead">Find the best gummy shark!</div>
    <div class="cbSub">Win a bag of fun 3D printed gummy sharks. Contest ends on ${CONTEST.endsText}!</div>
  </div>
  <a class="cbBtn" href="${CONTEST.page}">Enter now!</a>
</div>`;
}

function renderChrome(){
  const path = location.pathname;
  const onHome = path === '/' || path.endsWith('/index.html');
  // Section anchors (process / about / contact) live on the home page,
  // so from any other page they need the leading "/".
  const to = (id) => (onHome ? '' : '/') + '#' + id;
  const here = (href) => path === href || path.endsWith(href);

  const shopSub = CATEGORY_PAGES
    .map(c => `<a href="${c.href}"${here(c.href) ? ' class="current"' : ''}>${c.name}</a>`)
    .join('');

  document.body.insertAdjacentHTML('afterbegin', `
<header>
  <div class="nav">
    <a href="/" class="brand" aria-label="WeTheCre8ers Cre8 — home">
      <img src="/images/logo.png" alt="WeTheCre8ers Cre8">
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
    ${CATEGORY_PAGES.map(c => `<a href="${c.href}" onclick="closeMobileNav()">Shop — ${c.name}</a>`).join('\n    ')}
    <a href="${to('process')}" onclick="closeMobileNav()">Process</a>
    <a href="${to('about')}" onclick="closeMobileNav()">About</a>
    <a href="${to('contact')}" onclick="closeMobileNav()">Contact</a>
  </div>
</header>`);

  const onContestPage = path === CONTEST.page || path === '/contest-rules.html';
  if (contestIsOpen() && !onContestPage && !contestBannerDismissed()) {
    document.body.insertAdjacentHTML('afterbegin', contestBannerHTML());
  }

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
          ${CATEGORY_PAGES.map(c => `<li><a href="${c.href}">${c.name}</a></li>`).join('')}
        </ul>
      </div>
      <div>
        <h5>Company</h5>
        <ul>
          <li><a href="${to('about')}">About</a></li>
          <li><a href="${to('process')}">Our Process</a></li>
          <li><a href="${to('contact')}">Contact</a></li>
          <li><a href="/shipping-returns.html">Shipping &amp; Returns</a></li>
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
