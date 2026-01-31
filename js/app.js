/* ========================================
   정육점 POP 가격표 & 광고 포스터 생성기
   Main Application Logic
======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initPriceTag();
  initPoster();
  initImageFeatures();
  loadSavedImages();
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

  const printBtn = $('pt-print-btn');

  previewBtn.addEventListener('click', () => renderPriceTag(fields, canvas));
  downloadBtn.addEventListener('click', () => downloadCanvas('pt-canvas', 'pop-가격표'));
  printBtn.addEventListener('click', () => printCanvas('pt-canvas'));

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

  // Image
  let imageArea = canvas.querySelector('.pt-image-area');
  if (!imageArea) {
    imageArea = document.createElement('div');
    imageArea.className = 'pt-image-area';
    canvas.querySelector('.pt-subtitle-area').after(imageArea);
  }
  if (currentImages.pt) {
    imageArea.innerHTML = `<img src="${currentImages.pt}" alt="상품 이미지">`;
    imageArea.style.display = 'block';
  } else {
    imageArea.innerHTML = '';
    imageArea.style.display = 'none';
  }

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

  const printBtn = $('ps-print-btn');

  previewBtn.addEventListener('click', () => renderPoster(fields, canvas));
  downloadBtn.addEventListener('click', () => downloadCanvas('ps-canvas', '광고포스터'));
  printBtn.addEventListener('click', () => printCanvas('ps-canvas'));

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

  const heroImageHTML = currentImages.ps
    ? `<div class="ps-hero-image"><img src="${currentImages.ps}" alt="홍보 이미지"></div>`
    : '';

  canvas.innerHTML = `
    <div class="ps-top-banner"><span>${escapeHtml(shopName)}</span></div>
    <div class="ps-main-title">${escapeHtml(title)}</div>
    ${subtitle ? `<div class="ps-sub-title">${escapeHtml(subtitle)}</div>` : ''}
    ${period ? `<div class="ps-period">📅 ${escapeHtml(period)}</div>` : ''}
    ${heroImageHTML}
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

/* ========================================
   인쇄 기능
======================================== */
function printCanvas(canvasId) {
  const el = document.getElementById(canvasId);
  if (!el) return;

  el.classList.add('print-target');
  window.print();
  el.classList.remove('print-target');
}

/* ========================================
   이미지 업로드 / 검색 / 자동 저장
======================================== */
const currentImages = { pt: null, ps: null };
let activeImageTarget = null; // 'pt' or 'ps'

const STORAGE_KEY_IMAGES = 'butcher-poster-saved-images';
const STORAGE_KEY_API = 'butcher-poster-pixabay-key';

function initImageFeatures() {
  // -- 가격표 이미지 업로드 --
  document.getElementById('pt-image-upload').addEventListener('change', (e) => {
    handleFileUpload(e, 'pt');
  });
  document.getElementById('pt-image-remove-btn').addEventListener('click', () => {
    removeImage('pt');
  });
  document.getElementById('pt-image-search-btn').addEventListener('click', () => {
    openSearchModal('pt');
  });

  // -- 포스터 이미지 업로드 --
  document.getElementById('ps-image-upload').addEventListener('change', (e) => {
    handleFileUpload(e, 'ps');
  });
  document.getElementById('ps-image-remove-btn').addEventListener('click', () => {
    removeImage('ps');
  });
  document.getElementById('ps-image-search-btn').addEventListener('click', () => {
    openSearchModal('ps');
  });

  // -- 모달 --
  document.getElementById('modal-close-btn').addEventListener('click', closeSearchModal);
  document.getElementById('image-search-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeSearchModal();
  });
  document.getElementById('modal-search-btn').addEventListener('click', doPixabaySearch);
  document.getElementById('modal-search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doPixabaySearch();
  });
  document.getElementById('save-api-key-btn').addEventListener('click', () => {
    const key = document.getElementById('pixabay-api-key').value.trim();
    if (key) {
      localStorage.setItem(STORAGE_KEY_API, key);
      alert('API Key가 저장되었습니다.');
    }
  });

  // 저장된 API Key 불러오기
  const savedKey = localStorage.getItem(STORAGE_KEY_API);
  if (savedKey) {
    document.getElementById('pixabay-api-key').value = savedKey;
  }
}

/* -- 파일 업로드 처리 -- */
function handleFileUpload(e, target) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    setImage(target, dataUrl);
    saveImageToStorage(target, dataUrl, file.name);
  };
  reader.readAsDataURL(file);
}

/* -- 이미지 설정 -- */
function setImage(target, dataUrl) {
  currentImages[target] = dataUrl;

  // 썸네일 미리보기
  const preview = document.getElementById(target + '-image-preview');
  preview.innerHTML = `<img src="${dataUrl}" alt="미리보기">`;

  // 제거 버튼 표시
  document.getElementById(target + '-image-remove-btn').style.display = 'inline-block';

  // 캔버스 리렌더
  triggerRender(target);
}

function removeImage(target) {
  currentImages[target] = null;
  document.getElementById(target + '-image-preview').innerHTML = '';
  document.getElementById(target + '-image-remove-btn').style.display = 'none';
  document.getElementById(target + '-image-upload').value = '';

  // 저장 목록에서 active 해제
  document.querySelectorAll(`#${target}-saved-images .saved-thumb`).forEach(
    img => img.classList.remove('active')
  );

  triggerRender(target);
}

function triggerRender(target) {
  if (target === 'pt') {
    document.getElementById('pt-preview-btn').click();
  } else {
    document.getElementById('ps-preview-btn').click();
  }
}

/* -- localStorage 자동 저장 -- */
function saveImageToStorage(target, dataUrl, name) {
  let saved = JSON.parse(localStorage.getItem(STORAGE_KEY_IMAGES) || '{}');
  if (!saved[target]) saved[target] = [];

  // 같은 이름이면 덮어쓰기, 최대 10개
  const idx = saved[target].findIndex(item => item.name === name);
  if (idx >= 0) {
    saved[target][idx].data = dataUrl;
  } else {
    saved[target].unshift({ name, data: dataUrl });
    if (saved[target].length > 10) saved[target].pop();
  }

  try {
    localStorage.setItem(STORAGE_KEY_IMAGES, JSON.stringify(saved));
  } catch (e) {
    // localStorage 용량 초과 시 오래된 항목 제거 후 재시도
    if (saved[target].length > 3) {
      saved[target] = saved[target].slice(0, 3);
      try {
        localStorage.setItem(STORAGE_KEY_IMAGES, JSON.stringify(saved));
      } catch (_) { /* 무시 */ }
    }
  }

  renderSavedImages(target);
}

function loadSavedImages() {
  renderSavedImages('pt');
  renderSavedImages('ps');
}

function renderSavedImages(target) {
  const container = document.getElementById(target + '-saved-images');
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_IMAGES) || '{}');
  const items = saved[target] || [];

  if (items.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = items.map((item, i) =>
    `<img class="saved-thumb" src="${item.data}" alt="${escapeHtml(item.name)}" title="${escapeHtml(item.name)}" data-index="${i}">`
  ).join('');

  container.querySelectorAll('.saved-thumb').forEach(img => {
    img.addEventListener('click', () => {
      const index = parseInt(img.dataset.index);
      const data = items[index].data;
      setImage(target, data);

      // active 표시
      container.querySelectorAll('.saved-thumb').forEach(t => t.classList.remove('active'));
      img.classList.add('active');
    });
  });
}

/* -- Pixabay 무료 이미지 검색 -- */
function openSearchModal(target) {
  activeImageTarget = target;
  document.getElementById('image-search-modal').style.display = 'flex';
  document.getElementById('modal-search-input').focus();
  document.getElementById('modal-search-results').innerHTML = '';
  document.getElementById('modal-search-status').textContent = '';
}

function closeSearchModal() {
  document.getElementById('image-search-modal').style.display = 'none';
  activeImageTarget = null;
}

function doPixabaySearch() {
  const query = document.getElementById('modal-search-input').value.trim();
  const apiKey = document.getElementById('pixabay-api-key').value.trim();

  if (!apiKey) {
    alert('Pixabay API Key를 입력해주세요.\nhttps://pixabay.com/api/docs/ 에서 무료로 발급 가능합니다.');
    return;
  }
  if (!query) {
    alert('검색어를 입력해주세요.');
    return;
  }

  const statusEl = document.getElementById('modal-search-status');
  const resultsEl = document.getElementById('modal-search-results');
  statusEl.textContent = '검색 중...';
  resultsEl.innerHTML = '';

  const url = `https://pixabay.com/api/?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&image_type=photo&per_page=20&safesearch=true&lang=ko`;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('API 요청 실패 (키를 확인해주세요)');
      return res.json();
    })
    .then(data => {
      if (!data.hits || data.hits.length === 0) {
        statusEl.textContent = '검색 결과가 없습니다. 다른 검색어를 시도해보세요.';
        return;
      }
      statusEl.textContent = `${data.totalHits}개 결과 중 ${data.hits.length}개 표시 (클릭하여 선택)`;
      resultsEl.innerHTML = data.hits.map(hit => `
        <div class="search-result-item" data-url="${hit.webformatURL}">
          <img src="${hit.previewURL}" alt="${escapeHtml(hit.tags)}" loading="lazy">
        </div>
      `).join('');

      resultsEl.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const imageUrl = item.dataset.url;
          statusEl.textContent = '이미지 불러오는 중...';

          // 외부 이미지를 base64로 변환하여 저장
          fetchImageAsDataUrl(imageUrl).then(dataUrl => {
            if (activeImageTarget) {
              setImage(activeImageTarget, dataUrl);
              saveImageToStorage(activeImageTarget, dataUrl, 'pixabay_' + Date.now());
            }
            closeSearchModal();
          }).catch(() => {
            // CORS 실패 시 URL 직접 사용
            if (activeImageTarget) {
              setImage(activeImageTarget, imageUrl);
            }
            closeSearchModal();
          });
        });
      });
    })
    .catch(err => {
      statusEl.textContent = '오류: ' + err.message;
    });
}

function fetchImageAsDataUrl(url) {
  return fetch(url)
    .then(res => res.blob())
    .then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}
