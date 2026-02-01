/**
 * 정육점 POP 가격표 & 광고 포스터 생성기 - 자동 테스트
 *
 * Jest + JSDOM 환경에서 브라우저용 app.js를 테스트합니다.
 * app.js 자체는 수정하지 않고, JSDOM으로 브라우저 환경을 시뮬레이션합니다.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// ── 소스 파일 로드 ──
const indexHtml = fs.readFileSync(
  path.resolve(__dirname, '../index.html'),
  'utf8'
);
const appJsContent = fs.readFileSync(
  path.resolve(__dirname, '../js/app.js'),
  'utf8'
);

// 외부 CDN 스크립트와 로컬 스크립트 태그 제거 (JSDOM에서 로드 불가)
const cleanHtml = indexHtml
  .replace(/<script[^>]*src="https?:\/\/[^"]*"[^>]*><\/script>/g, '')
  .replace(/<script[^>]*src="js\/app\.js"[^>]*><\/script>/g, '');

/**
 * 테스트용 JSDOM 환경을 생성합니다.
 * - HTML을 파싱하여 DOM 구성
 * - html2canvas, window.print, alert 등 외부 의존성 모킹
 * - app.js를 스크립트 태그로 삽입하여 실행
 * - const/let 변수를 window.__test__로 노출
 */
function createTestEnv() {
  const dom = new JSDOM(cleanHtml, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost',
  });

  // html2canvas 모킹 (CDN 외부 라이브러리)
  dom.window.eval(
    "window.html2canvas = function() { " +
    "  return Promise.resolve({ toDataURL: function() { return 'data:image/png;base64,mock'; } }); " +
    "};"
  );

  // window.print / alert 모킹
  dom.window.print = jest.fn();
  dom.window.alert = jest.fn();

  // app.js 삽입 및 실행
  const script = dom.window.document.createElement('script');
  script.textContent = appJsContent;
  dom.window.document.body.appendChild(script);

  // const/let 으로 선언된 모듈-레벨 변수를 테스트에서 접근 가능하도록 노출
  const exposeScript = dom.window.document.createElement('script');
  exposeScript.textContent = [
    "window.__test__ = {",
    "  CATEGORY_MAP: typeof CATEGORY_MAP !== 'undefined' ? CATEGORY_MAP : null,",
    "  BADGE_MAP: typeof BADGE_MAP !== 'undefined' ? BADGE_MAP : null,",
    "  currentImages: typeof currentImages !== 'undefined' ? currentImages : null,",
    "  STORAGE_KEY_IMAGES: typeof STORAGE_KEY_IMAGES !== 'undefined' ? STORAGE_KEY_IMAGES : null,",
    "  STORAGE_KEY_API: typeof STORAGE_KEY_API !== 'undefined' ? STORAGE_KEY_API : null,",
    "};",
  ].join('\n');
  dom.window.document.body.appendChild(exposeScript);

  return dom;
}

/* ========================================
   1. formatPrice 테스트
======================================== */
describe('formatPrice', () => {
  let dom;

  beforeEach(() => {
    dom = createTestEnv();
  });

  afterEach(() => {
    dom.window.close();
  });

  test('정상 숫자를 천 단위 콤마로 포맷팅한다', () => {
    expect(dom.window.formatPrice(45000)).toBe('45,000');
    expect(dom.window.formatPrice(1000000)).toBe('1,000,000');
    expect(dom.window.formatPrice(500)).toBe('500');
  });

  test('0은 문자열 "0"을 반환한다', () => {
    expect(dom.window.formatPrice(0)).toBe('0');
  });

  test('빈 값(null, undefined, "")은 빈 문자열을 반환한다', () => {
    expect(dom.window.formatPrice('')).toBe('');
    expect(dom.window.formatPrice(null)).toBe('');
    expect(dom.window.formatPrice(undefined)).toBe('');
  });

  test('음수는 "0"을 반환한다 (가격에 음수 불허)', () => {
    expect(dom.window.formatPrice(-1000)).toBe('0');
    expect(dom.window.formatPrice(-50)).toBe('0');
  });
});

/* ========================================
   2. escapeHtml 테스트
======================================== */
describe('escapeHtml', () => {
  let dom;

  beforeEach(() => {
    dom = createTestEnv();
  });

  afterEach(() => {
    dom.window.close();
  });

  test('일반 텍스트는 변경 없이 그대로 반환한다', () => {
    expect(dom.window.escapeHtml('Hello World')).toBe('Hello World');
    expect(dom.window.escapeHtml('한글 텍스트')).toBe('한글 텍스트');
    expect(dom.window.escapeHtml('12345')).toBe('12345');
  });

  test('HTML 태그를 이스케이프한다', () => {
    expect(dom.window.escapeHtml('<script>alert(1)</script>'))
      .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(dom.window.escapeHtml('<div class="x">test</div>'))
      .toBe('&lt;div class="x"&gt;test&lt;/div&gt;');
  });

  test('특수문자 &를 이스케이프한다', () => {
    expect(dom.window.escapeHtml('a & b')).toBe('a &amp; b');
    expect(dom.window.escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });
});

/* ========================================
   3. CATEGORY_MAP 테스트
======================================== */
describe('CATEGORY_MAP', () => {
  let dom;

  beforeEach(() => {
    dom = createTestEnv();
  });

  afterEach(() => {
    dom.window.close();
  });

  test('모든 카테고리 키가 존재한다', () => {
    const map = dom.window.__test__.CATEGORY_MAP;
    expect(map).not.toBeNull();

    const expectedKeys = ['beef', 'pork', 'chicken', 'lamb', 'duck', 'other'];
    expectedKeys.forEach(key => {
      expect(map).toHaveProperty(key);
    });
  });

  test('각 카테고리에 icon과 label 속성이 있다', () => {
    const map = dom.window.__test__.CATEGORY_MAP;
    Object.entries(map).forEach(([key, value]) => {
      expect(value).toHaveProperty('icon');
      expect(value).toHaveProperty('label');
      expect(typeof value.icon).toBe('string');
      expect(typeof value.label).toBe('string');
      expect(value.icon.length).toBeGreaterThan(0);
      expect(value.label.length).toBeGreaterThan(0);
    });
  });

  test('카테고리 label이 올바르다', () => {
    const map = dom.window.__test__.CATEGORY_MAP;
    expect(map.beef.label).toBe('소고기');
    expect(map.pork.label).toBe('돼지고기');
    expect(map.chicken.label).toBe('닭고기');
    expect(map.lamb.label).toBe('양고기');
    expect(map.duck.label).toBe('오리고기');
    expect(map.other.label).toBe('기타');
  });
});

/* ========================================
   4. BADGE_MAP 테스트
======================================== */
describe('BADGE_MAP', () => {
  let dom;

  beforeEach(() => {
    dom = createTestEnv();
  });

  afterEach(() => {
    dom.window.close();
  });

  test('모든 뱃지 키가 존재한다', () => {
    const map = dom.window.__test__.BADGE_MAP;
    expect(map).not.toBeNull();

    const expectedKeys = ['best', 'new', 'hot', 'sale', 'recommend', 'limited', 'today'];
    expectedKeys.forEach(key => {
      expect(map).toHaveProperty(key);
    });
  });

  test('각 뱃지에 text와 cls 속성이 있다', () => {
    const map = dom.window.__test__.BADGE_MAP;
    Object.entries(map).forEach(([key, value]) => {
      expect(value).toHaveProperty('text');
      expect(value).toHaveProperty('cls');
      expect(typeof value.text).toBe('string');
      expect(typeof value.cls).toBe('string');
      expect(value.text.length).toBeGreaterThan(0);
      expect(value.cls.length).toBeGreaterThan(0);
    });
  });

  test('뱃지 text가 올바르다', () => {
    const map = dom.window.__test__.BADGE_MAP;
    expect(map.best.text).toBe('BEST');
    expect(map.new.text).toBe('NEW');
    expect(map.hot.text).toBe('HOT');
    expect(map.sale.text).toBe('SALE');
    expect(map.recommend.text).toBe('추천');
    expect(map.limited.text).toBe('한정');
    expect(map.today.text).toBe('오늘특가');
  });
});

/* ========================================
   5. DOM 테스트: initTabs
======================================== */
describe('initTabs - 탭 전환', () => {
  let dom, doc;

  beforeEach(() => {
    dom = createTestEnv();
    doc = dom.window.document;
    dom.window.initTabs();
  });

  afterEach(() => {
    dom.window.close();
  });

  test('초기 상태에서 첫 번째 탭이 활성화되어 있다', () => {
    const tabs = doc.querySelectorAll('.tab-btn');
    const contents = doc.querySelectorAll('.tab-content');

    expect(tabs[0].classList.contains('active')).toBe(true);
    expect(contents[0].classList.contains('active')).toBe(true);
  });

  test('두 번째 탭 클릭 시 탭과 콘텐츠가 전환된다', () => {
    const tabs = doc.querySelectorAll('.tab-btn');
    const contents = doc.querySelectorAll('.tab-content');

    // 두 번째 탭(광고 포스터) 클릭
    tabs[1].click();

    expect(tabs[0].classList.contains('active')).toBe(false);
    expect(tabs[1].classList.contains('active')).toBe(true);
    expect(contents[0].classList.contains('active')).toBe(false);
    expect(contents[1].classList.contains('active')).toBe(true);
  });

  test('다시 첫 번째 탭으로 돌아올 수 있다', () => {
    const tabs = doc.querySelectorAll('.tab-btn');
    const contents = doc.querySelectorAll('.tab-content');

    // 두 번째 탭 -> 첫 번째 탭
    tabs[1].click();
    tabs[0].click();

    expect(tabs[0].classList.contains('active')).toBe(true);
    expect(tabs[1].classList.contains('active')).toBe(false);
    expect(contents[0].classList.contains('active')).toBe(true);
    expect(contents[1].classList.contains('active')).toBe(false);
  });
});

/* ========================================
   6. DOM 테스트: renderPriceTag
======================================== */
describe('renderPriceTag - 가격표 캔버스 업데이트', () => {
  let dom, doc;

  beforeEach(() => {
    dom = createTestEnv();
    doc = dom.window.document;
  });

  afterEach(() => {
    dom.window.close();
  });

  function getFields() {
    const $ = id => doc.getElementById(id);
    return {
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
  }

  test('상품명이 캔버스에 올바르게 표시된다', () => {
    const fields = getFields();
    const canvas = doc.getElementById('pt-canvas');

    fields.product.value = '한우 1++ 등심';
    dom.window.renderPriceTag(fields, canvas);

    expect(canvas.querySelector('.pt-product-name').textContent).toBe('한우 1++ 등심');
  });

  test('가격이 천 단위 콤마로 포맷팅되어 표시된다', () => {
    const fields = getFields();
    const canvas = doc.getElementById('pt-canvas');

    fields.price.value = '45000';
    dom.window.renderPriceTag(fields, canvas);

    expect(canvas.querySelector('.pt-price-number').textContent).toBe('45,000');
  });

  test('카테고리 선택에 따라 아이콘과 라벨이 변경된다', () => {
    const fields = getFields();
    const canvas = doc.getElementById('pt-canvas');

    fields.category.value = 'pork';
    dom.window.renderPriceTag(fields, canvas);

    expect(canvas.querySelector('.pt-category-icon').textContent).toBe('\uD83D\uDC37');
    expect(canvas.querySelector('.pt-category-label').textContent).toBe('돼지고기');
  });

  test('뱃지를 설정하면 뱃지 영역에 표시된다', () => {
    const fields = getFields();
    const canvas = doc.getElementById('pt-canvas');

    fields.badge.value = 'best';
    dom.window.renderPriceTag(fields, canvas);

    const badgeArea = canvas.querySelector('.pt-badge-area');
    expect(badgeArea.innerHTML).toContain('BEST');
    expect(badgeArea.innerHTML).toContain('badge-best');
  });

  test('뱃지를 해제하면 뱃지 영역이 비어있다', () => {
    const fields = getFields();
    const canvas = doc.getElementById('pt-canvas');

    fields.badge.value = '';
    dom.window.renderPriceTag(fields, canvas);

    const badgeArea = canvas.querySelector('.pt-badge-area');
    expect(badgeArea.innerHTML).toBe('');
  });

  test('템플릿 변경 시 캔버스 클래스가 변경된다', () => {
    const fields = getFields();
    const canvas = doc.getElementById('pt-canvas');

    fields.template.value = 'premium-black';
    dom.window.renderPriceTag(fields, canvas);

    expect(canvas.className).toBe('price-tag-canvas premium-black');
  });

  test('원산지가 있으면 표시되고, 없으면 숨겨진다', () => {
    const fields = getFields();
    const canvas = doc.getElementById('pt-canvas');

    // 원산지 있을 때
    fields.origin.value = '국내산 (한우)';
    dom.window.renderPriceTag(fields, canvas);
    const originEl = canvas.querySelector('.pt-origin');
    expect(originEl.textContent).toBe('원산지: 국내산 (한우)');
    expect(originEl.style.display).toBe('block');

    // 원산지 없을 때
    fields.origin.value = '';
    dom.window.renderPriceTag(fields, canvas);
    expect(originEl.textContent).toBe('');
    expect(originEl.style.display).toBe('none');
  });
});

/* ========================================
   7. DOM 테스트: renderPoster
======================================== */
describe('renderPoster - 광고 포스터 렌더링', () => {
  let dom, doc;

  beforeEach(() => {
    dom = createTestEnv();
    doc = dom.window.document;
  });

  afterEach(() => {
    dom.window.close();
  });

  function getFields() {
    const $ = id => doc.getElementById(id);
    return {
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
  }

  test('상품 목록이 정확히 렌더링된다', () => {
    const fields = getFields();
    const canvas = doc.getElementById('ps-canvas');

    // 상품 입력
    const rows = doc.querySelectorAll('#ps-products-list .ps-product-row');
    rows[0].querySelector('.ps-item-name').value = '한우 등심';
    rows[0].querySelector('.ps-item-price').value = '45,000원';
    rows[1].querySelector('.ps-item-name').value = '삼겹살';
    rows[1].querySelector('.ps-item-price').value = '15,000원';
    // 세 번째 행은 비워둠
    rows[2].querySelector('.ps-item-name').value = '';
    rows[2].querySelector('.ps-item-price').value = '';

    dom.window.renderPoster(fields, canvas);

    const productItems = canvas.querySelectorAll('.ps-product-item');
    expect(productItems.length).toBe(2);
    expect(productItems[0].querySelector('.ps-product-name').textContent).toBe('한우 등심');
    expect(productItems[0].querySelector('.ps-product-price').textContent).toBe('45,000원');
    expect(productItems[1].querySelector('.ps-product-name').textContent).toBe('삼겹살');
    expect(productItems[1].querySelector('.ps-product-price').textContent).toBe('15,000원');
  });

  test('매장명과 메인 제목이 올바르게 표시된다', () => {
    const fields = getFields();
    const canvas = doc.getElementById('ps-canvas');

    fields.shopName.value = '행복한 정육점';
    fields.title.value = '설 명절 대할인!';

    dom.window.renderPoster(fields, canvas);

    expect(canvas.querySelector('.ps-top-banner span').textContent).toBe('행복한 정육점');
    expect(canvas.querySelector('.ps-main-title').textContent).toBe('설 명절 대할인!');
  });

  test('빈 상품 목록이면 상품 영역이 렌더링되지 않는다', () => {
    const fields = getFields();
    const canvas = doc.getElementById('ps-canvas');

    // 모든 상품 입력 비우기
    const rows = doc.querySelectorAll('#ps-products-list .ps-product-row');
    rows.forEach(row => {
      row.querySelector('.ps-item-name').value = '';
      row.querySelector('.ps-item-price').value = '';
    });

    dom.window.renderPoster(fields, canvas);

    // 팀C 변경: 빈 상품 목록 시 안내 문구 표시
    const list = canvas.querySelector('.ps-product-list');
    expect(list).not.toBeNull();
    expect(list.classList.contains('ps-empty-notice')).toBe(true);
  });

  test('연락처(전화번호, 주소)가 올바르게 표시된다', () => {
    const fields = getFields();
    const canvas = doc.getElementById('ps-canvas');

    fields.phone.value = '02-1234-5678';
    fields.address.value = '서울시 강남구 역삼동 123';

    dom.window.renderPoster(fields, canvas);

    expect(canvas.querySelector('.ps-phone').textContent).toContain('02-1234-5678');
    expect(canvas.querySelector('.ps-address').textContent).toContain('서울시 강남구 역삼동 123');
  });

  test('부제목과 행사 기간이 있으면 표시된다', () => {
    const fields = getFields();
    const canvas = doc.getElementById('ps-canvas');

    fields.subtitle.value = '최대 50% 할인';
    fields.period.value = '2026.01.25 ~ 02.05';

    dom.window.renderPoster(fields, canvas);

    expect(canvas.querySelector('.ps-sub-title').textContent).toBe('최대 50% 할인');
    expect(canvas.querySelector('.ps-period').textContent).toContain('2026.01.25 ~ 02.05');
  });

  test('HTML 특수문자가 포함된 입력이 이스케이프된다', () => {
    const fields = getFields();
    const canvas = doc.getElementById('ps-canvas');

    fields.shopName.value = '<script>alert(1)</script>';
    dom.window.renderPoster(fields, canvas);

    const bannerHtml = canvas.querySelector('.ps-top-banner').innerHTML;
    expect(bannerHtml).not.toContain('<script>');
    expect(bannerHtml).toContain('&lt;script&gt;');
  });
});

/* ========================================
   8. localStorage 테스트: saveImageToStorage / loadSavedImages
======================================== */
describe('localStorage - saveImageToStorage / loadSavedImages', () => {
  let dom, doc;

  beforeEach(() => {
    dom = createTestEnv();
    doc = dom.window.document;
    dom.window.localStorage.clear();
  });

  afterEach(() => {
    dom.window.close();
  });

  test('이미지를 저장하면 localStorage에 데이터가 존재한다', () => {
    dom.window.saveImageToStorage('pt', 'data:image/png;base64,abc123', 'test.png');

    const storageKey = dom.window.__test__.STORAGE_KEY_IMAGES;
    const saved = JSON.parse(dom.window.localStorage.getItem(storageKey));

    expect(saved).toBeDefined();
    expect(saved.pt).toBeDefined();
    expect(saved.pt.length).toBe(1);
    expect(saved.pt[0].name).toBe('test.png');
    expect(saved.pt[0].data).toBe('data:image/png;base64,abc123');
  });

  test('같은 이름으로 저장하면 덮어쓰기된다', () => {
    dom.window.saveImageToStorage('pt', 'data:old', 'same-name.png');
    dom.window.saveImageToStorage('pt', 'data:new', 'same-name.png');

    const storageKey = dom.window.__test__.STORAGE_KEY_IMAGES;
    const saved = JSON.parse(dom.window.localStorage.getItem(storageKey));

    expect(saved.pt.length).toBe(1);
    expect(saved.pt[0].data).toBe('data:new');
  });

  test('서로 다른 target(pt/ps)에 독립적으로 저장된다', () => {
    dom.window.saveImageToStorage('pt', 'data:pt-image', 'pt.png');
    dom.window.saveImageToStorage('ps', 'data:ps-image', 'ps.png');

    const storageKey = dom.window.__test__.STORAGE_KEY_IMAGES;
    const saved = JSON.parse(dom.window.localStorage.getItem(storageKey));

    expect(saved.pt.length).toBe(1);
    expect(saved.ps.length).toBe(1);
    expect(saved.pt[0].data).toBe('data:pt-image');
    expect(saved.ps[0].data).toBe('data:ps-image');
  });

  test('loadSavedImages가 저장된 이미지 썸네일을 DOM에 렌더링한다', () => {
    const storageKey = dom.window.__test__.STORAGE_KEY_IMAGES;
    const testData = {
      pt: [
        { name: 'img1.png', data: 'data:image/png;base64,aaa' },
        { name: 'img2.png', data: 'data:image/png;base64,bbb' },
      ],
    };
    dom.window.localStorage.setItem(storageKey, JSON.stringify(testData));

    dom.window.loadSavedImages();

    const container = doc.getElementById('pt-saved-images');
    const thumbs = container.querySelectorAll('.saved-thumb');
    expect(thumbs.length).toBe(2);
  });

  test('저장된 이미지가 없으면 컨테이너가 비어있다', () => {
    dom.window.loadSavedImages();

    const container = doc.getElementById('pt-saved-images');
    expect(container.innerHTML).toBe('');
  });
});

/* ========================================
   9. localStorage 테스트: 10개 초과 시 오래된 항목 삭제
======================================== */
describe('localStorage - 이미지 저장 개수 제한', () => {
  let dom;

  beforeEach(() => {
    dom = createTestEnv();
    dom.window.localStorage.clear();
  });

  afterEach(() => {
    dom.window.close();
  });

  test('10개까지는 모든 항목이 유지된다', () => {
    for (let i = 0; i < 10; i++) {
      dom.window.saveImageToStorage('pt', `data:${i}`, `file${i}.png`);
    }

    const storageKey = dom.window.__test__.STORAGE_KEY_IMAGES;
    const saved = JSON.parse(dom.window.localStorage.getItem(storageKey));

    expect(saved.pt.length).toBe(10);
  });

  test('11개 저장 시 가장 오래된 1개가 삭제된다', () => {
    for (let i = 0; i < 11; i++) {
      dom.window.saveImageToStorage('pt', `data:${i}`, `file${i}.png`);
    }

    const storageKey = dom.window.__test__.STORAGE_KEY_IMAGES;
    const saved = JSON.parse(dom.window.localStorage.getItem(storageKey));

    expect(saved.pt.length).toBe(10);
    // 가장 최근(file10)이 맨 앞에 위치
    expect(saved.pt[0].name).toBe('file10.png');
    // 가장 오래된 유지 항목(file1)이 맨 뒤에 위치 (file0은 삭제됨)
    expect(saved.pt[9].name).toBe('file1.png');
  });

  test('12개 저장 시 가장 오래된 2개가 삭제된다', () => {
    for (let i = 0; i < 12; i++) {
      dom.window.saveImageToStorage('pt', `data:${i}`, `file${i}.png`);
    }

    const storageKey = dom.window.__test__.STORAGE_KEY_IMAGES;
    const saved = JSON.parse(dom.window.localStorage.getItem(storageKey));

    expect(saved.pt.length).toBe(10);
    // 가장 최근(file11)이 맨 앞
    expect(saved.pt[0].name).toBe('file11.png');
    // file0, file1은 삭제되어 file2가 맨 뒤
    expect(saved.pt[9].name).toBe('file2.png');
  });
});
