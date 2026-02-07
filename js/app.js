/**
 * 인생 시계 & 인맥 장부 (Senior Life Manager)
 * 메인 애플리케이션 로직
 */

(function () {
  'use strict';

  // =========================================================================
  // 상수 (Constants)
  // =========================================================================
  const STORAGE_KEY = 'seniorLifeManager';
  const HEALTHY_LIFESPAN = 66;
  const NUDGE_DAYS = 30;

  const RELATIONSHIP_TYPES = [
    '가족', '친척', '친구', '직장동료', '이웃', '동창', '지인', '기타'
  ];

  const EVENT_TYPES = [
    { value: 'wedding', label: '결혼식', emoji: '💒' },
    { value: 'funeral', label: '장례식', emoji: '🕯️' },
    { value: 'birthday', label: '생일', emoji: '🎂' },
    { value: 'baek-il', label: '백일', emoji: '👶' },
    { value: 'dol', label: '돌잔치', emoji: '🎉' },
    { value: 'hwangap', label: '환갑/칠순', emoji: '🎊' },
    { value: 'housewarming', label: '집들이', emoji: '🏠' },
    { value: 'hospital', label: '병문안', emoji: '🏥' },
    { value: 'other', label: '기타', emoji: '📝' }
  ];

  const POSITIVE_MESSAGES = [
    '오늘 하루도 감사한 마음으로 시작해보세요.',
    '소중한 사람에게 안부 전화 한 통 어떠세요?',
    '건강한 하루를 위해 가벼운 산책은 어떨까요?',
    '좋은 사람들과의 시간이 인생을 풍요롭게 합니다.',
    '오늘의 작은 행복을 놓치지 마세요.',
    '당신의 경험과 지혜는 누군가에게 큰 힘이 됩니다.',
    '남은 시간이 아니라, 채우는 시간이 중요합니다.',
    '오늘도 당신은 충분히 멋진 사람입니다.',
    '작은 친절이 큰 행복을 만듭니다.',
    '매일이 새로운 시작입니다. 힘내세요!'
  ];

  // =========================================================================
  // 상태 관리 (State Management)
  // =========================================================================
  let state = {
    user: null,
    contacts: [],
    currentView: 'life-clock',
    selectedContactId: null,
    editingContactId: null
  };

  // =========================================================================
  // LocalStorage
  // =========================================================================
  function saveState() {
    try {
      const data = {
        user: state.user,
        contacts: state.contacts
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('저장 실패:', e);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        state.user = data.user || null;
        state.contacts = data.contacts || [];
      }
    } catch (e) {
      console.error('불러오기 실패:', e);
    }
  }

  // =========================================================================
  // 유틸리티 (Utilities)
  // =========================================================================
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  }

  function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return Math.floor((d2 - d1) / 86400000);
  }

  function getAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  function getRandomMessage() {
    return POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)];
  }

  function getEventTypeInfo(value) {
    return EVENT_TYPES.find(function (e) { return e.value === value; }) || { value: 'other', label: '기타', emoji: '📝' };
  }

  // =========================================================================
  // 뷰 라우팅 (View Routing)
  // =========================================================================
  function showView(viewName) {
    state.currentView = viewName;
    $$('.view').forEach(function (v) { v.classList.remove('active'); });
    var targetView = $('#view-' + viewName);
    if (targetView) targetView.classList.add('active');

    $$('.tab-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    switch (viewName) {
      case 'life-clock':
        renderLifeClock();
        break;
      case 'contacts':
        renderContacts();
        break;
      case 'settings':
        renderSettings();
        break;
    }
  }

  // =========================================================================
  // 온보딩 (Onboarding)
  // =========================================================================
  function showOnboarding() {
    $('#view-onboarding').classList.add('active');
    $('#bottom-nav').style.display = 'none';

    var form = $('#onboarding-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#input-name').value.trim();
      var birthDate = $('#input-birth').value;
      var gender = $('input[name="gender"]:checked');

      if (!name || !birthDate) {
        showToast('이름과 생년월일을 입력해주세요.');
        return;
      }

      state.user = {
        name: name,
        birthDate: birthDate,
        gender: gender ? gender.value : 'male'
      };
      saveState();

      $('#view-onboarding').classList.remove('active');
      $('#bottom-nav').style.display = '';
      $('#onboarding-title').textContent = '환영합니다!';
      $('#onboarding-submit').textContent = '시작하기';
      showView('life-clock');
    });
  }

  // =========================================================================
  // 인생 시계 (Life Clock)
  // =========================================================================
  function calculateLifeStats() {
    if (!state.user) return null;

    var birth = new Date(state.user.birthDate);
    var today = new Date();
    var age = getAge(state.user.birthDate);

    var lifespan = state.user.gender === 'female' ? 86 : 80;
    var healthyAge = HEALTHY_LIFESPAN;

    var totalYears = Math.max(0, lifespan - age);
    var totalMonths = Math.max(0, totalYears * 12);
    var totalWeeks = Math.max(0, totalYears * 52);
    var lifespanDate = new Date(birth.getFullYear() + lifespan, birth.getMonth(), birth.getDate());
    var totalDays = Math.max(0, Math.floor((lifespanDate - today) / 86400000));

    var healthyYears = Math.max(0, healthyAge - age);
    var healthyEndDate = new Date(birth.getFullYear() + healthyAge, birth.getMonth(), birth.getDate());
    var healthyDays = Math.max(0, Math.floor((healthyEndDate - today) / 86400000));

    var lifeProgress = Math.min(100, (age / lifespan) * 100);
    var healthyProgress = Math.min(100, (age / healthyAge) * 100);

    var livedDays = Math.floor((today - birth) / 86400000);

    return {
      age: age,
      lifespan: lifespan,
      healthyAge: healthyAge,
      totalYears: totalYears,
      totalMonths: totalMonths,
      totalWeeks: totalWeeks,
      totalDays: totalDays,
      healthyYears: healthyYears,
      healthyDays: healthyDays,
      lifeProgress: lifeProgress,
      healthyProgress: healthyProgress,
      livedDays: livedDays
    };
  }

  function renderLifeClock() {
    var stats = calculateLifeStats();
    if (!stats) return;

    var container = $('#life-clock-content');

    var radius = 120;
    var circumference = 2 * Math.PI * radius;
    var innerRadius = radius - 25;
    var innerCircumference = 2 * Math.PI * innerRadius;
    var lifeOffset = circumference * (1 - stats.lifeProgress / 100);
    var healthyOffset = innerCircumference * (1 - stats.healthyProgress / 100);

    var outerColor = stats.totalYears > 10 ? '#4CAF50' : stats.totalYears > 5 ? '#FF9800' : '#E74C3C';
    var innerColor = stats.healthyYears > 0 ? '#2196F3' : '#9E9E9E';

    container.innerHTML =
      '<div class="greeting-section">' +
        '<h2 class="greeting-name">' + state.user.name + '님의 인생 시계</h2>' +
        '<p class="greeting-age">만 ' + stats.age + '세 &middot; ' + stats.livedDays.toLocaleString() + '일째 인생</p>' +
      '</div>' +

      '<div class="clock-container">' +
        '<svg viewBox="0 0 300 300" class="life-clock-svg">' +
          '<circle cx="150" cy="150" r="' + radius + '" fill="none" stroke="#E8E0D8" stroke-width="18" />' +
          '<circle cx="150" cy="150" r="' + radius + '" fill="none" ' +
            'stroke="' + outerColor + '" stroke-width="18" ' +
            'stroke-dasharray="' + circumference + '" ' +
            'stroke-dashoffset="' + lifeOffset + '" ' +
            'stroke-linecap="round" ' +
            'transform="rotate(-90 150 150)" ' +
            'class="gauge-animated" />' +
          '<circle cx="150" cy="150" r="' + innerRadius + '" fill="none" stroke="#E8E0D8" stroke-width="10" />' +
          '<circle cx="150" cy="150" r="' + innerRadius + '" fill="none" ' +
            'stroke="' + innerColor + '" stroke-width="10" ' +
            'stroke-dasharray="' + innerCircumference + '" ' +
            'stroke-dashoffset="' + healthyOffset + '" ' +
            'stroke-linecap="round" ' +
            'transform="rotate(-90 150 150)" ' +
            'class="gauge-animated" />' +
          '<text x="150" y="130" text-anchor="middle" class="clock-center-number">' + stats.totalYears + '</text>' +
          '<text x="150" y="165" text-anchor="middle" class="clock-center-label">년 남음</text>' +
        '</svg>' +
        '<div class="clock-legend">' +
          '<span class="legend-item"><span class="legend-dot" style="background:' + outerColor + '"></span>평균수명(' + stats.lifespan + '세)</span>' +
          '<span class="legend-item"><span class="legend-dot" style="background:' + innerColor + '"></span>건강수명(' + stats.healthyAge + '세)</span>' +
        '</div>' +
      '</div>' +

      '<div class="stats-grid">' +
        '<div class="stat-card stat-healthy">' +
          '<div class="stat-icon">💪</div>' +
          '<div class="stat-value">' + (stats.healthyYears > 0 ? stats.healthyYears + '년' : '지남') + '</div>' +
          '<div class="stat-label">건강수명까지</div>' +
        '</div>' +
        '<div class="stat-card stat-total">' +
          '<div class="stat-icon">📅</div>' +
          '<div class="stat-value">' + stats.totalDays.toLocaleString() + '일</div>' +
          '<div class="stat-label">남은 날</div>' +
        '</div>' +
        '<div class="stat-card stat-weeks">' +
          '<div class="stat-icon">📆</div>' +
          '<div class="stat-value">' + stats.totalWeeks.toLocaleString() + '주</div>' +
          '<div class="stat-label">남은 주</div>' +
        '</div>' +
        '<div class="stat-card stat-months">' +
          '<div class="stat-icon">🗓️</div>' +
          '<div class="stat-value">' + stats.totalMonths.toLocaleString() + '개월</div>' +
          '<div class="stat-label">남은 달</div>' +
        '</div>' +
      '</div>' +

      '<div class="message-card">' +
        '<p class="message-text">&ldquo;' + getRandomMessage() + '&rdquo;</p>' +
      '</div>' +

      renderNudgeSection();

    requestAnimationFrame(function () {
      $$('.gauge-animated').forEach(function (el) { el.classList.add('animate'); });
    });
  }

  function renderNudgeSection() {
    var todayStr = new Date().toISOString().split('T')[0];
    var nudgeContacts = state.contacts.filter(function (c) {
      if (!c.lastContact) return true;
      return daysBetween(c.lastContact, todayStr) >= NUDGE_DAYS;
    }).slice(0, 3);

    if (nudgeContacts.length === 0) return '';

    var html = '<div class="nudge-section">' +
      '<h3 class="nudge-title">📞 안부를 전해보세요</h3>';

    nudgeContacts.forEach(function (contact) {
      var daysSince = contact.lastContact
        ? daysBetween(contact.lastContact, todayStr)
        : null;
      var urgencyClass = daysSince === null ? 'urgent' : daysSince >= 60 ? 'urgent' : 'warning';

      html +=
        '<div class="nudge-card ' + urgencyClass + '" data-contact-id="' + contact.id + '">' +
          '<div class="nudge-info">' +
            '<span class="nudge-name">' + contact.name + '</span>' +
            '<span class="nudge-relation">' + contact.relationship + '</span>' +
            '<span class="nudge-days">' + (daysSince !== null ? daysSince + '일 전 연락' : '연락 기록 없음') + '</span>' +
          '</div>' +
          '<button class="nudge-call-btn" onclick="app.markContacted(\'' + contact.id + '\')" aria-label="' + contact.name + '에게 연락 표시">' +
            '📞 연락함' +
          '</button>' +
        '</div>';
    });

    html += '</div>';
    return html;
  }

  // =========================================================================
  // 인맥 장부 - 연락처 목록 (Contacts List)
  // =========================================================================
  function renderContacts() {
    var container = $('#contacts-content');
    var searchInput = $('#contact-search');
    var searchTerm = searchInput ? searchInput.value : '';

    var filtered = state.contacts;
    if (searchTerm) {
      var term = searchTerm.toLowerCase();
      filtered = filtered.filter(function (c) {
        return c.name.toLowerCase().indexOf(term) !== -1 ||
          c.relationship.toLowerCase().indexOf(term) !== -1;
      });
    }

    filtered = sortContactsByUpcoming(filtered);

    if (filtered.length === 0 && !searchTerm) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">👥</div>' +
          '<p class="empty-text">아직 등록된 사람이 없습니다</p>' +
          '<p class="empty-sub">아래 버튼을 눌러<br>소중한 사람을 추가해보세요</p>' +
        '</div>';
      return;
    }

    if (filtered.length === 0 && searchTerm) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">🔍</div>' +
          '<p class="empty-text">&ldquo;' + searchTerm + '&rdquo; 검색 결과가 없습니다</p>' +
        '</div>';
      return;
    }

    var html = '';
    var todayStr = new Date().toISOString().split('T')[0];

    filtered.forEach(function (contact) {
      var nextEvent = getNextEventInfo(contact);
      var daysSinceContact = contact.lastContact
        ? daysBetween(contact.lastContact, todayStr)
        : null;

      var contactStatusClass = '';
      var contactStatusText = '';
      if (daysSinceContact === null) {
        contactStatusClass = 'status-none';
        contactStatusText = '연락 기록 없음';
      } else if (daysSinceContact >= 60) {
        contactStatusClass = 'status-urgent';
        contactStatusText = daysSinceContact + '일 전';
      } else if (daysSinceContact >= 30) {
        contactStatusClass = 'status-warning';
        contactStatusText = daysSinceContact + '일 전';
      } else {
        contactStatusClass = 'status-ok';
        contactStatusText = daysSinceContact + '일 전';
      }

      var lunarBirthdayText = '';
      if (contact.birthDate) {
        var bd = new Date(contact.birthDate);
        var today = new Date();
        if (contact.birthType === 'lunar') {
          var solar = LunarCalendar.getNextLunarBirthdaySolar(bd.getMonth() + 1, bd.getDate(), false);
          if (solar) {
            var solarDateStr = solar.year + '-' + String(solar.month).padStart(2, '0') + '-' + String(solar.day).padStart(2, '0');
            var daysUntil = daysBetween(todayStr, solarDateStr);
            if (daysUntil >= 0 && daysUntil <= 30) {
              lunarBirthdayText = '🎂 음력 생일 ' + daysUntil + '일 후';
            }
          }
        } else {
          var thisYearBd = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
          if (thisYearBd < today) thisYearBd.setFullYear(today.getFullYear() + 1);
          var daysUntilSolar = daysBetween(todayStr, thisYearBd.toISOString().split('T')[0]);
          if (daysUntilSolar >= 0 && daysUntilSolar <= 30) {
            lunarBirthdayText = '🎂 생일 ' + daysUntilSolar + '일 후';
          }
        }
      }

      html +=
        '<div class="contact-card" onclick="app.showContactDetail(\'' + contact.id + '\')">' +
          '<div class="contact-avatar">' + contact.name.charAt(0) + '</div>' +
          '<div class="contact-info">' +
            '<div class="contact-name">' + contact.name + '</div>' +
            '<div class="contact-relation">' + contact.relationship + '</div>' +
            (lunarBirthdayText ? '<div class="contact-birthday-soon">' + lunarBirthdayText + '</div>' : '') +
            (nextEvent ? '<div class="contact-next-event">' + nextEvent + '</div>' : '') +
          '</div>' +
          '<div class="contact-status ' + contactStatusClass + '">' +
            '<span class="status-dot"></span>' +
            '<span class="status-text">' + contactStatusText + '</span>' +
          '</div>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  function sortContactsByUpcoming(contacts) {
    var todayStr = new Date().toISOString().split('T')[0];
    return contacts.slice().sort(function (a, b) {
      var aDays = a.lastContact ? daysBetween(a.lastContact, todayStr) : 9999;
      var bDays = b.lastContact ? daysBetween(b.lastContact, todayStr) : 9999;
      return bDays - aDays;
    });
  }

  function getNextEventInfo(contact) {
    if (!contact.events || contact.events.length === 0) return '';
    var sorted = contact.events.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    var latest = sorted[0];
    var info = getEventTypeInfo(latest.type);
    return info.emoji + ' ' + info.label + ' (' + formatDate(latest.date) + ')';
  }

  // =========================================================================
  // 인맥 장부 - 연락처 상세 (Contact Detail)
  // =========================================================================
  function showContactDetail(contactId) {
    var contact = state.contacts.find(function (c) { return c.id === contactId; });
    if (!contact) return;

    state.selectedContactId = contactId;

    var container = $('#contact-detail-content');

    var birthdayInfo = '';
    if (contact.birthDate) {
      var bd = new Date(contact.birthDate);
      if (contact.birthType === 'lunar') {
        var solar = LunarCalendar.lunarToSolar(bd.getFullYear(), bd.getMonth() + 1, bd.getDate(), false);
        birthdayInfo =
          '<div class="detail-birthday">' +
            '<div class="birthday-main">음력 ' + (bd.getMonth() + 1) + '월 ' + bd.getDate() + '일</div>' +
            (solar ? '<div class="birthday-convert">→ 양력 ' + solar.year + '년 ' + solar.month + '월 ' + solar.day + '일</div>' : '') +
          '</div>';
      } else {
        var lunar = LunarCalendar.solarToLunar(bd.getFullYear(), bd.getMonth() + 1, bd.getDate());
        birthdayInfo =
          '<div class="detail-birthday">' +
            '<div class="birthday-main">양력 ' + (bd.getMonth() + 1) + '월 ' + bd.getDate() + '일</div>' +
            (lunar ? '<div class="birthday-convert">→ 음력 ' + lunar.monthStr + ' (' + lunar.yearGanZhi + ')</div>' : '') +
          '</div>';
      }
    }

    var eventsHtml = '';
    if (contact.events && contact.events.length > 0) {
      var sorted = contact.events.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
      eventsHtml = sorted.map(function (ev) {
        var info = getEventTypeInfo(ev.type);
        return '<div class="event-item">' +
          '<span class="event-emoji">' + info.emoji + '</span>' +
          '<div class="event-info">' +
            '<div class="event-type">' + info.label + (ev.direction === 'sent' ? ' (보냄)' : ev.direction === 'received' ? ' (받음)' : '') + '</div>' +
            '<div class="event-date">' + formatDate(ev.date) + '</div>' +
            (ev.amount ? '<div class="event-amount">' + Number(ev.amount).toLocaleString() + '원</div>' : '') +
            (ev.memo ? '<div class="event-memo">' + ev.memo + '</div>' : '') +
          '</div>' +
          '<button class="event-delete-btn" onclick="event.stopPropagation(); app.deleteEvent(\'' + contact.id + '\', \'' + ev.id + '\')" aria-label="경조사 삭제">✕</button>' +
        '</div>';
      }).join('');
    }

    container.innerHTML =
      '<div class="detail-header">' +
        '<button class="back-btn" onclick="app.showView(\'contacts\')" aria-label="뒤로가기">← 뒤로</button>' +
        '<div class="detail-actions">' +
          '<button class="edit-btn" onclick="app.showEditContact(\'' + contact.id + '\')" aria-label="수정">✏️ 수정</button>' +
          '<button class="delete-btn" onclick="app.deleteContact(\'' + contact.id + '\')" aria-label="삭제">🗑️ 삭제</button>' +
        '</div>' +
      '</div>' +

      '<div class="detail-profile">' +
        '<div class="detail-avatar">' + contact.name.charAt(0) + '</div>' +
        '<h2 class="detail-name">' + contact.name + '</h2>' +
        '<span class="detail-relation-badge">' + contact.relationship + '</span>' +
      '</div>' +

      (contact.phone ?
        '<a href="tel:' + contact.phone + '" class="call-button">' +
          '📞 전화걸기 (' + contact.phone + ')' +
        '</a>' : '') +

      '<div class="detail-section">' +
        '<h3>📋 기본 정보</h3>' +
        (birthdayInfo || '<p class="no-data">생일 정보 없음</p>') +
        '<div class="detail-last-contact">' +
          '<strong>마지막 연락:</strong> ' +
          (contact.lastContact ? formatDate(contact.lastContact) : '기록 없음') +
          ' <button class="mark-contact-btn" onclick="app.markContacted(\'' + contact.id + '\')">' +
            '✅ 오늘 연락함' +
          '</button>' +
        '</div>' +
        (contact.memo ? '<div class="detail-memo"><strong>메모:</strong> ' + contact.memo + '</div>' : '') +
      '</div>' +

      '<div class="detail-section">' +
        '<div class="section-header">' +
          '<h3>💰 경조사 내역</h3>' +
          '<button class="add-event-btn" onclick="app.showAddEvent(\'' + contact.id + '\')">+ 추가</button>' +
        '</div>' +
        (eventsHtml || '<p class="no-data">아직 경조사 내역이 없습니다</p>') +
        (contact.events && contact.events.length > 0 ?
          '<div class="events-summary">' +
            '<strong>총 ' + contact.events.length + '건</strong> · ' +
            '보낸 금액: ' + calculateTotalSent(contact).toLocaleString() + '원 · ' +
            '받은 금액: ' + calculateTotalReceived(contact).toLocaleString() + '원' +
          '</div>' : '') +
      '</div>';

    showView('contact-detail');
  }

  function calculateTotalSent(contact) {
    if (!contact.events) return 0;
    return contact.events
      .filter(function (e) { return e.direction === 'sent'; })
      .reduce(function (sum, e) { return sum + (Number(e.amount) || 0); }, 0);
  }

  function calculateTotalReceived(contact) {
    if (!contact.events) return 0;
    return contact.events
      .filter(function (e) { return e.direction === 'received'; })
      .reduce(function (sum, e) { return sum + (Number(e.amount) || 0); }, 0);
  }

  // =========================================================================
  // 연락처 추가/수정 (Add/Edit Contact)
  // =========================================================================
  function showAddContact() {
    state.editingContactId = null;
    renderContactForm(null);
    showView('contact-form');
  }

  function showEditContact(contactId) {
    var contact = state.contacts.find(function (c) { return c.id === contactId; });
    if (!contact) return;
    state.editingContactId = contactId;
    renderContactForm(contact);
    showView('contact-form');
  }

  function renderContactForm(contact) {
    var container = $('#contact-form-content');
    var isEdit = !!contact;

    var relationOptions = RELATIONSHIP_TYPES.map(function (r) {
      return '<option value="' + r + '" ' + (contact && contact.relationship === r ? 'selected' : '') + '>' + r + '</option>';
    }).join('');

    container.innerHTML =
      '<div class="form-header">' +
        '<button class="back-btn" onclick="app.goBackFromForm()" aria-label="뒤로가기">← 취소</button>' +
        '<h2>' + (isEdit ? '연락처 수정' : '새 연락처') + '</h2>' +
      '</div>' +

      '<form id="contact-edit-form" class="contact-form">' +
        '<div class="form-group">' +
          '<label for="cf-name">이름 *</label>' +
          '<input type="text" id="cf-name" value="' + (contact ? contact.name : '') + '" required placeholder="이름을 입력하세요" autocomplete="name">' +
        '</div>' +

        '<div class="form-group">' +
          '<label for="cf-relation">관계</label>' +
          '<select id="cf-relation">' + relationOptions + '</select>' +
        '</div>' +

        '<div class="form-group">' +
          '<label for="cf-phone">전화번호</label>' +
          '<input type="tel" id="cf-phone" value="' + (contact ? (contact.phone || '') : '') + '" placeholder="010-0000-0000" autocomplete="tel">' +
        '</div>' +

        '<div class="form-group">' +
          '<label>생년월일</label>' +
          '<div class="birth-type-toggle">' +
            '<button type="button" class="toggle-btn ' + (!contact || contact.birthType !== 'lunar' ? 'active' : '') + '" data-birth-type="solar" onclick="app.toggleBirthType(\'solar\')">양력</button>' +
            '<button type="button" class="toggle-btn ' + (contact && contact.birthType === 'lunar' ? 'active' : '') + '" data-birth-type="lunar" onclick="app.toggleBirthType(\'lunar\')">음력</button>' +
          '</div>' +
          '<input type="date" id="cf-birth" value="' + (contact ? (contact.birthDate || '') : '') + '">' +
          '<div id="cf-lunar-info" class="lunar-info"></div>' +
        '</div>' +

        '<div class="form-group">' +
          '<label for="cf-memo">메모</label>' +
          '<textarea id="cf-memo" rows="3" placeholder="기억할 내용을 적어보세요">' + (contact ? (contact.memo || '') : '') + '</textarea>' +
        '</div>' +

        '<button type="submit" class="submit-btn">' + (isEdit ? '수정 완료' : '저장하기') + '</button>' +
      '</form>';

    var form = $('#contact-edit-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      saveContact();
    });

    var birthInput = $('#cf-birth');
    birthInput.addEventListener('change', updateLunarInfo);
    if (contact && contact.birthDate) {
      updateLunarInfo();
    }
  }

  function goBackFromForm() {
    if (state.editingContactId) {
      showContactDetail(state.editingContactId);
    } else {
      showView('contacts');
    }
  }

  function toggleBirthType(type) {
    $$('.birth-type-toggle .toggle-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.birthType === type);
    });
    updateLunarInfo();
  }

  function updateLunarInfo() {
    var birthInput = $('#cf-birth');
    var infoDiv = $('#cf-lunar-info');
    if (!birthInput || !birthInput.value || !infoDiv) return;

    var d = new Date(birthInput.value);
    var activeBtn = $('.birth-type-toggle .toggle-btn.active');
    if (!activeBtn) return;
    var isLunar = activeBtn.dataset.birthType === 'lunar';

    if (isLunar) {
      var solar = LunarCalendar.lunarToSolar(d.getFullYear(), d.getMonth() + 1, d.getDate(), false);
      if (solar) {
        infoDiv.textContent = '→ 양력: ' + solar.year + '년 ' + solar.month + '월 ' + solar.day + '일';
      } else {
        infoDiv.textContent = '변환할 수 없는 날짜입니다';
      }
    } else {
      var lunar = LunarCalendar.solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
      if (lunar) {
        infoDiv.textContent = '→ 음력: ' + lunar.year + '년 ' + lunar.monthStr + ' (' + lunar.yearGanZhi + ')';
      } else {
        infoDiv.textContent = '변환할 수 없는 날짜입니다';
      }
    }
  }

  function saveContact() {
    var name = $('#cf-name').value.trim();
    if (!name) {
      showToast('이름을 입력해주세요.');
      return;
    }

    var activeBtn = $('.birth-type-toggle .toggle-btn.active');
    var isLunar = activeBtn && activeBtn.dataset.birthType === 'lunar';

    var contactData = {
      name: name,
      relationship: $('#cf-relation').value,
      phone: $('#cf-phone').value.trim(),
      birthDate: $('#cf-birth').value || null,
      birthType: isLunar ? 'lunar' : 'solar',
      memo: $('#cf-memo').value.trim()
    };

    if (state.editingContactId) {
      var idx = state.contacts.findIndex(function (c) { return c.id === state.editingContactId; });
      if (idx !== -1) {
        var existing = state.contacts[idx];
        state.contacts[idx] = {
          id: existing.id,
          events: existing.events,
          lastContact: existing.lastContact,
          createdAt: existing.createdAt,
          name: contactData.name,
          relationship: contactData.relationship,
          phone: contactData.phone,
          birthDate: contactData.birthDate,
          birthType: contactData.birthType,
          memo: contactData.memo
        };
      }
      saveState();
      showToast('수정되었습니다.');
      showContactDetail(state.editingContactId);
    } else {
      var newContact = {
        id: generateId(),
        name: contactData.name,
        relationship: contactData.relationship,
        phone: contactData.phone,
        birthDate: contactData.birthDate,
        birthType: contactData.birthType,
        memo: contactData.memo,
        events: [],
        lastContact: null,
        createdAt: new Date().toISOString()
      };
      state.contacts.push(newContact);
      saveState();
      showToast('새 연락처가 추가되었습니다.');
      showView('contacts');
    }
  }

  function deleteContact(contactId) {
    if (!confirm('정말 삭제하시겠습니까?\n삭제된 정보는 복구할 수 없습니다.')) return;
    state.contacts = state.contacts.filter(function (c) { return c.id !== contactId; });
    saveState();
    showToast('삭제되었습니다.');
    showView('contacts');
  }

  function markContacted(contactId) {
    var contact = state.contacts.find(function (c) { return c.id === contactId; });
    if (!contact) return;
    contact.lastContact = new Date().toISOString().split('T')[0];
    saveState();
    showToast(contact.name + '님에게 연락 완료!');

    if (state.currentView === 'life-clock') {
      renderLifeClock();
    } else if (state.currentView === 'contact-detail') {
      showContactDetail(contactId);
    } else {
      renderContacts();
    }
  }

  // =========================================================================
  // 경조사 추가 (Add Event)
  // =========================================================================
  function showAddEvent(contactId) {
    var contact = state.contacts.find(function (c) { return c.id === contactId; });
    if (!contact) return;

    var typeOptions = EVENT_TYPES.map(function (t) {
      return '<option value="' + t.value + '">' + t.emoji + ' ' + t.label + '</option>';
    }).join('');

    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'event-modal';
    modal.innerHTML =
      '<div class="modal-content">' +
        '<div class="modal-header">' +
          '<h3>' + contact.name + '님 경조사 추가</h3>' +
          '<button class="modal-close" onclick="app.closeModal()" aria-label="닫기">✕</button>' +
        '</div>' +
        '<form id="event-form">' +
          '<div class="form-group">' +
            '<label for="ev-type">종류</label>' +
            '<select id="ev-type">' + typeOptions + '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="ev-date">날짜</label>' +
            '<input type="date" id="ev-date" value="' + new Date().toISOString().split('T')[0] + '" required>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>보낸/받은</label>' +
            '<div class="direction-toggle">' +
              '<button type="button" class="toggle-btn active" data-direction="sent" onclick="app.toggleDirection(\'sent\')">보냄 (지출)</button>' +
              '<button type="button" class="toggle-btn" data-direction="received" onclick="app.toggleDirection(\'received\')">받음 (수입)</button>' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="ev-amount">금액 (원)</label>' +
            '<input type="number" id="ev-amount" placeholder="50000" step="10000" min="0">' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="ev-memo">메모</label>' +
            '<input type="text" id="ev-memo" placeholder="간단한 메모">' +
          '</div>' +
          '<button type="submit" class="submit-btn">저장하기</button>' +
        '</form>' +
      '</div>';

    document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.classList.add('active'); });

    $('#event-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var dirBtn = $('.direction-toggle .toggle-btn.active');
      var direction = dirBtn ? dirBtn.dataset.direction : 'sent';
      var eventData = {
        id: generateId(),
        type: $('#ev-type').value,
        date: $('#ev-date').value,
        direction: direction,
        amount: $('#ev-amount').value || 0,
        memo: $('#ev-memo').value.trim()
      };

      if (!contact.events) contact.events = [];
      contact.events.push(eventData);
      saveState();
      closeModal();
      showToast('경조사 내역이 추가되었습니다.');
      showContactDetail(contactId);
    });
  }

  function deleteEvent(contactId, eventId) {
    if (!confirm('이 경조사 내역을 삭제하시겠습니까?')) return;
    var contact = state.contacts.find(function (c) { return c.id === contactId; });
    if (!contact) return;
    contact.events = contact.events.filter(function (e) { return e.id !== eventId; });
    saveState();
    showToast('삭제되었습니다.');
    showContactDetail(contactId);
  }

  function toggleDirection(dir) {
    $$('.direction-toggle .toggle-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.direction === dir);
    });
  }

  function closeModal() {
    var modal = $('#event-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function () { modal.remove(); }, 300);
    }
  }

  // =========================================================================
  // 설정 (Settings)
  // =========================================================================
  function renderSettings() {
    var container = $('#settings-content');
    if (!state.user) return;

    var birth = new Date(state.user.birthDate);
    var lunarBirth = LunarCalendar.solarToLunar(birth.getFullYear(), birth.getMonth() + 1, birth.getDate());
    var totalEvents = state.contacts.reduce(function (s, c) { return s + (c.events ? c.events.length : 0); }, 0);

    container.innerHTML =
      '<div class="settings-section">' +
        '<h3>👤 내 정보</h3>' +
        '<div class="settings-info">' +
          '<div class="settings-row">' +
            '<span class="settings-label">이름</span>' +
            '<span class="settings-value">' + state.user.name + '</span>' +
          '</div>' +
          '<div class="settings-row">' +
            '<span class="settings-label">생년월일</span>' +
            '<span class="settings-value">' +
              formatDate(state.user.birthDate) +
              (lunarBirth ? '<br><span class="settings-small">음력: ' + lunarBirth.year + '년 ' + lunarBirth.monthStr + '</span>' : '') +
              (lunarBirth ? '<br><span class="settings-small">' + lunarBirth.yearGanZhi + '</span>' : '') +
            '</span>' +
          '</div>' +
          '<div class="settings-row">' +
            '<span class="settings-label">성별</span>' +
            '<span class="settings-value">' + (state.user.gender === 'female' ? '여성' : '남성') + '</span>' +
          '</div>' +
          '<div class="settings-row">' +
            '<span class="settings-label">기대수명</span>' +
            '<span class="settings-value">' + (state.user.gender === 'female' ? '86' : '80') + '세 (한국인 평균)</span>' +
          '</div>' +
        '</div>' +
        '<button class="settings-btn" onclick="app.editProfile()">✏️ 내 정보 수정</button>' +
      '</div>' +

      '<div class="settings-section">' +
        '<h3>📊 통계</h3>' +
        '<div class="settings-info">' +
          '<div class="settings-row">' +
            '<span class="settings-label">등록된 사람</span>' +
            '<span class="settings-value">' + state.contacts.length + '명</span>' +
          '</div>' +
          '<div class="settings-row">' +
            '<span class="settings-label">총 경조사</span>' +
            '<span class="settings-value">' + totalEvents + '건</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="settings-section">' +
        '<h3>💾 데이터 관리</h3>' +
        '<button class="settings-btn" onclick="app.exportData()">📤 데이터 내보내기</button>' +
        '<button class="settings-btn" onclick="app.importData()">📥 데이터 가져오기</button>' +
        '<button class="settings-btn danger" onclick="app.resetData()">🗑️ 모든 데이터 초기화</button>' +
        '<input type="file" id="import-file" accept=".json" style="display:none" onchange="app.handleImport(event)">' +
      '</div>' +

      '<div class="settings-section settings-footer">' +
        '<p class="app-version">인생 시계 & 인맥 장부 v1.0</p>' +
        '<p class="app-copyright">소중한 사람들과의 시간을 기록하세요</p>' +
      '</div>';
  }

  function editProfile() {
    $('#view-onboarding').classList.add('active');
    $$('.view').forEach(function (v) {
      if (v.id !== 'view-onboarding') v.classList.remove('active');
    });
    $('#bottom-nav').style.display = 'none';

    $('#input-name').value = state.user.name;
    $('#input-birth').value = state.user.birthDate;
    var genderRadio = $('input[name="gender"][value="' + state.user.gender + '"]');
    if (genderRadio) genderRadio.checked = true;

    $('#onboarding-title').textContent = '내 정보 수정';
    $('#onboarding-submit').textContent = '수정 완료';
  }

  function exportData() {
    var data = {
      user: state.user,
      contacts: state.contacts,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '인생시계_백업_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('데이터가 저장되었습니다.');
  }

  function importData() {
    $('#import-file').click();
  }

  function handleImport(event) {
    var file = event.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = JSON.parse(e.target.result);
        if (data.user && data.contacts) {
          if (confirm('기존 데이터를 덮어쓰시겠습니까?')) {
            state.user = data.user;
            state.contacts = data.contacts;
            saveState();
            showToast('데이터를 불러왔습니다.');
            renderSettings();
          }
        } else {
          showToast('올바른 백업 파일이 아닙니다.');
        }
      } catch (err) {
        showToast('파일을 읽을 수 없습니다.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function resetData() {
    if (!confirm('정말 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
    if (!confirm('정말로 삭제하시겠습니까? 마지막 확인입니다.')) return;
    localStorage.removeItem(STORAGE_KEY);
    state.user = null;
    state.contacts = [];
    location.reload();
  }

  // =========================================================================
  // 토스트 메시지 (Toast)
  // =========================================================================
  function showToast(message) {
    var existing = $('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () { toast.classList.add('show'); });

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 2500);
  }

  // =========================================================================
  // 초기화 (Initialization)
  // =========================================================================
  function init() {
    loadState();

    if (!state.user) {
      showOnboarding();
    } else {
      $('#bottom-nav').style.display = '';
      showView('life-clock');
    }

    $$('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var view = this.dataset.view;
        if (view === 'add-contact') {
          showAddContact();
        } else {
          showView(view);
        }
      });
    });

    var searchInput = $('#contact-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        renderContacts();
      });
    }
  }

  // =========================================================================
  // Public API
  // =========================================================================
  window.app = {
    showView: showView,
    showContactDetail: showContactDetail,
    showAddContact: showAddContact,
    showEditContact: showEditContact,
    showAddEvent: showAddEvent,
    deleteContact: deleteContact,
    deleteEvent: deleteEvent,
    markContacted: markContacted,
    toggleBirthType: toggleBirthType,
    toggleDirection: toggleDirection,
    closeModal: closeModal,
    editProfile: editProfile,
    exportData: exportData,
    importData: importData,
    handleImport: handleImport,
    resetData: resetData,
    goBackFromForm: goBackFromForm
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
