/* ========================================
   정육점 POP 가격표 생성기
   Main Application Logic
======================================== */

document.addEventListener('DOMContentLoaded', function() {
  initPriceTag();
  initImageFeatures();
  initZoom();
  initCustomText();
  initProductStorage();
  initSlideView();
  initAutoCalc();
  renderSavedProductsList();
});

/* ========================================
   기본 유틸
======================================== */
var CATEGORY_MAP = {
  beef: { icon: '', label: '소고기' },
  pork: { icon: '', label: '돼지고기' },
  chicken: { icon: '', label: '닭고기' },
  lamb: { icon: '', label: '양고기' },
  duck: { icon: '', label: '오리고기' },
  other: { icon: '', label: '기타' },
};

var BADGE_MAP = {
  best: { text: 'BEST', cls: 'badge-best' },
  new: { text: 'NEW', cls: 'badge-new' },
  hot: { text: 'HOT', cls: 'badge-hot' },
  sale: { text: 'SALE', cls: 'badge-sale' },
  recommend: { text: '추천', cls: 'badge-recommend' },
  limited: { text: '한정', cls: 'badge-limited' },
  today: { text: '오늘특가', cls: 'badge-today' },
};

var TEMPLATE_COLORS = {
  'classic-red': '#d32f2f',
  'premium-black': '#1a1a1a',
  'fresh-green': '#388e3c',
  'sale-yellow': '#f57f17',
  'modern-blue': '#1565c0',
  'market-korean': '#795548',
  'hanwoo-premium': '#6d1a1a',
  'butcher-craft': '#4E342E',
  'mega-sale': '#FF1744',
  'clean-minimal': '#37474F',
};

var FONT_MAP = {
  '': "'Noto Sans KR', sans-serif",
  'black-han-sans': "'Black Han Sans', sans-serif",
  'do-hyeon': "'Do Hyeon', sans-serif",
  'jua': "'Jua', sans-serif",
  'bagel-fat-one': "'Bagel Fat One', system-ui",
  'gasoek-one': "'Gasoek One', system-ui",
  'yeon-sung': "'Yeon Sung', system-ui",
  'dongle': "'Dongle', sans-serif",
  'gugi': "'Gugi', system-ui",
  'nanum-pen': "'Nanum Pen Script', cursive",
};

function formatPrice(num) {
  if (num == null || num === '') return '';
  var n = Number(num);
  if (isNaN(n) || !isFinite(n) || n < 0) return '0';
  return n.toLocaleString('ko-KR');
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isSafeImageSrc(url) {
  if (!url || typeof url !== 'string') return false;
  return /^(data:image\/|https?:\/\/)/.test(url);
}

/* ========================================
   자동 판매가 계산
======================================== */
function initAutoCalc() {
  var origEl = document.getElementById('pt-original-price');
  var discEl = document.getElementById('pt-discount');
  if (origEl) origEl.addEventListener('input', autoCalcPrice);
  if (discEl) discEl.addEventListener('input', autoCalcPrice);
}

function autoCalcPrice() {
  var originalPrice = parseFloat(document.getElementById('pt-original-price').value);
  var discount = parseFloat(document.getElementById('pt-discount').value);

  if (!isNaN(originalPrice) && originalPrice > 0 && !isNaN(discount) && discount > 0 && discount <= 99) {
    var salePrice = Math.round(originalPrice * (1 - discount / 100));
    document.getElementById('pt-price').value = salePrice;
    triggerRender();
  }
}

/* ========================================
   POP 가격표 기능
======================================== */
var ptFields = null;
var ptCanvas = null;

function initPriceTag() {
  var $ = function(id) { return document.getElementById(id); };

  ptFields = {
    template: $('pt-template'),
    orientation: $('pt-orientation'),
    font: $('pt-font'),
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

  ptCanvas = $('pt-canvas');

  Object.values(ptFields).forEach(function(el) {
    if (!el) return;
    el.addEventListener('input', function() { renderPriceTag(ptFields, ptCanvas); });
    el.addEventListener('change', function() { renderPriceTag(ptFields, ptCanvas); });
  });

  $('pt-download-btn').addEventListener('click', function() { downloadCanvas('pt-canvas', 'pop-가격표'); });
  $('pt-print-btn').addEventListener('click', function() { printCanvas('pt-canvas'); });

  renderPriceTag(ptFields, ptCanvas);
}

function renderPriceTag(fields, canvas) {
  var template = fields.template.value;
  var orientation = fields.orientation.value;
  var fontKey = fields.font ? fields.font.value : '';
  var cat = CATEGORY_MAP[fields.category.value] || CATEGORY_MAP.other;
  var product = fields.product.value || '상품명';
  var origin = fields.origin.value;
  var grade = fields.grade.value;
  var price = fields.price.value;
  var unit = fields.unit.value;
  var originalPrice = fields.originalPrice.value;
  var discount = fields.discount.value;
  var subtitle = fields.subtitle.value;
  var badgeKey = fields.badge.value;
  var isLandscape = orientation === 'landscape';

  canvas.className = 'price-tag-canvas ' + template + (isLandscape ? ' landscape' : '');

  // Badge
  var badgeArea = canvas.querySelector('.pt-badge-area');
  if (badgeKey && BADGE_MAP[badgeKey]) {
    var b = BADGE_MAP[badgeKey];
    badgeArea.innerHTML = '<span class="badge ' + b.cls + '">' + b.text + '</span>';
  } else {
    badgeArea.innerHTML = '';
  }

  canvas.querySelector('.pt-category-icon').textContent = cat.icon;
  canvas.querySelector('.pt-category-label').textContent = cat.label;

  // Body area - 가로모드일 때 이미지 왼쪽 / 텍스트 오른쪽
  var body = canvas.querySelector('.pt-body');
  var imageArea = body.querySelector('.pt-image-area');
  var hasImage = currentImages.pt && isSafeImageSrc(currentImages.pt);

  if (isLandscape && hasImage) {
    var rightDiv = body.querySelector('.pt-body-right');
    if (!rightDiv) {
      rightDiv = document.createElement('div');
      rightDiv.className = 'pt-body-right';
    }
    imageArea.innerHTML = '';
    imageArea.style.display = 'block';
    var img = document.createElement('img');
    img.src = currentImages.pt;
    img.alt = '상품 이미지';
    imageArea.appendChild(img);

    rightDiv.innerHTML = '';
    var nameDiv = document.createElement('div');
    nameDiv.className = 'pt-product-name';
    nameDiv.textContent = product;
    rightDiv.appendChild(nameDiv);

    if (origin) {
      var originDiv = document.createElement('div');
      originDiv.className = 'pt-origin';
      originDiv.textContent = '원산지: ' + origin;
      rightDiv.appendChild(originDiv);
    }
    if (grade) {
      var gradeDiv = document.createElement('div');
      gradeDiv.className = 'pt-grade-area';
      gradeDiv.innerHTML = '<span class="pt-grade">' + escapeHtml(grade) + '</span>';
      rightDiv.appendChild(gradeDiv);
    }
    if (subtitle) {
      var subDiv = document.createElement('div');
      subDiv.className = 'pt-subtitle-area';
      subDiv.textContent = subtitle;
      subDiv.style.display = 'block';
      rightDiv.appendChild(subDiv);
    }

    var directName = body.querySelector(':scope > .pt-product-name');
    var directOrigin = body.querySelector(':scope > .pt-origin');
    var directGrade = body.querySelector(':scope > .pt-grade-area');
    var directSub = body.querySelector(':scope > .pt-subtitle-area');
    if (directName) directName.style.display = 'none';
    if (directOrigin) directOrigin.style.display = 'none';
    if (directGrade) directGrade.style.display = 'none';
    if (directSub) directSub.style.display = 'none';

    if (!body.querySelector('.pt-body-right')) {
      body.appendChild(rightDiv);
    }
  } else {
    var existingRight = body.querySelector('.pt-body-right');
    if (existingRight) existingRight.remove();

    var directName = body.querySelector(':scope > .pt-product-name');
    var directOrigin = body.querySelector(':scope > .pt-origin');
    var directGrade = body.querySelector(':scope > .pt-grade-area');
    var directSub = body.querySelector(':scope > .pt-subtitle-area');

    if (directName) { directName.textContent = product; directName.style.display = ''; }
    if (directOrigin) {
      directOrigin.textContent = origin ? '원산지: ' + origin : '';
      directOrigin.style.display = origin ? 'block' : 'none';
    }
    if (directGrade) {
      if (grade) {
        directGrade.innerHTML = '<span class="pt-grade">' + escapeHtml(grade) + '</span>';
        directGrade.style.display = 'block';
      } else {
        directGrade.innerHTML = '';
        directGrade.style.display = 'none';
      }
    }
    if (directSub) {
      directSub.textContent = subtitle || '';
      directSub.style.display = subtitle ? 'block' : 'none';
    }

    imageArea.innerHTML = '';
    if (hasImage) {
      var img = document.createElement('img');
      img.src = currentImages.pt;
      img.alt = '상품 이미지';
      imageArea.appendChild(img);
      imageArea.style.display = 'block';
    } else {
      imageArea.style.display = 'none';
    }
  }

  renderCustomTextsOnCanvas();

  // 글씨체 적용
  applyFontToCanvas(canvas, fontKey);

  // Price
  var originalPriceEl = canvas.querySelector('.pt-original-price');
  if (originalPrice) {
    originalPriceEl.textContent = formatPrice(originalPrice) + '원';
    originalPriceEl.style.display = 'block';
  } else {
    originalPriceEl.textContent = '';
    originalPriceEl.style.display = 'none';
  }

  // 할인율 표시 (숫자 → XX% 형식)
  var discountBadge = canvas.querySelector('.pt-discount-badge');
  var discountNum = parseFloat(discount);
  if (!isNaN(discountNum) && discountNum > 0) {
    discountBadge.textContent = discountNum + '%';
    discountBadge.style.display = 'inline-block';
  } else {
    discountBadge.textContent = '';
    discountBadge.style.display = 'none';
  }

  canvas.querySelector('.pt-price-number').textContent = price ? formatPrice(price) : '0';
  canvas.querySelector('.pt-unit').textContent = '/ ' + unit;
}

/* ========================================
   글씨체 적용
======================================== */
function applyFontToCanvas(canvas, fontKey) {
  var fontFamily = FONT_MAP[fontKey] || '';
  var elements = canvas.querySelectorAll('.pt-product-name, .pt-price-number, .pt-subtitle-area, .pt-custom-text-line');
  if (fontKey) {
    elements.forEach(function(el) {
      el.style.fontFamily = fontFamily;
    });
  } else {
    elements.forEach(function(el) {
      el.style.fontFamily = '';
    });
  }
}

/* ========================================
   다운로드 / 인쇄
======================================== */
function downloadCanvas(canvasId, filenamePrefix) {
  var el = document.getElementById(canvasId);
  if (!el) return;
  var scale = 2;
  var sizeSelect = document.getElementById('pt-size');
  if (sizeSelect && (sizeSelect.value === 'a3' || sizeSelect.value === 'b4')) scale = 3;

  var btn = document.getElementById('pt-download-btn');
  var originalText = btn.textContent;
  btn.textContent = '생성 중...';
  btn.disabled = true;

  html2canvas(el, { scale: scale, useCORS: true, backgroundColor: null, logging: false })
    .then(function(c) {
      var link = document.createElement('a');
      var now = new Date();
      var ts = now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0');
      link.download = filenamePrefix + '_' + ts + '.png';
      link.href = c.toDataURL('image/png');
      link.click();
    })
    .catch(function() { alert('이미지 생성에 실패했습니다.'); })
    .finally(function() { btn.textContent = originalText; btn.disabled = false; });
}

function printCanvas(canvasId) {
  var el = document.getElementById(canvasId);
  if (!el) return;
  el.classList.add('print-target');
  window.print();
  el.classList.remove('print-target');
}

/* ========================================
   이미지 업로드 / Google 검색
======================================== */
var currentImages = { pt: null };

function initImageFeatures() {
  document.getElementById('pt-image-upload').addEventListener('change', function(e) { handleFileUpload(e, 'pt'); });
  document.getElementById('pt-image-remove-btn').addEventListener('click', function() { removeImage('pt'); });
  document.getElementById('pt-image-search-btn').addEventListener('click', openGoogleImageSearch);
}

function handleFileUpload(e, target) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) { setImage(target, ev.target.result); };
  reader.readAsDataURL(file);
}

function setImage(target, dataUrl) {
  if (!isSafeImageSrc(dataUrl)) return;
  currentImages[target] = dataUrl;
  var preview = document.getElementById(target + '-image-preview');
  preview.innerHTML = '';
  var img = document.createElement('img');
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
  triggerRender();
}

function triggerRender() {
  if (ptFields && ptCanvas) renderPriceTag(ptFields, ptCanvas);
}

function openGoogleImageSearch() {
  var product = document.getElementById('pt-product').value || '정육점 고기';
  window.open('https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(product + ' 정육점'), '_blank');
}

/* ========================================
   확대/축소
======================================== */
var currentZoom = 100;

function initZoom() {
  document.getElementById('zoom-in-btn').addEventListener('click', function() { setZoom(currentZoom + 20); });
  document.getElementById('zoom-out-btn').addEventListener('click', function() { setZoom(currentZoom - 20); });
  document.getElementById('zoom-reset-btn').addEventListener('click', function() { setZoom(100); });
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
   텍스트 추가
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
  customTexts.push({ text: text, size: document.getElementById('pt-text-size').value, color: document.getElementById('pt-text-color').value });
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
  if (!customTexts.length) { container.innerHTML = ''; return; }
  container.innerHTML = customTexts.map(function(item, i) {
    return '<div class="custom-text-item"><span class="text-color-dot" style="background:' + escapeAttr(item.color) + '"></span><span class="text-preview">' + escapeHtml(item.text) + ' (' + item.size + 'px)</span><button class="btn-remove-text" data-index="' + i + '">x</button></div>';
  }).join('');
  container.querySelectorAll('.btn-remove-text').forEach(function(btn) {
    btn.addEventListener('click', function() { removeCustomText(parseInt(btn.dataset.index)); });
  });
}

function renderCustomTextsOnCanvas() {
  var area = document.querySelector('#pt-canvas .pt-custom-texts');
  if (!area) return;
  if (!customTexts.length) { area.innerHTML = ''; area.style.display = 'none'; return; }
  area.style.display = 'block';
  area.innerHTML = customTexts.map(function(item) {
    return '<div class="pt-custom-text-line" style="font-size:' + item.size + 'px;color:' + escapeAttr(item.color) + '">' + escapeHtml(item.text) + '</div>';
  }).join('');
}

/* ========================================
   품목 저장/불러오기/수정/삭제
======================================== */
var STORAGE_KEY_PRODUCTS = 'butcher-saved-products';
var editingProductId = null;

function initProductStorage() {
  document.getElementById('pt-save-btn').addEventListener('click', saveCurrentProduct);
  document.getElementById('new-product-btn').addEventListener('click', function() {
    editingProductId = null;
    clearForm();
    document.getElementById('editor-title').textContent = '새 품목 만들기';
    showEditor();
  });
  document.getElementById('back-to-list-btn').addEventListener('click', function() {
    showList();
  });
}

function getProducts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_PRODUCTS) || '[]'); }
  catch(e) { return []; }
}

function saveProducts(arr) {
  try { localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(arr)); }
  catch(e) { alert('저장 공간이 부족합니다.'); }
}

function saveCurrentProduct() {
  var name = document.getElementById('pt-product').value.trim();
  if (!name) { alert('상품명을 입력해주세요.'); return; }

  var data = {
    template: document.getElementById('pt-template').value,
    orientation: document.getElementById('pt-orientation').value,
    font: document.getElementById('pt-font').value,
    category: document.getElementById('pt-category').value,
    product: name,
    origin: document.getElementById('pt-origin').value,
    grade: document.getElementById('pt-grade').value,
    price: document.getElementById('pt-price').value,
    unit: document.getElementById('pt-unit').value,
    originalPrice: document.getElementById('pt-original-price').value,
    discount: document.getElementById('pt-discount').value,
    subtitle: document.getElementById('pt-subtitle').value,
    badge: document.getElementById('pt-badge').value,
    size: document.getElementById('pt-size').value,
    image: currentImages.pt || null,
    customTexts: customTexts.slice(),
  };

  var products = getProducts();
  if (editingProductId !== null) {
    var idx = products.findIndex(function(p) { return p.id === editingProductId; });
    if (idx >= 0) {
      data.id = editingProductId;
      products[idx] = data;
    }
  } else {
    data.id = Date.now();
    products.push(data);
  }

  saveProducts(products);
  renderSavedProductsList();
  alert('저장되었습니다!');
}

function loadProduct(id) {
  var products = getProducts();
  var p = products.find(function(item) { return item.id === id; });
  if (!p) return;

  editingProductId = p.id;
  document.getElementById('pt-template').value = p.template || 'classic-red';
  document.getElementById('pt-orientation').value = p.orientation || 'portrait';
  document.getElementById('pt-font').value = p.font || '';
  document.getElementById('pt-category').value = p.category || 'beef';
  document.getElementById('pt-product').value = p.product || '';
  document.getElementById('pt-origin').value = p.origin || '';
  document.getElementById('pt-grade').value = p.grade || '';
  document.getElementById('pt-price').value = p.price || '';
  document.getElementById('pt-unit').value = p.unit || '100g';
  document.getElementById('pt-original-price').value = p.originalPrice || '';
  document.getElementById('pt-discount').value = p.discount || '';
  document.getElementById('pt-subtitle').value = p.subtitle || '';
  document.getElementById('pt-badge').value = p.badge || '';
  document.getElementById('pt-size').value = p.size || 'a4';

  if (p.image && isSafeImageSrc(p.image)) {
    currentImages.pt = p.image;
    var preview = document.getElementById('pt-image-preview');
    preview.innerHTML = '';
    var img = document.createElement('img');
    img.src = p.image;
    img.alt = '미리보기';
    preview.appendChild(img);
    document.getElementById('pt-image-remove-btn').style.display = 'inline-block';
  } else {
    currentImages.pt = null;
    document.getElementById('pt-image-preview').innerHTML = '';
    document.getElementById('pt-image-remove-btn').style.display = 'none';
  }

  customTexts = (p.customTexts || []).slice();
  renderCustomTextList();

  document.getElementById('editor-title').textContent = '품목 수정: ' + p.product;
  showEditor();
  triggerRender();
}

function deleteProduct(id) {
  if (!confirm('이 품목을 삭제하시겠습니까?')) return;
  var products = getProducts().filter(function(p) { return p.id !== id; });
  saveProducts(products);
  renderSavedProductsList();
}

function clearForm() {
  document.getElementById('pt-template').value = 'classic-red';
  document.getElementById('pt-orientation').value = 'portrait';
  document.getElementById('pt-font').value = '';
  document.getElementById('pt-category').value = 'beef';
  document.getElementById('pt-product').value = '';
  document.getElementById('pt-origin').value = '';
  document.getElementById('pt-grade').value = '';
  document.getElementById('pt-price').value = '';
  document.getElementById('pt-unit').value = '100g';
  document.getElementById('pt-original-price').value = '';
  document.getElementById('pt-discount').value = '';
  document.getElementById('pt-subtitle').value = '';
  document.getElementById('pt-badge').value = '';
  document.getElementById('pt-size').value = 'a4';
  currentImages.pt = null;
  document.getElementById('pt-image-preview').innerHTML = '';
  document.getElementById('pt-image-remove-btn').style.display = 'none';
  document.getElementById('pt-image-upload').value = '';
  customTexts = [];
  renderCustomTextList();
  triggerRender();
}

function showEditor() {
  document.getElementById('editor-section').style.display = '';
  document.getElementById('slide-section').style.display = 'none';
}

function showList() {
  document.getElementById('editor-section').style.display = 'none';
  document.getElementById('slide-section').style.display = 'none';
}

function renderSavedProductsList() {
  var products = getProducts();
  var container = document.getElementById('saved-products-list');
  var slideBtn = document.getElementById('slide-view-btn');

  if (!products.length) {
    container.innerHTML = '<div class="no-products-msg">저장된 품목이 없습니다. "새 품목 만들기"를 눌러 시작하세요.</div>';
    slideBtn.style.display = 'none';
    return;
  }

  slideBtn.style.display = '';

  container.innerHTML = products.map(function(p) {
    var color = TEMPLATE_COLORS[p.template] || '#999';
    var cat = CATEGORY_MAP[p.category] || CATEGORY_MAP.other;
    return '<div class="saved-product-card" data-id="' + p.id + '">' +
      '<button class="card-delete" data-id="' + p.id + '">x</button>' +
      '<div class="card-name"><span class="card-template-dot" style="background:' + color + '"></span>' + escapeHtml(p.product || '상품명') + '</div>' +
      '<div class="card-info">' + escapeHtml(cat.label) + ' | ' + escapeHtml(p.origin || '-') + '</div>' +
      '<div class="card-price">' + (p.price ? formatPrice(p.price) + '원' : '-') + '</div>' +
      '</div>';
  }).join('');

  container.querySelectorAll('.saved-product-card').forEach(function(card) {
    card.addEventListener('click', function(e) {
      if (e.target.classList.contains('card-delete')) return;
      loadProduct(parseInt(card.dataset.id));
    });
  });

  container.querySelectorAll('.card-delete').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      deleteProduct(parseInt(btn.dataset.id));
    });
  });
}

/* ========================================
   슬라이드 뷰 / 일괄 인쇄
======================================== */
var currentSlide = 0;

function initSlideView() {
  document.getElementById('slide-view-btn').addEventListener('click', openSlideView);
  document.getElementById('slide-close-btn').addEventListener('click', function() {
    document.getElementById('slide-section').style.display = 'none';
  });
  document.getElementById('slide-prev-btn').addEventListener('click', function() { navigateSlide(-1); });
  document.getElementById('slide-next-btn').addEventListener('click', function() { navigateSlide(1); });
  document.getElementById('slide-print-all-btn').addEventListener('click', printAllProducts);
}

function openSlideView() {
  var products = getProducts();
  if (!products.length) return;
  currentSlide = 0;
  document.getElementById('editor-section').style.display = 'none';
  document.getElementById('slide-section').style.display = '';
  renderSlide(products, 0);
}

function navigateSlide(dir) {
  var products = getProducts();
  if (!products.length) return;
  currentSlide += dir;
  if (currentSlide < 0) currentSlide = products.length - 1;
  if (currentSlide >= products.length) currentSlide = 0;
  renderSlide(products, currentSlide);
}

function renderSlide(products, index) {
  var area = document.getElementById('slide-canvas-area');
  area.innerHTML = '';
  var p = products[index];
  area.appendChild(buildCanvasFromData(p));
  document.getElementById('slide-counter').textContent = (index + 1) + ' / ' + products.length;
}

function buildCanvasFromData(p) {
  var isLandscape = p.orientation === 'landscape';
  var fontKey = p.font || '';
  var cat = CATEGORY_MAP[p.category] || CATEGORY_MAP.other;
  var hasImage = p.image && isSafeImageSrc(p.image);

  var canvas = document.createElement('div');
  canvas.className = 'price-tag-canvas ' + (p.template || 'classic-red') + (isLandscape ? ' landscape' : '');

  var badgeHtml = '';
  if (p.badge && BADGE_MAP[p.badge]) {
    var b = BADGE_MAP[p.badge];
    badgeHtml = '<span class="badge ' + b.cls + '">' + b.text + '</span>';
  }

  var bodyContent = '';
  if (isLandscape && hasImage) {
    bodyContent = '<div class="pt-image-area" style="display:block"><img src="' + escapeAttr(p.image) + '" alt="상품 이미지"></div>' +
      '<div class="pt-body-right">' +
        '<div class="pt-product-name">' + escapeHtml(p.product || '상품명') + '</div>' +
        (p.origin ? '<div class="pt-origin">원산지: ' + escapeHtml(p.origin) + '</div>' : '') +
        (p.grade ? '<div class="pt-grade-area"><span class="pt-grade">' + escapeHtml(p.grade) + '</span></div>' : '') +
        (p.subtitle ? '<div class="pt-subtitle-area" style="display:block">' + escapeHtml(p.subtitle) + '</div>' : '') +
      '</div>';
  } else {
    bodyContent = '<div class="pt-product-name">' + escapeHtml(p.product || '상품명') + '</div>' +
      (p.origin ? '<div class="pt-origin">원산지: ' + escapeHtml(p.origin) + '</div>' : '') +
      (p.grade ? '<div class="pt-grade-area"><span class="pt-grade">' + escapeHtml(p.grade) + '</span></div>' : '') +
      (p.subtitle ? '<div class="pt-subtitle-area" style="display:block">' + escapeHtml(p.subtitle) + '</div>' : '') +
      (hasImage ? '<div class="pt-image-area" style="display:block"><img src="' + escapeAttr(p.image) + '" alt="상품 이미지"></div>' : '');
  }

  var textsHtml = '';
  if (p.customTexts && p.customTexts.length) {
    textsHtml = '<div class="pt-custom-texts" style="display:block">' + p.customTexts.map(function(t) {
      return '<div class="pt-custom-text-line" style="font-size:' + t.size + 'px;color:' + escapeAttr(t.color) + '">' + escapeHtml(t.text) + '</div>';
    }).join('') + '</div>';
  }

  // 할인율 표시 (숫자 → XX%)
  var discountNum = parseFloat(p.discount);
  var discountDisplay = (!isNaN(discountNum) && discountNum > 0) ? discountNum + '%' : '';

  canvas.innerHTML = '<div class="pt-badge-area">' + badgeHtml + '</div>' +
    '<div class="pt-header"><span class="pt-category-icon">' + cat.icon + '</span><span class="pt-category-label">' + escapeHtml(cat.label) + '</span></div>' +
    '<div class="pt-body">' + bodyContent + textsHtml + '</div>' +
    '<div class="pt-price-area">' +
      (p.originalPrice ? '<div class="pt-original-price" style="display:block">' + formatPrice(p.originalPrice) + '원</div>' : '') +
      (discountDisplay ? '<div class="pt-discount-badge" style="display:inline-block">' + escapeHtml(discountDisplay) + '</div>' : '') +
      '<div class="pt-price"><span class="pt-price-number">' + (p.price ? formatPrice(p.price) : '0') + '</span><span class="pt-price-won">원</span></div>' +
      '<div class="pt-unit">/ ' + escapeHtml(p.unit || '100g') + '</div>' +
    '</div>' +
    '<div class="pt-footer"><span>신선한 고기, 정직한 가격</span></div>';

  // 글씨체 적용
  applyFontToCanvas(canvas, fontKey);

  return canvas;
}

function printAllProducts() {
  var products = getProducts();
  if (!products.length) return;

  var area = document.getElementById('print-all-area');
  area.innerHTML = '';

  products.forEach(function(p) {
    var page = document.createElement('div');
    page.className = 'print-page';
    page.appendChild(buildCanvasFromData(p));
    area.appendChild(page);
  });

  area.classList.add('printing');
  window.print();
  area.classList.remove('printing');
}
