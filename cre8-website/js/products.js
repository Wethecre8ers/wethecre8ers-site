/* ============================================================
   CRE8 STOREFRONT — DEMO DATA LAYER
   Replace PRODUCTS with your real catalog. Each product supports
   optional material/color variants which adjust price.
   ============================================================ */
const PRODUCTS = [
    {
    id:'concho-frog-01', category:'Home & Desk', name:'Concho The Frog',
    price:29.99, desc:'A small desk companion figurine, designed with clean lines and a friendly presence for any workspace.',
    icon:'frog', images:['/images/products/concho-frog-1.jpg','/images/products/concho-frog-2.jpg'], asIs:true, materials:[], colors:[]
  },
  {
    id:'minipallets-01', category:'Home & Desk', name:'Mini Pallets (3-Pack)',
    price:9.99, desc:'A set of three stackable mini pallets, sized to hold a stack of sticky notes or small desk items.',
    icon:'pallet', images:['/images/products/minipallets-1.jpg','/images/products/minipallets-2.jpg'], colorSlots:3, materials:['PLA Matte'], colors:['Black','Orange','Red','Brown','Blue','White','Legacy Gold']
  },
  {
    id:'dumpling-01', category:'Home & Desk', name:'Mini Clicker Dumpling (2-Pack)',
    price:10.99, desc:'A pair of squeezable dumpling figures with a friendly painted face, sized for a desk or shelf.',
    icon:'dumpling', images:['/images/products/dumpling-1.jpg','/images/products/dumpling-2.jpg','/images/products/dumpling-3.jpg'], materials:['PLA Matte'], colors:['Black','Orange','Red','Brown','Blue','White','Legacy Gold']
  },
  {
    id:'minicrates-01', category:'Home & Desk', name:'Mini Crates (2-Pack)',
    price:10.99, desc:'A pair of stackable milk-crate-style totes, sized for small desk items, candy, or trinkets.',
    icon:'crate', images:['/images/products/minicrates-1.jpg','/images/products/minicrates-2.jpg'], materials:['PLA Matte'], colors:['Black','Orange','Red','Brown','Blue','White','Legacy Gold']
  },
  {
    id:'flexiturtle-01', category:'Home & Desk', name:'Flexi Turtle',
    price:10.99, desc:'A hand-sized, poseable turtle figure with a flexible print-in-place design — a fun fidget or shelf piece.',
    icon:'turtle', images:['/images/products/flexiturtle-1.jpg','/images/products/flexiturtle-2.jpg'], asIs:true, materials:[], colors:[]
  },
  {
    id:'pumpkinspinner-01', category:'Home & Desk', name:'Pumpkin Spinner',
    price:12.99, desc:'A jack-o-lantern figure with a spinning stem, sized for a desk or seasonal display.',
    icon:'pumpkin', images:['/images/products/pumpkinspinner-1.jpg'], asIs:true, materials:[], colors:[]
  },
  {
    id:'skullplanter-01', category:'Home & Desk', name:'Skull Planter',
    price:15.99, desc:'A carved skull-and-vine planter, designed to hold a small succulent or cutting.',
    icon:'skull', images:['/images/products/skullplanter-1.jpg','/images/products/skullplanter-2.jpg'], materials:['PLA Matte'], colors:['Black','Orange','Red','Brown','Blue','White','Legacy Gold']
  },
  {
    id:'photolightbox-01', category:'Personalized', name:'Customized Photo Light Box',
    price:34.99, desc:'A backlit photo panel made from your own picture, engraved so it glows when lit. Made to order — after checkout, email your photo to Motiv8@wethecre8ers.com with your order confirmation.',
    icon:'lightbox', images:['/images/products/photolightbox-1.jpg','/images/products/photolightbox-2.jpg','/images/products/photolightbox-3.jpg','/images/products/photolightbox-4.jpg'], asIs:true, needsPhoto:true, materials:[], colors:[]
  },
  {
    id:'training-glock19-01', category:'Tactical Training', name:'Training Glock 19 Replica',
    price:23.99, desc:'A solid, non-functional Glock 19-profile training replica for holster fit, draw practice, and handling drills. Inert plastic — no moving parts and cannot fire.',
    icon:'pistol', images:['/images/products/training-glock19-1.jpg'], materials:['PLA Matte'], colors:['Blue','Red','Yellow']
  },
  {
    id:'training-glock17-mag-01', category:'Tactical Training', name:'Training Glock 17 Magazine',
    price:10.99, desc:'A solid Glock 17-profile dummy magazine for reload and malfunction drills. Inert training replica — does not hold or feed ammunition and has no functional parts.',
    icon:'magazine', images:['/images/products/training-glock17-mag-1.jpg'], materials:['PLA Matte'], colors:['Blue','Red','Yellow']
  },
  {
    id:'training-karambit-01', category:'Tactical Training', name:'Training Karambit Replica',
    price:10.99, desc:'A solid, blunt karambit-profile trainer for grip, retention, and flow drills. Inert training replica — no cutting edge or point.',
    icon:'karambit', images:['/images/products/training-karambit-1.jpg'], materials:['PLA Matte'], colors:['Red','Blue','Yellow']
  },
  {
    id:'anyway-mother-teresa-01', category:'Inspirational Signs & Light Boards', name:'Anyway - Mother Teresa',
    price:39.99, desc:'A backlit light board engraved with the "Anyway" poem attributed to Mother Teresa — the words glow warmly when lit and read as a clean frosted panel when off. Ships ready to display. Want a different quote or saying? Contact us for a custom quote.',
    icon:'sign', images:['/images/products/anyway-mother-teresa-1.jpg','/images/products/anyway-mother-teresa-2.jpg'], asIs:true, materials:[], colors:[]
  }
];

const ICONS = {
  plate:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="40" width="72" height="26" rx="3" stroke="#C8953D" stroke-width="2.5"/><text x="50" y="58" font-family="Cinzel, serif" font-size="16" fill="#B7B9BC" text-anchor="middle">Cre8</text><line x1="14" y1="70" x2="86" y2="70" stroke="#8A5B1E" stroke-width="2"/></svg>`,
  planter:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M28 40 L72 40 L64 82 L36 82 Z" stroke="#C8953D" stroke-width="2.5" stroke-linejoin="round"/><line x1="24" y1="40" x2="76" y2="40" stroke="#B7B9BC" stroke-width="2.5"/><path d="M40 40 C40 24 60 24 60 40" stroke="#8A5B1E" stroke-width="2"/></svg>`,
  stand:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 78 L78 78 L70 46 L30 46 Z" stroke="#B7B9BC" stroke-width="2.5" stroke-linejoin="round"/><rect x="38" y="20" width="24" height="34" rx="2" stroke="#C8953D" stroke-width="2.5" transform="rotate(-8 50 37)"/></svg>`,
  key:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="34" cy="40" r="14" stroke="#C8953D" stroke-width="2.5"/><line x1="46" y1="50" x2="78" y2="82" stroke="#B7B9BC" stroke-width="2.5"/><line x1="66" y1="70" x2="76" y2="60" stroke="#B7B9BC" stroke-width="2.5"/><line x1="72" y1="76" x2="82" y2="66" stroke="#B7B9BC" stroke-width="2.5"/></svg>`,
  topper:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><text x="50" y="46" font-family="Cinzel, serif" font-size="22" fill="#C8953D" text-anchor="middle">C8</text><line x1="30" y1="60" x2="30" y2="86" stroke="#B7B9BC" stroke-width="2.5"/><line x1="70" y1="60" x2="70" y2="86" stroke="#B7B9BC" stroke-width="2.5"/></svg>`,
  ornament:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="58" r="26" stroke="#C8953D" stroke-width="2.5"/><rect x="44" y="24" width="12" height="12" rx="2" stroke="#B7B9BC" stroke-width="2.5"/><line x1="50" y1="36" x2="50" y2="32" stroke="#B7B9BC" stroke-width="2.5"/></svg>`,
  terrain:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="56" width="24" height="24" stroke="#B7B9BC" stroke-width="2.5"/><rect x="44" y="44" width="24" height="36" stroke="#C8953D" stroke-width="2.5"/><rect x="72" y="60" width="16" height="20" stroke="#8A5B1E" stroke-width="2.5"/></svg>`,
  tower:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M38 20 L62 20 L68 70 L32 70 Z" stroke="#C8953D" stroke-width="2.5" stroke-linejoin="round"/><rect x="24" y="70" width="52" height="14" rx="2" stroke="#B7B9BC" stroke-width="2.5"/></svg>`,
  tray:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="32" width="68" height="40" rx="3" stroke="#C8953D" stroke-width="2.5"/><line x1="40" y1="32" x2="40" y2="72" stroke="#B7B9BC" stroke-width="2"/><line x1="64" y1="32" x2="64" y2="72" stroke="#B7B9BC" stroke-width="2"/></svg>`,
  frog:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="60" rx="28" ry="20" stroke="#C8953D" stroke-width="2.5"/><circle cx="36" cy="38" r="8" stroke="#B7B9BC" stroke-width="2.5"/><circle cx="64" cy="38" r="8" stroke="#B7B9BC" stroke-width="2.5"/><circle cx="36" cy="38" r="2.5" fill="#8A5B1E"/><circle cx="64" cy="38" r="2.5" fill="#8A5B1E"/><path d="M38 66 Q50 74 62 66" stroke="#8A5B1E" stroke-width="2"/></svg>`,
  pallet:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="60" width="60" height="14" rx="2" stroke="#B7B9BC" stroke-width="2.5"/><rect x="20" y="42" width="60" height="14" rx="2" stroke="#C8953D" stroke-width="2.5"/><rect x="20" y="24" width="60" height="14" rx="2" stroke="#8A5B1E" stroke-width="2.5"/></svg>`,
  dumpling:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 30 C68 30 78 46 78 62 C78 72 65 76 50 76 C35 76 22 72 22 62 C22 46 32 30 50 30 Z" stroke="#C8953D" stroke-width="2.5"/><circle cx="42" cy="58" r="2.5" fill="#8A5B1E"/><circle cx="58" cy="58" r="2.5" fill="#8A5B1E"/><path d="M42 66 Q50 71 58 66" stroke="#8A5B1E" stroke-width="2"/></svg>`,
  crate:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="24" y="30" width="52" height="46" stroke="#C8953D" stroke-width="2.5"/><line x1="24" y1="44" x2="76" y2="44" stroke="#B7B9BC" stroke-width="1.5"/><line x1="24" y1="58" x2="76" y2="58" stroke="#B7B9BC" stroke-width="1.5"/><line x1="38" y1="30" x2="38" y2="76" stroke="#B7B9BC" stroke-width="1.5"/><line x1="52" y1="30" x2="52" y2="76" stroke="#B7B9BC" stroke-width="1.5"/><line x1="66" y1="30" x2="66" y2="76" stroke="#B7B9BC" stroke-width="1.5"/></svg>`,
  turtle:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="48" cy="54" rx="22" ry="18" stroke="#C8953D" stroke-width="2.5"/><circle cx="74" cy="52" r="9" stroke="#B7B9BC" stroke-width="2.5"/><circle cx="78" cy="50" r="1.8" fill="#8A5B1E"/><path d="M30 42 Q22 38 18 44" stroke="#B7B9BC" stroke-width="2.5"/><path d="M30 66 Q22 70 18 64" stroke="#B7B9BC" stroke-width="2.5"/><path d="M58 40 Q64 32 72 36" stroke="#B7B9BC" stroke-width="2.5"/><path d="M58 68 Q64 76 70 72" stroke="#B7B9BC" stroke-width="2.5"/></svg>`,
  pumpkin:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 40 Q30 40 26 60 Q30 80 50 80 Q70 80 74 60 Q70 40 50 40 Z" stroke="#C8953D" stroke-width="2.5"/><path d="M50 40 L50 28" stroke="#8A5B1E" stroke-width="2.5"/><line x1="38" y1="42" x2="38" y2="78" stroke="#B7B9BC" stroke-width="1.5"/><line x1="62" y1="42" x2="62" y2="78" stroke="#B7B9BC" stroke-width="1.5"/></svg>`,
  skull:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 34 L32 60 Q32 70 50 70 Q68 70 68 60 L68 34" stroke="#C8953D" stroke-width="2.5"/><circle cx="42" cy="46" r="6" stroke="#B7B9BC" stroke-width="2"/><circle cx="58" cy="46" r="6" stroke="#B7B9BC" stroke-width="2"/><path d="M40 62 L44 62 M48 62 L52 62 M56 62 L60 62" stroke="#8A5B1E" stroke-width="2"/></svg>`,
  lightbox:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="26" y="22" width="48" height="60" rx="2" stroke="#C8953D" stroke-width="2.5"/><circle cx="50" cy="46" r="10" stroke="#B7B9BC" stroke-width="2"/><path d="M32 68 L42 56 L52 66 L60 54 L68 68" stroke="#8A5B1E" stroke-width="2"/></svg>`,
  pistol:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 30 L84 30 L84 42 L52 42 L58 72 L40 72 L40 48 L32 48 L32 42 L16 42 Z" stroke="#C8953D" stroke-width="2.5" stroke-linejoin="round"/><path d="M40 48 Q46 60 52 48" stroke="#B7B9BC" stroke-width="2.5"/><line x1="74" y1="32" x2="74" y2="40" stroke="#8A5B1E" stroke-width="2"/><line x1="78" y1="32" x2="78" y2="40" stroke="#8A5B1E" stroke-width="2"/></svg>`,
  magazine:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 16 L60 16 L62 78 L40 78 Z" stroke="#C8953D" stroke-width="2.5" stroke-linejoin="round"/><rect x="36" y="78" width="30" height="8" rx="2" stroke="#B7B9BC" stroke-width="2.5"/><line x1="43" y1="30" x2="59" y2="30" stroke="#8A5B1E" stroke-width="2"/><line x1="44" y1="44" x2="60" y2="44" stroke="#8A5B1E" stroke-width="2"/><line x1="45" y1="58" x2="61" y2="58" stroke="#8A5B1E" stroke-width="2"/></svg>`,
  karambit:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="36" cy="26" r="8" stroke="#B7B9BC" stroke-width="2.5"/><path d="M44 30 C66 34 78 54 72 74 C67 90 50 92 38 82" stroke="#C8953D" stroke-width="2.5" stroke-linecap="round"/><path d="M45 35 C58 41 65 53 63 66" stroke="#8A5B1E" stroke-width="2" stroke-linecap="round"/></svg>`,
  sign:`<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="26" y="16" width="48" height="68" rx="3" stroke="#C8953D" stroke-width="2.5"/><line x1="35" y1="32" x2="65" y2="32" stroke="#B7B9BC" stroke-width="3.5"/><line x1="35" y1="43" x2="59" y2="43" stroke="#8A5B1E" stroke-width="2"/><line x1="35" y1="54" x2="65" y2="54" stroke="#B7B9BC" stroke-width="3.5"/><line x1="35" y1="65" x2="55" y2="65" stroke="#8A5B1E" stroke-width="2"/></svg>`
};

/* ============================================================
   PRODUCT DISPLAY — catalog filters, product grid, and the
   product detail modal. Shared by the home page and every
   category page.
   ============================================================ */
let activeFilter = 'All';

function money(n){ return '$' + n.toFixed(2); }

function renderFilters(){
  const row = document.getElementById('filterRow');
  if (!row) return;
  const cats = ['All', ...new Set(PRODUCTS.map(p=>p.category))];
  row.innerHTML = cats.map(c => `<button class="chip ${c===activeFilter?'active':''}" onclick="setFilter('${c}')">${c}</button>`).join('');
}
function setFilter(c){ activeFilter = c; renderFilters(); renderGrid(); }

function productCardHTML(p){
  return `
    <div class="card">
      <div class="thumb" onclick="openProduct('${p.id}')" style="cursor:pointer;">
        <span class="badge">${p.category}</span>
        ${p.images && p.images.length ? `<img src="${p.images[0]}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;padding:14px;box-sizing:border-box;">` : ICONS[p.icon]}
      </div>
      <div class="body">
        <h3>${p.name}</h3>
        <p class="desc">${p.desc}</p>
        <div class="metaRow">
          <span class="price">${money(p.price)}</span>
          <span class="fromTag">${p.materials.length>1?'From':''}</span>
        </div>
        <div class="actions">
          <button class="miniBtn" onclick="openProduct('${p.id}')">Details</button>
          <button class="miniBtn solid" onclick="quickAdd('${p.id}')">Add to Cart</button>
        </div>
      </div>
    </div>
  `;
}

// Home page / all-products grid (filtered by the chip row).
function renderGrid(){
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  const items = PRODUCTS.filter(p => activeFilter==='All' || p.category===activeFilter);
  grid.innerHTML = items.map(productCardHTML).join('');
}

// Category page grid — one fixed category, no filter row.
function renderCategoryGrid(category){
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = PRODUCTS.filter(p => p.category === category).map(productCardHTML).join('');
}

function quickAdd(id){
  const p = PRODUCTS.find(x=>x.id===id);
  const material = p.asIs ? 'As-is' : p.materials[0];
  let color;
  if (p.asIs) {
    color = 'As-is';
  } else if (p.colorSlots && p.colorSlots > 1) {
    color = Array.from({length:p.colorSlots}).map((_,i)=>p.colors[i % p.colors.length]).join(', ');
  } else {
    color = p.colors[0];
  }
  addToCart(id, 1, material, color);
  showToast(`${p.name} added to cart`);
}

function openProduct(id){
  const p = PRODUCTS.find(x=>x.id===id);
  const modal = document.getElementById('productModal');
  const hasImages = p.images && p.images.length;
  const mainImg = hasImages ? p.images[0] : null;
  const galleryHtml = hasImages && p.images.length > 1 ? `
    <div id="galleryThumbs" style="display:flex; gap:8px; padding:12px; justify-content:center; flex-wrap:wrap;">
      ${p.images.map((img,i)=>`<button onclick="switchGalleryImage(this,'${img}')" style="width:52px;height:52px;padding:0;border-radius:4px;overflow:hidden;border:1px solid ${i===0?'var(--gold)':'rgba(183,185,188,.3)'};background:none;cursor:pointer;"><img src="${img}" style="width:100%;height:100%;object-fit:cover;"></button>`).join('')}
    </div>` : '';
  const colorBlockHtml = p.colorSlots && p.colorSlots > 1 ? `
    <div class="optGroup">
      <label>Choose ${p.colorSlots} Colors (one per pallet)</label>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${Array.from({length:p.colorSlots}).map((_,i)=>`
          <select id="colorSlot${i}" style="width:100%;background:var(--charcoal-2);border:1px solid rgba(183,185,188,.25);color:var(--ivory);padding:11px 12px;border-radius:var(--radius);font-family:var(--sans);font-size:13.5px;">
            ${p.colors.map((c,ci)=>`<option value="${c}" ${ci===(i % p.colors.length)?'selected':''}>Pallet ${i+1}: ${c}</option>`).join('')}
          </select>
        `).join('')}
      </div>
    </div>
  ` : `
    <div class="optGroup">
      <label>Color</label>
      <div class="swatches" id="colSwatches">
        ${p.colors.map((c,i)=>`<button class="swatch ${i===0?'active':''}" data-val="${c}" onclick="selectSwatch(this,'col')">${c}</button>`).join('')}
      </div>
    </div>
  `;
  const optionsHtml = p.asIs ? `
    ${p.needsPhoto ? `<div class="noteBox" style="margin-top:0;margin-bottom:20px;border-color:rgba(200,149,61,.5);"><b style="color:var(--gold);">Made to order:</b> after checkout, email your photo to Motiv8@wethecre8ers.com along with your order confirmation so we can get started.</div>` : `<div class="noteBox" style="margin-top:0;margin-bottom:20px;">This piece ships exactly as shown, with no material or color options.</div>`}
  ` : `
    <div class="optGroup">
      <label>Material</label>
      <div class="swatches" id="matSwatches">
        ${p.materials.map((m,i)=>`<button class="swatch ${i===0?'active':''}" data-val="${m}" onclick="selectSwatch(this,'mat')">${m}</button>`).join('')}
      </div>
    </div>
    ${colorBlockHtml}
  `;
  modal.innerHTML = `
    <button class="modalClose" onclick="closeModal('productModalOverlay')">&times;</button>
    <div class="productModalGrid">
      <div>
        <div class="thumb" id="mainProductImg">${mainImg ? `<img src="${mainImg}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;padding:24px;box-sizing:border-box;">` : ICONS[p.icon]}</div>
        ${galleryHtml}
      </div>
      <div class="pmBody">
        <span class="eyebrow">${p.category}</span>
        <h3>${p.name}</h3>
        <span class="price">${money(p.price)}</span>
        <p class="desc">${p.desc}</p>
        ${optionsHtml}
        <button class="btn btn-gold btn-block" onclick="addFromModal('${p.id}')">Add to Cart — ${money(p.price)}</button>
        ${p.asIs ? '' : '<div class="noteBox">Layer lines and slight color variation are part of how this piece is made. We\'ll flag anything unusual before it ships.</div>'}
      </div>
    </div>
  `;
  openModal('productModalOverlay');
}
function switchGalleryImage(btn, imgSrc){
  document.querySelector('#mainProductImg img').src = imgSrc;
  const parent = btn.parentElement;
  [...parent.children].forEach(c => c.style.border = '1px solid rgba(183,185,188,.3)');
  btn.style.border = '1px solid var(--gold)';
}
function selectSwatch(btn, group){
  const parent = btn.parentElement;
  [...parent.children].forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
}
function addFromModal(id){
  const p = PRODUCTS.find(x=>x.id===id);
  const mat = p.asIs ? 'As-is' : document.querySelector('#matSwatches .active').dataset.val;
  let col;
  if (p.asIs) {
    col = 'As-is';
  } else if (p.colorSlots && p.colorSlots > 1) {
    col = Array.from({length:p.colorSlots}).map((_,i)=>document.getElementById(`colorSlot${i}`).value).join(', ');
  } else {
    col = document.querySelector('#colSwatches .active').dataset.val;
  }
  addToCart(id, 1, mat, col);
  closeModal('productModalOverlay');
  showToast(`${p.name} added to cart`);
}
