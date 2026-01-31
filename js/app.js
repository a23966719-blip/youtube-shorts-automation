/* ========================================
   정육점 POP 가격표 & 광고 포스터 생성기
   Main Application Logic
======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initPriceTag();
  initPoster();
});

/* ===== Tab Navigation ===== */
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
}

/* ========================================
   POP 가격표 기능
======================================== */
const CATEGORY_MAP = {
  beef: { icon: '🐂', label: '소고기' },
  pork: { icon: '🐷', label: '돼지고기' },
  chicken: { icon: '🐔', label: '닭고기' },
  lamb: { icon: '🐑', label: '양고기' },
  duck: { icon: '🦆', label: '오리고기' },
  other: { icon: '🍖', label: '기타' },
};

const BADGE_MAP = {
  best: { text: 'BEST', cls: 'badge-best' },
  new: { text: 'NEW', cls: 'badge-new' },
  hot: { text: 'HOT', cls: 'badge-hot' },
  sale: { text: 'SALE', cls: 'badge-sale' },
  recommend: { text: '추천', cls: 'badge-recommend' },
  limited: { text: '한정', cls: 'badge-limited' },
  today: { text: '오늘특가', cls: 'badge-today' },
};

function formatPrice(num) {
  if (!num && num !== 0) return '';
  return Number(num).toLocaleString('ko-KR');
}

function initPriceTag() {
  const $ = id => document.getElementById(id);

  const fields = {
    template: $('pt-template'),
    category: $('pt-category'),
    product: $('pt-product'),
    origin: $('pt-origin'),
    grade: $('pt-grade'),
    price: $('pt-price'),
    unit: $('pt-unit'),
    originalPrice: $('pt-original-price'),
    discount: $('pt-discount'),
    subtitle: $('pt-subtitle'),
    badge: $('pt-badge'),
    size: $('pt-size'),
  };

  const canvas = $('pt-canvas');
  const previewBtn = $('pt-preview-btn');
  const downloadBtn = $('pt-download-btn');

  // Live update on any field change
  Object.values(fields).forEach(el => {
    el.addEventListener('input', () => renderPriceTag(fields, canvas));
    el.addEventListener('change', () => renderPriceTag(fields, canvas));
  });

  previewBtn.addEventListener('click', () => renderPriceTag(fields, canvas));
  downloadBtn.addEventListener('click', () => downloadCanvas('pt-canvas', 'pop-가격표'));

  // Initial render
  renderPriceTag(fields, canvas);
}

function renderPriceTag(fields, canvas) {
  const template = fields.template.value;
  const cat = CATEGORY_MAP[fields.category.value] || CATEGORY_MAP.other;
  const product = fields.product.value || '상품명';
  const origin = fields.origin.value;
  const grade = fields.grade.value;
  const price = fields.price.value;
  const unit = fields.unit.value;
  const originalPrice = fields.originalPrice.value;
  const discount = fields.discount.value;
  const subtitle = fields.subtitle.value;
  const badgeKey = fields.badge.value;

  // Template class
  canvas.className = 'price-tag-canvas ' + template;

  // Badge
  const badgeArea = canvas.querySelector('.pt-badge-area');
  if (badgeKey && BADGE_MAP[badgeKey]) {
    const b = BADGE_MAP[badgeKey];
    badgeArea.innerHTML = `<span class="badge ${b.cls}">${b.text}</span>`;
  } else {
    badgeArea.innerHTML = '';
  }

  // Header
  canvas.querySelector('.pt-category-icon').textContent = cat.icon;
  canvas.querySelector('.pt-category-label').textContent = cat.label;

  // Product name
  canvas.querySelector('.pt-product-name').textContent = product;

  // Origin
  const originEl = canvas.querySelector('.pt-origin');
  originEl.textContent = origin ? `원산지: ${origin}` : '';
  originEl.style.display = origin ? 'block' : 'none';

  // Grade
  const gradeArea = canvas.querySelector('.pt-grade-area');
  if (grade) {
    gradeArea.innerHTML = `<span class="pt-grade">${grade}</span>`;
    gradeArea.style.display = 'block';
  } else {
    gradeArea.innerHTML = '';
    gradeArea.style.display = 'none';
  }

  // Subtitle
  const subtitleArea = canvas.querySelector('.pt-subtitle-area');
  subtitleArea.textContent = subtitle || '';
  subtitleArea.style.display = subtitle ? 'block' : 'none';

  // Price area
  const originalPriceEl = canvas.querySelector('.pt-original-price');
  if (originalPrice) {
    originalPriceEl.textContent = formatPrice(originalPrice) + '원';
    originalPriceEl.style.display = 'block';
  } else {
    originalPriceEl.textContent = '';
    originalPriceEl.style.display = 'none';
  }

  const discountBadge = canvas.querySelector('.pt-discount-badge');
  if (discount) {
    discountBadge.textContent = discount;
    discountBadge.style.display = 'inline-block';
  } else {
    discountBadge.textContent = '';
    discountBadge.style.display = 'none';
  }

  canvas.querySelector('.pt-price-number').textContent = price ? formatPrice(price) : '0';
  canvas.querySelector('.pt-unit').textContent = `/ ${unit}`;
}

/* ========================================
   광고 포스터 기능
======================================== */
function initPoster() {
  const $ = id => document.getElementById(id);

  const fields = {
    template: $('ps-template'),
    shopName: $('ps-shop-name'),
    title: $('ps-title'),
    subtitle: $('ps-subtitle'),
    period: $('ps-period'),
    notice: $('ps-notice'),
    phone: $('ps-phone'),
    address: $('ps-address'),
    size: $('ps-size'),
  };

  const canvas = $('ps-canvas');
  const previewBtn = $('ps-preview-btn');
  const downloadBtn = $('ps-download-btn');
  const addProductBtn = $('ps-add-product');
  const productsList = $('ps-products-list');

  // Add product row
  addProductBtn.addEventListener('click', () => {
    const rows = productsList.querySelectorAll('.ps-product-row');
    if (rows.length >= 5) {
      alert('상품은 최대 5개까지 추가할 수 있습니다.');
      return;
    }
    const row = document.createElement('div');
    row.className = 'ps-product-row';
    row.innerHTML = `
      <input type="text" class="ps-item-name" placeholder="상품명" maxlength="12">
      <input type="text" class="ps-item-price" placeholder="가격 (예: 35,000원)" maxlength="15">
    `;
    productsList.appendChild(row);

    // Add live update listeners to new inputs
    row.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => renderPoster(fields, canvas));
    });
  });

  // Live update on field change
  Object.values(fields).forEach(el => {
    el.addEventListener('input', () => renderPoster(fields, canvas));
    el.addEventListener('change', () => renderPoster(fields, canvas));
  });

  // Also listen on product inputs
  productsList.addEventListener('input', () => renderPoster(fields, canvas));

  previewBtn.addEventListener('click', () => renderPoster(fields, canvas));
  downloadBtn.addEventListener('click', () => downloadCanvas('ps-canvas', '광고포스터'));

  // Initial render
  renderPoster(fields, canvas);
}

function renderPoster(fields, canvas) {
  const template = fields.template.value;
  const shopName = fields.shopName.value || '매장명';
  const title = fields.title.value || '메인 제목';
  const subtitle = fields.subtitle.value || '';
  const period = fields.period.value || '';
  const notice = fields.notice.value || '';
  const phone = fields.phone.value || '';
  const address = fields.address.value || '';

  // Gather products
  const productRows = document.querySelectorAll('#ps-products-list .ps-product-row');
  const products = [];
  productRows.forEach(row => {
    const name = row.querySelector('.ps-item-name').value;
    const price = row.querySelector('.ps-item-price').value;
    if (name || price) {
      products.push({ name: name || '상품', price: price || '가격' });
    }
  });

  // Template class
  canvas.className = 'poster-canvas ' + template;

  // Build inner HTML
  let productsHTML = '';
  if (products.length > 0) {
    productsHTML = products.map(p => `
      <div class="ps-product-item">
        <span class="ps-product-name">${escapeHtml(p.name)}</span>
        <span class="ps-product-dot"></span>
        <span class="ps-product-price">${escapeHtml(p.price)}</span>
      </div>
    `).join('');
  }

  canvas.innerHTML = `
    <div class="ps-top-banner"><span>${escapeHtml(shopName)}</span></div>
    <div class="ps-main-title">${escapeHtml(title)}</div>
    ${subtitle ? `<div class="ps-sub-title">${escapeHtml(subtitle)}</div>` : ''}
    ${period ? `<div class="ps-period">📅 ${escapeHtml(period)}</div>` : ''}
    ${products.length > 0 ? `<div class="ps-product-list">${productsHTML}</div>` : ''}
    ${notice ? `<div class="ps-notice">${escapeHtml(notice)}</div>` : ''}
    <div class="ps-contact">
      ${phone ? `<div class="ps-phone">📞 ${escapeHtml(phone)}</div>` : ''}
      ${address ? `<div class="ps-address">📍 ${escapeHtml(address)}</div>` : ''}
    </div>
    <div class="ps-deco-top-left"></div>
    <div class="ps-deco-top-right"></div>
    <div class="ps-deco-bottom-left"></div>
    <div class="ps-deco-bottom-right"></div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ========================================
   이미지 다운로드 (html2canvas)
======================================== */
function downloadCanvas(canvasId, filenamePrefix) {
  const el = document.getElementById(canvasId);
  if (!el) return;

  // Get scale factor based on selected size
  let scale = 2;
  const sizeSelect = canvasId === 'pt-canvas'
    ? document.getElementById('pt-size')
    : document.getElementById('ps-size');

  if (sizeSelect) {
    const size = sizeSelect.value;
    if (size === 'a3' || size === 'b4') scale = 3;
  }

  // Show loading state on button
  const btn = canvasId === 'pt-canvas'
    ? document.getElementById('pt-download-btn')
    : document.getElementById('ps-download-btn');
  const originalText = btn.textContent;
  btn.textContent = '생성 중...';
  btn.disabled = true;

  html2canvas(el, {
    scale: scale,
    useCORS: true,
    backgroundColor: null,
    logging: false,
  }).then(canvasEl => {
    const link = document.createElement('a');
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    link.download = `${filenamePrefix}_${timestamp}.png`;
    link.href = canvasEl.toDataURL('image/png');
    link.click();
  }).catch(err => {
    console.error('Download failed:', err);
    alert('이미지 생성에 실패했습니다. 다시 시도해주세요.');
  }).finally(() => {
    btn.textContent = originalText;
    btn.disabled = false;
  });
}
