/* Local interactions for the static, three-page KMCS portfolio demo. */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const cleanText = element => element?.textContent.replace(/\s+/g, ' ').trim() || '';
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const sizeCanvas = () => document.documentElement.style.setProperty('--canvas-u', `${Math.min($('.figma-screen')?.clientWidth || document.body.clientWidth, 1920) / 1920}px`);
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas, { passive: true });
  // Keep the subpage navigation above the rising mission and catalog sections.
  const subpageHeader = document.body.dataset.page !== 'index' && $('.site-header');
  if (subpageHeader) {
    const slot = document.createElement('div');
    slot.className = 'persistent-header-slot';
    slot.setAttribute('aria-hidden','true');
    subpageHeader.replaceWith(slot);
    subpageHeader.classList.add('persistent-header');
    document.body.prepend(subpageHeader);
    document.body.classList.add('has-persistent-header');
    const updateHeader = () => {
      const mission = $('.mission-section');
      const light = !mission || mission.getBoundingClientRect().top < subpageHeader.offsetHeight;
      subpageHeader.classList.toggle('header-on-light',light);
      document.body.classList.toggle('header-on-light',light);
    };
    updateHeader();
    window.addEventListener('scroll',updateHeader,{passive:true});
    window.addEventListener('resize',updateHeader,{passive:true});
  }
  // Keep wheel scrolling, anchors and controls smooth without changing touch input.
  let wheelFrame = 0;
  let wheelTarget = window.scrollY;
  let wheelPosition = window.scrollY;
  let wheelTime = 0;
  const cancelWheel = () => { cancelAnimationFrame(wheelFrame); wheelFrame = 0; wheelTarget = wheelPosition = window.scrollY; };
  function smoothWheelFrame(time) {
    const elapsed = Math.min(40, time - wheelTime || 16);
    wheelTime = time;
    wheelTarget = Math.max(0, Math.min(wheelTarget, document.documentElement.scrollHeight - innerHeight));
    const distance = wheelTarget - wheelPosition;
    if (Math.abs(distance) < .8) { wheelPosition = wheelTarget; window.scrollTo({top:wheelTarget,behavior:'instant'}); wheelFrame = 0; return; }
    wheelPosition += distance * (1 - Math.exp(-elapsed / 95));
    window.scrollTo({top:wheelPosition,behavior:'instant'});
    wheelFrame = requestAnimationFrame(smoothWheelFrame);
  }
  document.addEventListener('wheel', event => {
    if (event.defaultPrevented || event.ctrlKey || event.shiftKey || motionPreference.matches || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
    if (event.target.closest('dialog,textarea,select,[contenteditable=true],#mobile-nav')) return;
    for (let element=event.target; element && element!==document.body; element=element.parentElement) {
      if (/auto|scroll/.test(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight + 1 && ((event.deltaY < 0 && element.scrollTop > 0) || (event.deltaY > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1))) return;
    }
    const amount = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (!wheelFrame) { wheelTarget = wheelPosition = window.scrollY; wheelTime = performance.now(); }
    wheelTarget = Math.max(0, Math.min(wheelTarget + amount, document.documentElement.scrollHeight - innerHeight));
    event.preventDefault();
    if (!wheelFrame) wheelFrame = requestAnimationFrame(smoothWheelFrame);
  }, {passive:false});
  document.addEventListener('pointerdown', cancelWheel, {passive:true});
  document.addEventListener('keydown', cancelWheel);
  motionPreference.addEventListener('change', cancelWheel);
  const dialog = $('#detail-dialog');
  const dialogContent = $('#dialog-content');
  let toastTimer;
  let previousFocus;
  function toast(message) {
    const element = $('.toast');
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('show'), 3500);
  }
  function readSaved() {
    try { return JSON.parse(localStorage.getItem('kmcs-saved') || '{}'); }
    catch { return {}; }
  }
  function save(data) {
    try { localStorage.setItem('kmcs-saved', JSON.stringify(data)); return true; }
    catch { toast('현재 브라우저에서는 저장 기능을 사용할 수 없습니다.'); return false; }
  }
  function openDialog(title, body, options = {}) {
    cancelWheel();
    previousFocus = document.activeElement;
    dialog.classList.toggle('compact-dialog', Boolean(options.compact));
    dialogContent.replaceChildren();
    dialogContent.scrollTop = 0;
    const heading = document.createElement('h2');
    heading.className = 'dialog-title';
    heading.id = 'dialog-title';
    heading.textContent = title;
    const copy = document.createElement('p');
    copy.className = 'dialog-body';
    copy.textContent = body;
    dialogContent.append(heading, copy);
    if (options.links) {
      const links = document.createElement('div');
      links.className = 'dialog-links';
      options.links.forEach(([text, href]) => {
        const link = document.createElement('a');
        link.textContent = text;
        link.href = href;
        links.append(link);
      });
      dialogContent.append(links);
    }
    dialog.showModal();
  }
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => previousFocus?.focus());
  const menu = $('.mobile-menu-button');
  const mobileNav = $('#mobile-nav');
  function closeMenu() { mobileNav.hidden = true; menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', '메뉴 열기'); menu.textContent = '☰'; }
  menu.addEventListener('click', () => {
    const opening = mobileNav.hidden;
    mobileNav.hidden = !opening;
    menu.setAttribute('aria-expanded', String(opening));
    menu.setAttribute('aria-label', opening ? '메뉴 닫기' : '메뉴 열기');
    menu.textContent = opening ? '×' : '☰';
  });
  mobileNav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menu.focus(); } });
  const currentPath = location.pathname;
  $$('.primary-nav a').forEach(link => { if (!link.hash && currentPath.endsWith(link.getAttribute('href'))) link.setAttribute('aria-current', 'page'); });
  const topButton = $('.back-top');
  const onScroll = () => { topButton.hidden = window.scrollY < 600; };
  window.addEventListener('scroll', onScroll, { passive: true });
  topButton.addEventListener('click', () => window.scrollTo({top:0, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
  onScroll();
  const saved = readSaved();
  $$('.favorite-button[data-action="favorite"]').forEach(button => {
    const key = button.dataset.nodeId;
    button.dataset.favoriteKey = key;
    button.setAttribute('aria-pressed', String(Boolean(saved[key])));
    updateHeart(button);
  });
  function updateHeart(button) {
    const active = button.getAttribute('aria-pressed') === 'true';
    const img = $('img', button);
    if (img && !button.closest('.header-tools')) img.src = active ? 'assets/2b07e.svg' : 'assets/c9827.svg';
    button.setAttribute('aria-label', active ? '관심 항목 저장 취소' : '관심 항목 저장');
  }
  function favorite(button) {
    const data = readSaved();
    const key = button.dataset.favoriteKey || button.dataset.nodeId;
    const active = button.getAttribute('aria-pressed') !== 'true';
    data[key] = active;
    if (save(data)) {
      $$('.favorite-button[data-action="favorite"]').filter(heart => (heart.dataset.favoriteKey || heart.dataset.nodeId) === key).forEach(heart => {
        heart.setAttribute('aria-pressed', String(active));
        updateHeart(heart);
      });
      if (!motionPreference.matches) button.animate([{scale:'.9'},{scale:'1.25'},{scale:'1'}], {duration:280,easing:'ease-out'});
    }
  }
  const courses = $$('.course-grid .mountain-card');
  const courseData = [
    { difficulty:'보통', purpose:'풍경 감상', distance:'5~10km', tags:'인기 주말 등산 운동 대전 식장산', detail:'대전시 동구 대성동\n산행 전 날씨와 공식 탐방 통제 정보를 확인해 주세요.' },
    { difficulty:'어려움', purpose:'운동', distance:'10km 이상', tags:'인기 계절 순위 보은 속리산 하이킹', detail:'속리산 국립공원 문장대 코스\n산행 전 날씨와 공식 탐방 통제 정보를 확인해 주세요.' },
    { difficulty:'보통', purpose:'풍경 감상', distance:'5~10km', tags:'계절 순위 지역 제천 월악산', detail:'충청북도 제천시\n산행 전 날씨와 공식 탐방 통제 정보를 확인해 주세요.' },
    { difficulty:'쉬움', purpose:'힐링', distance:'5km 미만', tags:'인기 힐링코스 운동 겸 산책 가벼운 하이킹 내 주변 청주 미동산', detail:'충청북도 청주시\n숲길을 천천히 걸으며 자연을 경험해 보세요.' }
  ];
  let query = '';
  function selectCourseTab(button) {
    $$('.course-tabs button').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
    // Category controls are a visual demo; always restore the original four cards.
    query = '';
    if ($('#course-search')) $('#course-search').value = '';
    $$('.course-filters select').forEach(select => select.selectedIndex = 0);
    courses.forEach(card => { card.hidden = false; card.style.order = ''; });
    if (feedback) feedback.hidden = true;
  }
  let feedback;
  if ($('.course-content')) {
    feedback = document.createElement('p');
    feedback.className = 'filter-feedback';
    feedback.setAttribute('role', 'status');
    feedback.hidden = true;
    $('.course-content').append(feedback);
  }
  function filterCourses() {
    const [difficulty,purpose,distance] = $$('.course-filters select').map(select => select.value);
    let visible = 0;
    courses.forEach((card, index) => {
      const data = courseData[index];
      const text = cleanText(card) + ' ' + data.tags;
      const match = (difficulty === '난이도' || data.difficulty === difficulty) &&
        (purpose === '목적' || data.purpose === purpose) && (distance === '거리' || data.distance === distance) &&
        (!query || text.includes(query));
      card.hidden = !match;
      if (match) visible++;
    });
    feedback.hidden = false;
    feedback.textContent = visible ? `${visible}개의 코스를 찾았습니다.` : '조건에 맞는 코스가 없습니다. 검색어나 조건을 변경해 주세요.';
  }
  // Keep the supplied card layout when experimenting with the demo selectors.
  $$('.course-filters select').forEach(select => select.addEventListener('change', () => {
    courses.forEach(card => card.hidden = false);
    if (feedback) feedback.hidden = true;
  }));
  $('.course-search')?.addEventListener('submit', event => {
    event.preventDefault(); query = $('#course-search').value.trim(); filterCourses(); $('#courses').scrollIntoView({behavior:'smooth'});
  });
  $('#course-search')?.addEventListener('search', () => { query = $('#course-search').value.trim(); filterCourses(); });
  // Pagination is a visual selection until additional page content is supplied.
  $$('.pagination button').forEach(button => {
    button.disabled = false;
    button.setAttribute('aria-label', `${cleanText(button)}페이지`);
    if (cleanText(button) === '1') button.setAttribute('aria-current','page');
    button.addEventListener('click', () => {
      $$('.pagination button').forEach(item => item.removeAttribute('aria-current'));
      button.setAttribute('aria-current','page');
    });
  });
  let sorting = '추천순';
  const programCards = $$('.program-card');
  $$('.program-card .f273').forEach(node => node.classList.add('original-price'));
  programCards.forEach((card,index) => { card.dataset.originalOrder = index; });
  const sortButton = $('[data-action="sort"]');
  let sortMenu;
  const sortOptions = ['추천순','인기순','낮은 가격순','높은 가격순'];
  // A stable sample ranking is used until program popularity data is supplied.
  const popularityOrder = [2,0,3,1,5,7,4,6];
  function closeSort(restoreFocus = false) {
    if (!sortMenu) return;
    sortMenu.hidden = true;
    sortButton.setAttribute('aria-expanded','false');
    if (restoreFocus) sortButton.focus();
  }
  if (sortButton) {
    const wrapper = document.createElement('div');
    wrapper.className = 'program-sort';
    sortButton.replaceWith(wrapper);
    wrapper.append(sortButton);
    sortButton.id = 'program-sort-button';
    sortButton.setAttribute('aria-haspopup','listbox');
    sortButton.setAttribute('aria-expanded','false');
    sortButton.setAttribute('aria-controls','program-sort-options');
    sortMenu = document.createElement('div');
    sortMenu.id = 'program-sort-options';
    sortMenu.className = 'program-sort-options';
    sortMenu.setAttribute('role','listbox');
    sortMenu.setAttribute('aria-label','프로그램 정렬');
    sortMenu.hidden = true;
    sortOptions.forEach((label,index) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.dataset.action = 'sort-option';
      option.dataset.sort = label;
      option.textContent = label;
      option.setAttribute('role','option');
      option.setAttribute('aria-selected',String(index === 0));
      sortMenu.append(option);
    });
    wrapper.append(sortMenu);
    document.addEventListener('click',event => { if (!wrapper.contains(event.target)) closeSort(); });
    wrapper.addEventListener('keydown',event => {
      const options = [...sortMenu.children];
      if (event.key === 'Escape') { event.preventDefault();closeSort(true); }
      else if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
        event.preventDefault();sortMenu.hidden = false;sortButton.setAttribute('aria-expanded','true');
        let index = options.indexOf(document.activeElement);
        index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length-1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
        options[index].focus();
      } else if (event.key === 'Tab') closeSort();
    });
  }
  // The supplied images are reused as examples; geographic names and map points change together.
  const regionCards = $$('.region-card');
  const regionPhotos = regionCards.map(card => {
    const image = $('img.asset-photo',card);
    return Object.fromEntries(['src','srcset','sizes','width','height'].map(key => [key,image.getAttribute(key)]));
  });
  let regionVisit = 0;
  function selectRegion(button, animate = true) {
    const name = button.dataset.regionName;
    const data = window.KMCS_REGIONS?.[name];
    if (!data) return;
    $$('.region-tabs button').forEach(tab => tab.setAttribute('aria-pressed',String(tab === button)));
    $('.condition-region-title p').textContent = `${name} 바로가기`;
    const photoOffset = animate ? ++regionVisit % regionPhotos.length : 0;
    regionCards.forEach((card,index) => {
      const point = data.points[index];
      $('.region-card-name',card).textContent = point.name;
      $('.region-card-address',card).textContent = `${name} 일대`;
      $('.region-card-hours',card).textContent = '정보 준비 중';
      $('.region-card-elevation',card).textContent = '정보 준비 중';
      const image = $('img.asset-photo',card);
      Object.entries(regionPhotos[(index + photoOffset) % regionPhotos.length]).forEach(([key,value]) => { if (value) image.setAttribute(key,value); });
      image.alt = `${name} ${point.name} — 예시 산행 사진`;
      card.dataset.region = name;
      card.getAnimations().forEach(animation => animation.cancel());
      if (animate && !motionPreference.matches) card.animate([
        {opacity:0,transform:'translate(0,24px)'},
        {opacity:1,transform:'translate(0,0)'}
      ],{duration:620,delay:index * 90,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
    });
    const map = $('.regional-map');
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 1000 800');
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label',`${name} 지도와 산 위치`);
    svg.classList.add('regional-map-svg');
    const land = document.createElementNS(ns,'path');
    land.setAttribute('d',data.path);land.setAttribute('fill-rule','evenodd');land.classList.add('region-land');
    svg.append(land);
    const otherPoints = data.points.slice(3);
    for (let i=otherPoints.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1));[otherPoints[i],otherPoints[j]]=[otherPoints[j],otherPoints[i]]; }
    [...data.points.slice(0,3),...otherPoints.slice(0,9)].forEach((point,index) => {
      const group = document.createElementNS(ns,'g');
      group.classList.add('regional-marker');
      group.style.setProperty('--marker-delay',`${index * .065}s`);
      group.setAttribute('aria-label',point.name);
      group.dataset.geonameId = point.geonameId;
      const circle = document.createElementNS(ns,'circle');
      circle.setAttribute('cx',point.x);circle.setAttribute('cy',point.y);circle.setAttribute('r',index<3 ? 16 : 10);
      circle.classList.add(index<3 ? 'marker-featured' : 'marker-dot');
      group.append(circle);svg.append(group);
    });
    const label = document.createElement('p');label.className = 'regional-map-label';label.textContent = name;
    // Attribution belongs to the footer, not beneath each changing map.
    if (!$('.map-source-credit')) {
      const credit = document.createElement('p');credit.className = 'map-source-credit';
      credit.append('지도 자료: ');
      [['Natural Earth','https://www.naturalearthdata.com/'],['© GeoNames','https://www.geonames.org/'],['CC BY 4.0','https://creativecommons.org/licenses/by/4.0/']].forEach(([text,href],index) => {
        if (index) credit.append(' · ');
        const link = document.createElement('a');link.textContent = text;link.href = href;link.target = '_blank';link.rel = 'noopener noreferrer';credit.append(link);
      });
      $('.footer-legal')?.append(credit);
    }
    map.replaceChildren(svg,label);map.dataset.region = name;
  }
  const initialRegion = $('.region-tabs [aria-pressed=true]');
  if (initialRegion) selectRegion(initialRegion,false);
  // Year-by-year copy supplied by the user; stock images illustrate the activities.
  const historyEntries = [
    {year:2026,title:'친환경 캠페인 협력 확대 및 서비스 개편',details:['기업 연계 자연보호 캠페인 공동 개최','산림 체험프로그램 온라인 신청 페이지 리뉴얼','지역 환경단체와 산림보호 활동 업무협약 체결'],image:'assets/history/2026.jpg',imagePosition:'50% 0%',imageAlt:'새싹을 돌보는 손 — 자연보호 활동 예시'},
    {year:2025,title:'친환경 사업 협력 및 온라인 서비스 출시',details:['지역 관광기관과 친환경 트레킹 프로그램 공동 운영','산림 체험프로그램 온라인 예약·신청 서비스 출시','기업 임직원 대상 자연보호 캠페인 운영 계약 체결'],image:'assets/optimized/57139.webp',imageAlt:'협업 회의와 온라인 서비스 기획'},
    {year:2024,title:'산림문화 프로그램 확대 및 기관 협력',details:['지역 산림관리기관과 산림보호 활동 업무협약 체결','지자체 연계 친환경 걷기 캠페인 개최','학교·교육기관 대상 숲 체험교육 프로그램 운영','지역 환경단체 공동 산림 정화 활동 진행'],image:'assets/history/2024-forest.jpg',imageAlt:'초록 숲길을 함께 걷는 체험 참가자들 — 활동 예시'},
    {year:2023,title:'자연 체험프로그램 도입 및 캠페인 확대',details:['등산·산책 기반 자연 체험프로그램 시범 운영','지역 주민 참여형 플로깅 캠페인 개최','지역 환경단체와 자연보호 공동 프로젝트 추진'],image:'assets/history/2023.jpg',imageAlt:'숲길을 함께 걷는 사람들 — 자연 체험 활동 예시'},
    {year:2022,title:'지역 자연보호 활동 및 협력 기반 마련',details:['지역 환경단체와 자연보호 활동 협약 체결','지역 산림 정화 캠페인 정기 운영','지역 주민 대상 친환경 걷기 행사 개최'],image:'assets/history/2022.jpg',imageAlt:'숲에서 쓰레기를 수거하는 자원봉사자들 — 산림 정화 활동 예시'},
    {year:2021,title:'자연친화 라이프스타일 브랜드 설립',details:['자연친화 라이프스타일 브랜드 설립','브랜드 공식 홈페이지 개설','첫 자연보호 캠페인 개최'],image:'assets/history/2021-children.jpg',imageAlt:'자연 속에서 식물을 살피는 어린이들 — 활동 예시'}
  ];
  let yearIndex = 0;
  const historySection = $('.history-experience');
  const historyStage = $('.history-stage');
  const historyRail = $('.history-rail');
  function positionHistoryRail() {
    if (!historyRail || !historyStage) return;
    const stage = historyStage.getBoundingClientRect();
    const lineY = $('.history-timeline').getBoundingClientRect().top + 12;
    historyRail.style.top = `${lineY - historySection.getBoundingClientRect().top}px`;
    historyRail.style.opacity = lineY >= stage.top && lineY <= stage.bottom ? '1' : '0';
  }
  function historyGeometry() {
    if (!historySection) return;
    const pinTop = parseFloat(getComputedStyle(historySection).top) || 0;
    historyStart = $('.history-scroll').getBoundingClientRect().top + window.scrollY - pinTop;
    historyTravel = $('.history-runway').offsetHeight;
  }
  function selectHistory(index, animate = true) {
    const previousYearIndex = yearIndex;
    yearIndex = (index + historyEntries.length) % historyEntries.length;
    if (previousYearIndex !== yearIndex) $('.history-stage').scrollTop = 0;
    const entry = historyEntries[yearIndex];
    $$('.history-current-label,.history-selected-year').forEach(node => node.textContent = entry.year);
    if ($('.history-year-copy')) { $('.history-year-copy').textContent = entry.copy; $('.history-year-copy').hidden = Boolean(entry.title); }
    if ($('.history-year-title')) { $('.history-year-title').textContent = entry.title || ''; $('.history-year-title').hidden = !entry.title; }
    if ($('.history-year-details')) {
      const list = $('.history-year-details');list.replaceChildren();list.hidden = !entry.details;
      (entry.details || []).forEach(text => { const item = document.createElement('li');item.textContent = text;list.append(item); });
    }
    if ($('.history-placeholder-note')) $('.history-placeholder-note').hidden = Boolean(entry.title);
    if ($('.history-media-label')) { $('.history-media-label').textContent = `${entry.year} · 이미지 교체 예정`; $('.history-media-label').hidden = Boolean(entry.image); }
    const historyImage = $('.history-media img');
    if (historyImage) {
      historyImage.removeAttribute('srcset');
      historyImage.removeAttribute('sizes');
      historyImage.src = entry.image || 'assets/optimized/57139.webp';
      historyImage.style.objectPosition = entry.imagePosition || '50% 50%';
      historyImage.alt = entry.image ? `${entry.year}년 · ${entry.imageAlt || '연혁'}` : '연혁 이미지 교체를 위한 임시 사진';
    }
    $$('[data-history-year]').forEach((button,index) => {
      const active = Number(button.dataset.historyYear) === entry.year;
      const slot = (index - yearIndex + 9) % 6 - 3;
      button.setAttribute('aria-pressed',String(active));
      button.style.setProperty('--history-slot',slot);
      button.dataset.historySlot = slot;
      const inView = Math.abs(slot) <= (innerWidth < 768 ? 1 : 2);
      button.tabIndex = inView ? 0 : -1;
      button.setAttribute('aria-hidden',String(!inView));
    });
    if (animate && !motionPreference.matches) $$('.history-media,.history-description').forEach(node => node.animate([{opacity:.3},{opacity:1}],{duration:500,easing:'ease-out'}));
    positionHistoryRail();
  }
  let historyStart = 0;
  let historyTravel = 0;
  function navigateHistory(index) {
    const selected = (index + historyEntries.length) % historyEntries.length;
    historyGeometry();
    if (motionPreference.matches || !historyTravel) { selectHistory(selected); return; }
    cancelWheel();
    window.scrollTo({top:historyStart + (selected + .2) / historyEntries.length * historyTravel,behavior:'smooth'});
  }
  if (historySection) {
    selectHistory(0, false);
    let historyFrame = 0;
    function updateHistory() {
      historyFrame = 0;
      // Earlier reveal stages can resize after fonts or responsive copy settle.
      historyGeometry();
      const exitDistance = motionPreference.matches ? 0 : Math.max(0,window.scrollY - historyStart - historyTravel);
      const headingHeight = $('.history-heading').getBoundingClientRect().height + 48;
      historySection.style.setProperty('--history-exit-shift',`${Math.min(1,exitDistance / 180) * headingHeight}px`);
      positionHistoryRail();
      if (motionPreference.matches || !historyTravel) return;
      const progress = Math.max(0,Math.min(1,(window.scrollY - historyStart) / historyTravel));
      const next = Math.min(historyEntries.length - 1,Math.floor(progress * historyEntries.length));
      if (next !== yearIndex) selectHistory(next);
    }
    const scheduleHistory = () => { if (!historyFrame) historyFrame = requestAnimationFrame(updateHistory); };
    function measureHistory() {
      historyGeometry();
      selectHistory(yearIndex, false);
      scheduleHistory();
    }
    $$('[data-history-year]').forEach(button => button.addEventListener('click', () => navigateHistory(historyEntries.findIndex(entry => entry.year === Number(button.dataset.historyYear)))));
    window.addEventListener('scroll',scheduleHistory,{passive:true});
    window.addEventListener('resize',measureHistory,{passive:true});
    historyStage.addEventListener('scroll',positionHistoryRail,{passive:true});
    motionPreference.addEventListener('change',measureHistory);
    if ('ResizeObserver' in window) new ResizeObserver(measureHistory).observe(historySection);
    measureHistory();
  }
  let slideshowPaused = motionPreference.matches;
  let slide = 0;
  let slideProgress;
  const heroPhoto = $('.hero-photo');
  const timelineFill = $('.hero-timeline-fill');
  const playbackButton = $('.hero-playback');
  function updatePlayback() {
    if (!playbackButton) return;
    playbackButton.setAttribute('aria-pressed', String(slideshowPaused));
    playbackButton.setAttribute('aria-label', slideshowPaused ? '배너 자동 전환 재생' : '배너 자동 전환 일시정지');
    playbackButton.removeAttribute('title');
  }
  function nextSlide() {
    slide = (slide + 1) % 2;
    heroPhoto?.classList.toggle('is-alternate', Boolean(slide));
    const counter = $('.hero-current');
    if (counter) counter.textContent = String(slide + 1);
    $('.hero-count')?.setAttribute('aria-label', `배너 ${slide + 1} / 2`);
    startSlideCycle();
  }
  function startSlideCycle() {
    if (!heroPhoto || !timelineFill) return;
    slideProgress?.cancel();
    slideProgress = timelineFill.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}], {duration:6500,fill:'both',easing:'linear'});
    slideProgress.onfinish = nextSlide;
    if (slideshowPaused || document.hidden) slideProgress.pause();
  }
  updatePlayback();
  startSlideCycle();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) slideProgress?.pause();
    else if (!slideshowPaused) slideProgress?.play();
  });
  motionPreference.addEventListener('change', event => {
    if (event.matches) { slideshowPaused = true; slideProgress?.pause(); updatePlayback(); }
  });
  // Each track contains two identical groups, so its reset is visually seamless.
  $$('.community-row').forEach(row => {
    const track = document.createElement('div');
    track.className = 'marquee-track';
    const group = document.createElement('div');
    group.className = 'marquee-group';
    [...row.children].forEach(card => group.append(card));
    const copy = group.cloneNode(true);
    copy.classList.add('marquee-copy');
    $$('[data-node-id]',copy).forEach(node => node.removeAttribute('data-node-id'));
    $$('button,a',copy).forEach(control => control.tabIndex = -1);
    track.append(group,copy);
    row.append(track);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => row.classList.toggle('is-offscreen', !entry.isIntersecting)), {rootMargin:'100px'});
      observer.observe(row);
    }
  });
  const community = $('.community-section') || $('.history-experience') || $('.program-catalog');
  const footer = $('.site-footer');
  if (community && footer) {
    community.classList.add('contact-backdrop');
    footer.classList.add('footer-overlay');
    const sizeBackdrop = () => community.style.setProperty('--community-height', `${community.getBoundingClientRect().height}px`);
    sizeBackdrop();
    if ('ResizeObserver' in window) new ResizeObserver(sizeBackdrop).observe(community);
    else window.addEventListener('resize', sizeBackdrop, {passive:true});
  }
  // The white mission section scrolls upward over the held introduction image.
  const introduction = $('.about-hero');
  if (introduction) {
    document.body.classList.add('has-about-story');
    const runway = document.createElement('div');
    runway.className = 'about-story-runway';
    runway.setAttribute('aria-hidden','true');
    introduction.after(runway);
    const sizeIntroduction = () => introduction.style.setProperty('--about-hero-height',`${introduction.offsetHeight}px`);
    sizeIntroduction();
    if ('ResizeObserver' in window) new ResizeObserver(sizeIntroduction).observe(introduction);
    window.addEventListener('resize',sizeIntroduction,{passive:true});
  }
  // The introduction, mission heading, mission copy and vision each need more scroll.
  // Layout stays native so touch, keyboard input and short viewports can still move freely.
  if (introduction) {
    const paragraphs = $$('.about-intro',introduction);
    const mission = $('.mission-section');
    const copy = $('.mission-copy',mission);
    const vision = $('.vision-sequence',mission);
    const visionScroll = document.createElement('div');
    visionScroll.className = 'vision-scroll';
    vision.replaceWith(visionScroll);
    visionScroll.append(vision);
    const clamp = value => Math.max(0,Math.min(1,value));
    const documentTop = node => {
      let top = 0;
      for (let element=node; element; element=element.offsetParent) top += element.offsetTop;
      return top;
    };
    let storyFrame = 0;
    function updateStory() {
      storyFrame = 0;
      const reduced = motionPreference.matches;
      const runway = $('.about-story-runway');
      const naturalTop = runway.getBoundingClientRect().top + scrollY - introduction.offsetHeight;
      const readingStart = naturalTop + Math.min(140,Math.max(0,introduction.offsetHeight - innerHeight));
      paragraphs.forEach((paragraph,index) => {
        const progress = reduced ? 1 : clamp((scrollY - readingStart - 20 - index * 80) / 100);
        paragraph.style.setProperty('--story-copy-progress',progress);
      });
      // After the final intro paragraph, two ordinary wheel notches finish the titles.
      const titleStart = readingStart + 280 + 120;
      const copyStart = Math.max(titleStart + 220,documentTop(copy) - innerHeight * .66);
      const visionStart = Math.max(copyStart + 240,documentTop(visionScroll) - innerHeight * .6);
      const lineStart = Math.max(visionStart + 180,innerWidth < 768 ? documentTop($('.vision-line',vision)) - innerHeight * .7 : 0);
      const rightStart = Math.max(lineStart + 220,innerWidth < 768 ? documentTop($('.vision-copy',vision)) - innerHeight * .7 : 0);
      mission.style.setProperty('--mission-title-progress',reduced ? 1 : clamp((scrollY - titleStart) / 100));
      mission.style.setProperty('--mission-copy-progress',reduced ? 1 : clamp((scrollY - copyStart) / 120));
      vision.style.setProperty('--vision-left-progress',reduced ? 1 : clamp((scrollY - visionStart) / 100));
      vision.style.setProperty('--vision-line-progress',reduced ? 1 : clamp((scrollY - lineStart) / 140));
      vision.style.setProperty('--vision-right-progress',reduced ? 1 : clamp((scrollY - rightStart) / 120));
      vision.classList.toggle('is-visible',reduced || scrollY >= rightStart + 120);
    }
    const scheduleStory = () => { if (!storyFrame) storyFrame = requestAnimationFrame(updateStory); };
    window.addEventListener('scroll',scheduleStory,{passive:true});
    window.addEventListener('resize',scheduleStory,{passive:true});
    motionPreference.addEventListener('change',scheduleStory);
    if ('ResizeObserver' in window) new ResizeObserver(scheduleStory).observe(mission);
    const sizeVision = () => { visionScroll.style.setProperty('--vision-stage-height',`${vision.offsetHeight}px`);scheduleStory(); };
    if ('ResizeObserver' in window) new ResizeObserver(sizeVision).observe(vision);
    window.addEventListener('resize',sizeVision,{passive:true});
    sizeVision();
    scheduleStory();
  }
  // Wordmark position follows scroll directly instead of playing a timed entrance.
  const wordmark = $('.wordmark');
  if (wordmark) {
    let wordmarkFrame = 0;
    function updateWordmark() {
      wordmarkFrame = 0;
      const featured = wordmark.closest('.featured-programs');
      const greenTop = $('.featured-inner',featured).getBoundingClientRect().top - featured.getBoundingClientRect().top;
      wordmark.style.setProperty('--wordmark-top',`${greenTop - 145}px`);
      const progress = motionPreference.matches ? 1 : Math.max(0,Math.min(1,(innerHeight * .95 - wordmark.getBoundingClientRect().top) / Math.min(220,innerHeight * .25)));
      wordmark.style.setProperty('--wordmark-progress',progress);
    }
    const scheduleWordmark = () => { if (!wordmarkFrame) wordmarkFrame = requestAnimationFrame(updateWordmark); };
    window.addEventListener('scroll',scheduleWordmark,{passive:true});
    window.addEventListener('resize',scheduleWordmark,{passive:true});
    motionPreference.addEventListener('change',scheduleWordmark);
    scheduleWordmark();
  }
  // Reveal meaningful blocks on every page; complex sequences have their own timing.
  const fadeTargets = new Set($$('.hero-content,.search-bar,.section-title,.service-item,.mountain-card,.featured-title,.featured-card,.condition-results,.region-map,.news-heading,.notice-row,.community-section>.section-heading'));
  if (document.body.dataset.page === 'about') $$('.about-title,.history-heading,.history-stage').forEach(node => fadeTargets.add(node));
  if (document.body.dataset.page === 'programs') $$('.program-heading,.program-featured-grid .featured-card,.catalog-heading,.program-card').forEach(node => fadeTargets.add(node));
  const customTargets = $$('.cta-content,.values-content,.about-hero');
  $$('.cta-content').forEach(node => node.classList.add('brand-reveal'));
  $('.about-hero')?.classList.add('story-reveal');
  if (document.body.dataset.page === 'index') {
    $$('.service-grid,.course-grid,.featured-grid,.popular-grid,.notice-list').forEach(group => {
      [...group.children].forEach((node,index) => {
        if (fadeTargets.has(node)) { node.classList.add('motion-lift');node.style.setProperty('--reveal-delay',`${Math.min(index,5)*.1}s`); }
      });
    });
    $$('.section-title,.featured-title,.condition-results,.news-heading').forEach(node => node.classList.add('motion-lift'));
  }
  if ('IntersectionObserver' in window && !motionPreference.matches) {
    document.body.classList.add('page-enter');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const node = entry.target;
      if (node.tagName === 'IMG' && !node.complete) node.addEventListener('load', () => node.classList.add('is-visible'), {once:true});
      else node.classList.add('is-visible');
      // Fully masked text cannot intersect on its own; its visible hero starts the reveal.
      if (node.matches('.about-hero')) $('.about-title',node)?.classList.add('is-visible');
      observer.unobserve(node);
    }), {threshold:.12});
    fadeTargets.forEach(node => { node.classList.add('fade-reveal'); observer.observe(node); });
    customTargets.forEach(node => observer.observe(node));
    document.addEventListener('focusin', event => { for (const node of fadeTargets) if (node.contains(event.target)) node.classList.add('is-visible'); });
  }
  else customTargets.forEach(node => node.classList.add('is-visible'));
  // Keep each step tied to scrolling: photograph, readable copy, then immersion.
  const brandSection = $('.brand-scroll');
  if (brandSection) {
    const content = $('.cta-content',brandSection);
    const copy = $('.brand-copy',brandSection);
    let brandFrame = 0;
    const clamp = value => Math.max(0,Math.min(1,value));
    function updateBrand() {
      brandFrame = 0;
      const progress = clamp(-brandSection.getBoundingClientRect().top / Math.max(1,brandSection.offsetHeight - innerHeight));
      const titleOpacity = motionPreference.matches ? 1 : clamp((progress - .1) / .16);
      const descriptionOpacity = motionPreference.matches ? 1 : clamp((progress - .28) / .14);
      const linkOpacity = motionPreference.matches ? 1 : clamp((progress - .43) / .09);
      const expansion = motionPreference.matches ? 0 : clamp((progress - .56) / .4);
      const mobile = innerWidth < 768;
      const unit = Math.min(document.body.clientWidth,1920) / 1920;
      const baseHeight = mobile ? 360 : 450 * unit;
      content.style.setProperty('--brand-width',`${brandSection.clientWidth - (mobile ? 40 : 80 * unit) * (1 - expansion)}px`);
      content.style.setProperty('--brand-height',`${baseHeight + (innerHeight - baseHeight) * expansion}px`);
      content.style.setProperty('--brand-radius',`${(mobile ? 24 : 50 * unit) * (1 - expansion)}px`);
      content.style.setProperty('--brand-title-opacity',titleOpacity);
      content.style.setProperty('--brand-description-opacity',descriptionOpacity);
      content.style.setProperty('--brand-link-opacity',linkOpacity);
      copy.classList.toggle('copy-ready',titleOpacity > 0);
      $$('a',copy).forEach(link => { link.tabIndex = linkOpacity > .95 ? 0 : -1; link.style.pointerEvents = linkOpacity > .95 ? 'auto' : 'none'; });
    }
    const scheduleBrand = () => { if (!brandFrame) brandFrame = requestAnimationFrame(updateBrand); };
    window.addEventListener('scroll',scheduleBrand,{passive:true});
    window.addEventListener('resize',scheduleBrand,{passive:true});
    motionPreference.addEventListener('change',scheduleBrand);
    scheduleBrand();
  }
  // Subtle scroll-linked depth for the cover, brand banner and about introduction.
  const depthNodes = [$('.hero-photo')].filter(Boolean);
  let depthFrame = 0;
  function updateDepth() {
    depthFrame = 0;
    depthNodes.forEach(node => {
      const box = node.getBoundingClientRect();
      const visible = box.bottom > 0 && box.top < innerHeight;
      if (!visible && !motionPreference.matches) return;
      const progress = motionPreference.matches ? 0 : Math.max(0,Math.min(1,-box.top / Math.max(1,box.height)));
      node.style.setProperty('--depth-shift',`${progress * (node.matches('.about-hero') ? 90 : 55)}px`);
      node.style.setProperty('--depth-scale',String(1.06 - progress * .035));
    });
  }
  const scheduleDepth = () => { if (!depthFrame) depthFrame = requestAnimationFrame(updateDepth); };
  window.addEventListener('scroll',scheduleDepth,{passive:true});
  window.addEventListener('resize',scheduleDepth,{passive:true});
  motionPreference.addEventListener('change',scheduleDepth);
  scheduleDepth();
  // Circles gather at the centre, then separate as the pinned section is scrolled.
  const valuesSection = $('.values-section');
  const valuesStage = $('.values-content');
  if (valuesSection && valuesStage) {
    const circles = $$('.value-circle', valuesStage);
    let valuesFrame = 0;
    function updateValues() {
      valuesFrame = 0;
      const sectionBox = valuesSection.getBoundingClientRect();
      const travel = Math.max(1,valuesSection.offsetHeight - valuesStage.offsetHeight);
      const pinTop = parseFloat(getComputedStyle(valuesStage).top) || 0;
      const progress = motionPreference.matches ? 1 : Math.max(0,Math.min(1,((pinTop - sectionBox.top) / travel - .1) / .75));
      valuesStage.style.setProperty('--values-spread',progress);
      const stageBox = valuesStage.getBoundingClientRect();
      const gridBox = $('.values-grid',valuesStage).getBoundingClientRect();
      circles.forEach((circle,index) => {
        const item = circle.parentElement.getBoundingClientRect();
        const width = circle.offsetWidth, height = circle.offsetHeight;
        const x = stageBox.left + stageBox.width / 2 - (item.left + item.width / 2) + (index - 1.5) * 16;
        const y = gridBox.top + Math.min(gridBox.height / 2,220) - (item.top + height / 2);
        circle.style.transform = `translate(${x*(1-progress)}px,${y*(1-progress)}px)`;
      });
    }
    const scheduleValues = () => { if (!valuesFrame) valuesFrame = requestAnimationFrame(updateValues); };
    const sizeValues = () => { valuesSection.style.setProperty('--values-stage-height',`${valuesStage.offsetHeight}px`); scheduleValues(); };
    window.addEventListener('scroll',scheduleValues,{passive:true});
    window.addEventListener('resize',sizeValues,{passive:true});
    motionPreference.addEventListener('change',sizeValues);
    if ('ResizeObserver' in window) new ResizeObserver(sizeValues).observe(valuesStage);
    sizeValues();
  }
  $$('[title]').forEach(node => node.removeAttribute('title'));
  $$('.news-more,[data-action="more"],.cta-link a,.featured-more').forEach(control => {
    const arrow = $('[data-name*="arrow-up"]',control);
    if (!arrow) return;
    control.classList.add('arrow-link');
    const frame = arrow.parentElement?.parentElement || arrow;
    frame.classList.add('arrow-motion');
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 28 24');svg.setAttribute('aria-hidden','true');
    ['arrow-guide','arrow-draw'].forEach(name => {
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d','M3 12H24M17 5L24 12L17 19');path.classList.add(name);svg.append(path);
    });
    frame.replaceChildren(svg);
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const type = button.dataset.action;
    if (type === 'favorite') favorite(button);
    else if (type === 'privacy') openDialog('개인정보처리방침', '이 사이트는 이준화의 포트폴리오를 위한 시연용 웹사이트입니다.\n로그인, 결제, 예약 정보를 수집하지 않습니다.\n관심 코스와 프로그램은 현재 브라우저의 저장 공간에만 저장됩니다.');
    else if (type === 'family') openDialog('패밀리 사이트', '대한산악보전회의 프로세스를 만나보세요.', {compact:true,links:[['대한산악보전회 프로세스','https://www.figma.com/proto/uwlKkOaaMTumuTD2LVbTBm/%EC%9D%B4%EC%A4%80%ED%99%94-%ED%8F%AC%ED%8A%B8%ED%8F%B4%EB%A6%AC%EC%98%A4?node-id=1-931&viewport=-383%2C525%2C0.06&t=1Hjo59kM30bxBNBn-1&scaling=scale-down-width&content-scaling=fixed&page-id=0%3A1']]});
    else if (type === 'course-tab') {
      selectCourseTab(button);
    }
    else if (type === 'keyword') {
      $('#course-search').value = cleanText(button);query = cleanText(button); filterCourses();$('#courses').scrollIntoView({behavior:'smooth'});
    }
    else if (type === 'region') {
      selectRegion(button);
    }
    else if (type === 'more') {
      if (button.closest('.popular-section')) { selectCourseTab($('.course-tabs button')); $('#courses').scrollIntoView({behavior:'smooth'}); }
      else if (button.closest('.news-section')) $('#news')?.scrollIntoView({behavior:'smooth'});
      else toast('사진이 두 줄에서 서로 반대 방향으로 흐릅니다. 마음에 드는 사진에 하트를 눌러 보세요.');
    }
    else if (type === 'sort') {
      sortMenu.hidden = !sortMenu.hidden;
      sortButton.setAttribute('aria-expanded',String(!sortMenu.hidden));
    }
    else if (type === 'sort-option') {
      sorting = button.dataset.sort;
      const label = $('p',sortButton); if (label) label.textContent = sorting;
      $$('[role="option"]',sortMenu).forEach(option => option.setAttribute('aria-selected',String(option === button)));
      const sorted = [...programCards].sort((a,b) => {
        if (sorting === '추천순') return Number(a.dataset.originalOrder)-Number(b.dataset.originalOrder);
        if (sorting === '인기순') return popularityOrder.indexOf(Number(a.dataset.originalOrder))-popularityOrder.indexOf(Number(b.dataset.originalOrder));
        const price = card => Number((cleanText(card).match(/(\d[\d,]*)\s*원/) || ['','0'])[1].replaceAll(',',''));
        return (price(a)-price(b)) * (sorting === '낮은 가격순' ? 1 : -1);
      });
      const rows = $$('.program-row>div');
      sorted.forEach((card,index) => rows[Math.floor(index/4)]?.append(card));
      closeSort(true);
    }
    else if (type === 'history-prev') navigateHistory(yearIndex - 1);
    else if (type === 'history-next') navigateHistory(yearIndex + 1);
    else if (type === 'slideshow') {
      slideshowPaused = !slideshowPaused;
      if (slideshowPaused) slideProgress?.pause(); else slideProgress?.play();
      updatePlayback();
    }
  });
  document.addEventListener('keydown', event => {
    const element=event.target.closest('[role=button][data-action]');
    if (element && (event.key==='Enter'||event.key===' ')) { event.preventDefault(); element.click(); }
  });
  const conditionTitle=$('.condition-section .section-title');
  if(conditionTitle){const note=document.createElement('p');note.className='demo-note';note.textContent='사진·상태는 예시 · 지도는 2021년 행정경계 기준 · 실시간 통제 연동 없음';conditionTitle.append(note);}
  // Blank source logos retain their original crop and get one accessible link name.
  $$('.brand img').forEach(img=>img.alt='');
})();
