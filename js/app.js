/* ========================================
   정육점 POP 가격표 생성기
   Main Application Logic
======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPriceTag();
  initImageFeatures();
  initZoom();
  initCustomText();
  loadSavedImages();
});

/* ========================================
   POP 가격표 기능
======================================== */
const CATEGORY_MAP = {
  beef: { icon: '', label: '소고기' },
  pork: { icon: '', label: '돼지고기' },
  chicken: { icon: '', label: '닭고기' },
  lamb: { icon: '', label: '양고기' },
  duck: { icon: '', label: '오리고기' },
  other: { icon: '', label: '기타' },
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
  if (num == null || num === '') return '';
  const n = Number(num);
  if (isNaN(n) || !isFinite(n) || n < 0) return '0';
  return n.toLocaleString('ko-KR');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isSafeImageSrc(url) {
  if (!url || typeof url !== 'string') return false;
  return /^(data:image\/|https?:\/\/)/.test(url);
}

function initPriceTag() {
  const $ = id => document.getElementById(id);

  const fields = {
    template: $('pt-template'),
    orientation: $('pt-orientation'),
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
  const downloadBtn = $('pt-download-btn');
  const printBtn = $('pt-print-btn');

  Object.values(fields).forEach(el => {
    if (!el) return;
    el.addEventListener('input', () => renderPriceTag(fields, canvas));
    el.addEventListener('change', () => renderPriceTag(fields, canvas));
  });

  downloadBtn.addEventListener('click', () => downloadCanvas('pt-canvas', 'pop-가격표'));
  printBtn.addEventListener('click', () => printCanvas('pt-canvas'));

  renderPriceTag(fields, canvas);
}

function renderPriceTag(fields, canvas) {
  const template = fields.template.value;
  const orientation = fields.orientation.value;
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

  // Template + orientation class
  canvas.className = 'price-tag-canvas ' + template;
  if (orientation === 'landscape') {
    canvas.classList.add('landscape');
  }

  // Badge
  const badgeArea = canvas.querySelector('.pt-badge-area');
  if (badgeKey && BADGE_MAP[badgeKey]) {
    const b = BADGE_MAP[badgeKey];
    badgeArea.innerHTML = '<span class="badge ' + b.cls + '">' + b.text + '</span>';
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
  originEl.textContent = origin ? '원산지: ' + origin : '';
  originEl.style.display = origin ? 'block' : 'none';

  // Grade
  const gradeArea = canvas.querySelector('.pt-grade-area');
  if (grade) {
    gradeArea.innerHTML = '<span class="pt-grade">' + escapeHtml(grade) + '</span>';
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
    const customTexts = canvas.querySelector('.pt-custom-texts');
    if (customTexts) {
      customTexts.before(imageArea);
    } else {
      canvas.appendChild(imageArea);
    }
  }
  imageArea.innerHTML = '';
  if (currentImages.pt && isSafeImageSrc(currentImages.pt)) {
    const img = document.createElement('img');
    img.src = currentImages.pt;
    img.alt = '상품 이미지';
    imageArea.appendChild(img);
    imageArea.style.display = 'block';
  } else {
    imageArea.style.display = 'none';
  }

  // Custom texts
  renderCustomTextsOnCanvas();

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
  canvas.querySelector('.pt-unit').textContent = '/ ' + unit;
}

/* ========================================
   이미지 다운로드 (html2canvas)
======================================== */
function downloadCanvas(canvasId, filenamePrefix) {
  const el = document.getElementById(canvasId);
  if (!el) return;

  let scale = 2;
  const sizeSelect = document.getElementById('pt-size');
  if (sizeSelect) {
    const size = sizeSelect.value;
    if (size === 'a3' || size === 'b4') scale = 3;
  }

  const btn = document.getElementById('pt-download-btn');
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
    const timestamp = now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '_' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0');
    link.download = filenamePrefix + '_' + timestamp + '.png';
    link.href = canvasEl.toDataURL('image/png');
    link.click();
  }).catch(function() {
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
   이미지 업로드 / Google 검색 / 자동 저장
======================================== */
const currentImages = { pt: null };

const STORAGE_KEY_IMAGES = 'butcher-poster-saved-images';

function initImageFeatures() {
  document.getElementById('pt-image-upload').addEventListener('change', (e) => {
    handleFileUpload(e, 'pt');
  });
  document.getElementById('pt-image-remove-btn').addEventListener('click', () => {
    removeImage('pt');
  });
  document.getElementById('pt-image-search-btn').addEventListener('click', () => {
    openGoogleImageSearch();
  });
}

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

function setImage(target, dataUrl) {
  if (!isSafeImageSrc(dataUrl)) return;
  currentImages[target] = dataUrl;

  const preview = document.getElementById(target + '-image-preview');
  preview.innerHTML = '';
  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = '미리보기';
  preview.appendChild(img);

  document.getElementById(target + '-image-remove-btn').style.display = 'inline-block';
  triggerRender();
}

function removeImage(target) {
  currentImages[target] = null;
  document.getElementById(target + '-image-preview').innerHTML = '';
  document.getElementById(target + '-image-remove-btn').style.display = 'none';
  document.getElementById(target + '-image-upload').value = '';

  document.querySelectorAll('#' + target + '-saved-images .saved-thumb').forEach(
    function(img) { img.classList.remove('active'); }
  );
  triggerRender();
}

function triggerRender() {
  const template = document.getElementById('pt-template');
  if (template) {
    template.dispatchEvent(new Event('change'));
  }
}

/* Google 이미지 검색 */
function openGoogleImageSearch() {
  const product = document.getElementById('pt-product').value || '정육점 고기';
  const query = encodeURIComponent(product + ' 정육점');
  window.open('https://www.google.com/search?tbm=isch&q=' + query, '_blank');
}

/* localStorage 자동 저장 */
function saveImageToStorage(target, dataUrl, name) {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY_IMAGES) || '{}');
  } catch (e) {
    saved = {};
  }
  if (!saved[target]) saved[target] = [];

  const idx = saved[target].findIndex(function(item) { return item.name === name; });
  if (idx >= 0) {
    saved[target][idx].data = dataUrl;
  } else {
    saved[target].unshift({ name: name, data: dataUrl });
    if (saved[target].length > 10) saved[target].pop();
  }

  try {
    localStorage.setItem(STORAGE_KEY_IMAGES, JSON.stringify(saved));
  } catch (e) {
    if (saved[target].length > 3) {
      saved[target] = saved[target].slice(0, 3);
      try {
        localStorage.setItem(STORAGE_KEY_IMAGES, JSON.stringify(saved));
      } catch (_) {
        alert('저장 공간이 부족합니다.');
      }
    }
  }
  renderSavedImages(target);
}

function loadSavedImages() {
  renderSavedImages('pt');
}

function renderSavedImages(target) {
  const container = document.getElementById(target + '-saved-images');
  if (!container) return;
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY_IMAGES) || '{}');
  } catch (e) {
    saved = {};
  }
  const items = saved[target] || [];

  if (items.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = items.map(function(item, i) {
    if (!isSafeImageSrc(item.data)) return '';
    return '<img class="saved-thumb" src="' + escapeAttr(item.data) + '" alt="' + escapeAttr(item.name) + '" title="' + escapeAttr(item.name) + '" data-index="' + i + '">';
  }).join('');

  container.querySelectorAll('.saved-thumb').forEach(function(img) {
    img.addEventListener('click', function() {
      var index = parseInt(img.dataset.index);
      var data = items[index].data;
      setImage(target, data);
      container.querySelectorAll('.saved-thumb').forEach(function(t) { t.classList.remove('active'); });
      img.classList.add('active');
    });
  });
}

/* ========================================
   확대/축소 기능
======================================== */
let currentZoom = 100;

function initZoom() {
  document.getElementById('zoom-in-btn').addEventListener('click', function() {
    setZoom(currentZoom + 20);
  });
  document.getElementById('zoom-out-btn').addEventListener('click', function() {
    setZoom(currentZoom - 20);
  });
  document.getElementById('zoom-reset-btn').addEventListener('click', function() {
    setZoom(100);
  });
}

function setZoom(level) {
  if (level < 40) level = 40;
  if (level > 200) level = 200;
  currentZoom = level;

  var canvas = document.getElementById('pt-canvas');
  canvas.style.transform = 'scale(' + (level / 100) + ')';
  canvas.style.transformOrigin = 'top center';

  document.getElementById('zoom-level').textContent = level + '%';
}

/* ========================================
   텍스트 추가 기능
======================================== */
var customTexts = [];

function initCustomText() {
  document.getElementById('pt-add-text-btn').addEventListener('click', addCustomText);
  document.getElementById('pt-custom-text').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') addCustomText();
  });
}

function addCustomText() {
  var input = document.getElementById('pt-custom-text');
  var text = input.value.trim();
  if (!text) return;

  var size = document.getElementById('pt-text-size').value;
  var color = document.getElementById('pt-text-color').value;

  customTexts.push({ text: text, size: size, color: color });
  input.value = '';

  renderCustomTextList();
  renderCustomTextsOnCanvas();
}

function removeCustomText(index) {
  customTexts.splice(index, 1);
  renderCustomTextList();
  renderCustomTextsOnCanvas();
}

function renderCustomTextList() {
  var container = document.getElementById('pt-text-list');
  if (customTexts.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = customTexts.map(function(item, i) {
    return '<div class="custom-text-item">' +
      '<span class="text-color-dot" style="background:' + escapeAttr(item.color) + '"></span>' +
      '<span class="text-preview">' + escapeHtml(item.text) + ' (' + item.size + 'px)</span>' +
      '<button class="btn-remove-text" data-index="' + i + '">x</button>' +
      '</div>';
  }).join('');

  container.querySelectorAll('.btn-remove-text').forEach(function(btn) {
    btn.addEventListener('click', function() {
      removeCustomText(parseInt(btn.dataset.index));
    });
  });
}

function renderCustomTextsOnCanvas() {
  var area = document.querySelector('.pt-custom-texts');
  if (!area) return;

  if (customTexts.length === 0) {
    area.innerHTML = '';
    area.style.display = 'none';
    return;
  }

  area.style.display = 'block';
  area.innerHTML = customTexts.map(function(item) {
    return '<div class="pt-custom-text-line" style="font-size:' + item.size + 'px;color:' + escapeAttr(item.color) + '">' + escapeHtml(item.text) + '</div>';
  }).join('');
}
