const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Inject CONFIG and update <head>
content = content.replace(
  /<title>건부니스 테니스 매칭<\/title>[\s\S]*?<\/script>/,
  `<title id="pageTitle">동호회 매칭 시스템</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    // ==========================================================
    // 💡 동호회 환경설정 (이 부분만 수정해서 사용하세요)
    // ==========================================================
    const CONFIG = {
      clubName: "동호회 이름", // 앱 곳곳에 표시될 동호회 이름
      clubSubtitle: "소속 및 설명", // 타이틀 아래에 작게 표시될 설명 (예: 건국대 부동산대학원 테니스동아리)
      sport: "테니스", // 종목 이름 (예: 테니스, 배드민턴)
      courts: ["A", "B", "C"], // 사용할 코트(또는 테이블) 이름들을 배열로 입력하세요
      adminPassword: "0000", // 관리자 화면 접속을 위한 기본 비밀번호
      primaryColor: "#10B981" // 앱의 메인 테마 색상 (HEX 코드)
    };

    // 설정된 색상을 Tailwind에 적용합니다
    tailwind.config = { theme: { extend: { colors: { primary: CONFIG.primaryColor, secondary: '#047857', dark: '#111827', accent: '#3B82F6' } } } }

    // HTML 요소에 설정값을 반영
    document.addEventListener("DOMContentLoaded", () => {
      document.getElementById("pageTitle").innerText = \`\${CONFIG.clubName} \${CONFIG.sport} 매칭\`;
      document.getElementById("titleClubName").innerText = CONFIG.clubName;
      document.getElementById("titleSubtitle").innerText = CONFIG.clubSubtitle;
      document.getElementById("specialCourtName").innerText = CONFIG.courts[CONFIG.courts.length - 1]; 
      
      let emoji = '🎾';
      if(CONFIG.sport.includes('배드민턴')) emoji = '🏸';
      else if(CONFIG.sport.includes('탁구')) emoji = '🏓';
      else if(CONFIG.sport.includes('축구') || CONFIG.sport.includes('풋살')) emoji = '⚽';
      else if(CONFIG.sport.includes('농구')) emoji = '🏀';
      document.getElementById("appTitleSport").innerText = emoji;
    });
  </script>`
);

// 2. Headings & Names
content = content.replace(
  /<h1 class="text-2xl font-black flex items-center shadow-sm">\s*<span class="bg-white text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-lg">🎾<\/span>건부니스\s*<\/h1>\s*<p class="text-\[11px\] font-medium text-emerald-100 mt-1 uppercase">건국대학교 부동산대학원 테니스동아리<\/p>/,
  `<h1 class="text-2xl font-black flex items-center shadow-sm">
          <span id="appTitleSport" class="bg-white text-primary w-8 h-8 rounded-full flex items-center justify-center mr-2 text-lg">🎾</span><span id="titleClubName">동호회 이름</span>
        </h1>
        <p id="titleSubtitle" class="text-[11px] font-medium text-emerald-100 mt-1 uppercase">소속 및 설명</p>`
);

// 3. Special court toggle name
content = content.replace(
  /<span class="font-bold text-sm text-gray-800">F 코트 임시 예약제한 \(레슨 등\)<\/span>/,
  `<span class="font-bold text-sm text-gray-800"><span id="specialCourtName">C</span> 코트 임시 예약제한 (레슨 등)</span>`
);

// 4. Input placeholder "김테니1"
content = content.replace(
  /placeholder="이름 \(동명이인은 김테니1 명시\)"/,
  `placeholder="이름 (동명이인은 숫자 추가, 예: 홍길동1)"`
);

// 5. Firebase configuration
content = content.replace(
  /const firebaseConfig = \{[\s\S]*?\};/,
  `const firebaseConfig = {
    apiKey: "", // Firebase API Key를 입력하세요 (빈칸이면 로컬 저장소로 작동합니다)
    authDomain: "", 
    databaseURL: "", // 중요: Realtime Database URL (형식: https://...firebaseio.com)
    projectId: "", 
    storageBucket: "", 
    messagingSenderId: "", 
    appId: "" 
  };`
);

// 6. DB initialization
content = content.replace(
  /const app = initializeApp\(firebaseConfig\);\s*const db = getDatabase\(app\);/,
  `let app, db;
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  }`
);

// 7. Initial AppState
content = content.replace(
  /let appState = \{ notice: "건부니스 매칭 앱에 오신 것을 환영합니다!", isFCourtDisabled: false, adminPassword: "0000", isSystemOpen: false \};/,
  `let appState = { notice: \`\${CONFIG.clubName} 매칭 앱에 환영합니다!\`, isFCourtDisabled: false, adminPassword: CONFIG.adminPassword, isSystemOpen: false };`
);

// 8. Initial Courts initialization
content = content.replace(
  /let courts = \{\s*D: \{ status: 'active', playing: null, assignedWaiting: \[\] \}, \s*E: \{ status: 'active', playing: null, assignedWaiting: \[\] \},\s*F: \{ status: 'active', playing: null, assignedWaiting: \[\] \}\s*\};/,
  `let courts = {};
  CONFIG.courts.forEach(c => { courts[c] = { status: 'active', playing: null, assignedWaiting: [] }; });`
);

// 9. Data sync fallback blocks (replacing all connectedRef to renderUI())
const newSyncBlock = `
  if (db) {
    const connectedRef = ref(db, ".info/connected");
    onValue(connectedRef, (snap) => {
      const banner = document.getElementById('offlineBanner');
      if(banner) {
         if (snap.val() === true) banner.classList.add('hidden');
         else banner.classList.remove('hidden');
      }
    });

    const dbRef = ref(db, 'tennis_data');
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if(data) {
         appState = data.appState || appState;
         regularMembers = data.regularMembers || {};
         dailyQueue = data.dailyQueue || [];
         historyLog = data.historyLog || [];
         if(data.courts) {
            CONFIG.courts.forEach(c => {
               if(data.courts[c]) courts[c] = { 
                  status: data.courts[c].status || 'active', 
                  playing: data.courts[c].playing || null, 
                  assignedWaiting: data.courts[c].assignedWaiting || [] 
               };
            });
         }
         for(let k in regularMembers) { if(!regularMembers[k].name) regularMembers[k].name = k; }
         renderUI();
      } else {
         loadFromLocal();
         saveData();
      }
    });
  } else {
    // Firebase 설정 안 된 경우 오프라인 경고 숨기기
    document.addEventListener('DOMContentLoaded', () => {
      const banner = document.getElementById('offlineBanner');
      if(banner) banner.classList.add('hidden');
      loadFromLocal();
      renderUI();
    });
  }

  function loadFromLocal() {
    const rw = localStorage.getItem('club_tennis_data');
    if(rw) {
       const p = JSON.parse(rw);
       if(p.appState) appState = p.appState;
       if(p.regularMembers) regularMembers = p.regularMembers;
       if(p.dailyQueue) dailyQueue = p.dailyQueue;
       if(p.courts) {
         CONFIG.courts.forEach(c => {
            if(p.courts[c]) {
               courts[c].status = p.courts[c].status;
               courts[c].playing = p.courts[c].playing;
               courts[c].assignedWaiting = p.courts[c].assignedWaiting || [];
            }
         });
       }
       if(p.historyLog) historyLog = p.historyLog;
    }
  }

  function saveData() { 
    if (db) set(ref(db, 'tennis_data'), { appState, regularMembers, dailyQueue, courts, historyLog }); 
    localStorage.setItem('club_tennis_data', JSON.stringify({ appState, regularMembers, dailyQueue, courts, historyLog }));
  }`;

content = content.replace(
  /const connectedRef = ref\(db, "\.info\/connected"\);[\s\S]*?function saveData\(\) \{ set\(ref\(db, 'tennis_data'\), \{ appState, regularMembers, dailyQueue, courts, historyLog \}\); \}/,
  newSyncBlock
);


// 10. Replace all arrays ['D','E','F'] with CONFIG.courts
content = content.replace(/\['D','E','F'\]/g, 'CONFIG.courts');

// 11. Replace courts.F.status in renderUI
content = content.replace(
  /courts\.F\.status = appState\.isFCourtDisabled \? 'disabled' \: 'active';/,
  `const specialC = CONFIG.courts[CONFIG.courts.length - 1];
    if (courts[specialC]) courts[specialC].status = appState.isFCourtDisabled ? 'disabled' : 'active';`
);

fs.writeFileSync('index.html', content);
console.log('Done replacement');
