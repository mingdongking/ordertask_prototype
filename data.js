// Mock data for the robot fleet management prototype
window.AppData = (() => {
  const fleets = [
    { id: "amr",  name: "Tool",   color: "#2563eb" },
    { id: "agv",  name: "WAVE",   color: "#0ea5e9" },
    { id: "arm",  name: "Parts",  color: "#7c3aed" },
    { id: "semi", name: "SEMI-x", color: "#16a34a" },
  ];

  const robots = [
    { id: "AMR-01",  fleet: "amr",  status: "run",        battery: 82, task: "PICK-2041" },
    { id: "AMR-02",  fleet: "amr",  status: "run",        battery: 64, task: "MOVE-2042" },
    { id: "AMR-03",  fleet: "amr",  status: "idle",       battery: 95, task: null },
    { id: "AMR-04",  fleet: "amr",  status: "charge",     battery: 31, task: null },
    { id: "AGV-01",  fleet: "agv",  status: "run",        battery: 71, task: "TRANS-1102" },
    { id: "AGV-02",  fleet: "agv",  status: "down",       battery: 58, task: "TRANS-1103" },
    { id: "ARM-01",  fleet: "arm",  status: "manual",     battery: 88, task: "ASSY-9001" },
    { id: "ARM-02",  fleet: "arm",  status: "disconnect", battery: 90, task: null },
    { id: "SEMI-01", fleet: "semi", status: "run",        battery: 76, task: "WAFER-2201" },
    { id: "SEMI-02", fleet: "semi", status: "idle",       battery: 92, task: null },
  ];

  // Status registry — single source of truth for labels, colors, icons across the app.
  const statuses = [
    { id: "run",        label: "가동중",     short: "가동",    color: "#10b981", bg: "#d1fae5", fg: "#047857", icon: "Activity" },
    { id: "idle",       label: "대기",       short: "대기",    color: "#94a3b8", bg: "#f1f5f9", fg: "#475569", icon: "CircleDashed" },
    { id: "down",       label: "오류",       short: "오류",    color: "#e11d48", bg: "#ffe4e6", fg: "#be123c", icon: "AlertOctagon" },
    { id: "charge",     label: "충전중",     short: "충전",    color: "#3b82f6", bg: "#dbeafe", fg: "#1d4ed8", icon: "BatteryCharging" },
    { id: "manual",     label: "수동조작",   short: "수동",    color: "#f59e0b", bg: "#fef3c7", fg: "#b45309", icon: "Hand" },
    { id: "disconnect", label: "연결끊김",   short: "끊김",    color: "#64748b", bg: "#e2e8f0", fg: "#334155", icon: "WifiOff" },
  ];
  const statusMap = Object.fromEntries(statuses.map(s => [s.id, s]));

  // Floor / map catalog used by Monitoring Home dropdown
  const floors = [
    { id: "f2", label: "Floor 2 · 자동화 라인", robots: 8 },
    { id: "f1", label: "Floor 1 · 입출고동",   robots: 4 },
    { id: "f3", label: "Floor 3 · QC 라인",    robots: 2 },
    { id: "yard", label: "옥외 · 셔틀 도크",    robots: 3 },
  ];

  // fleets: list of fleet IDs that support this action
  const actionTypes = [
    { id: "MOVE",     label: "이동",     icon: "Navigation",      color: "#2563eb", defaultDuration: 8,  fleets: ["amr","agv"] },
    { id: "LIFT",     label: "리프트",   icon: "ArrowUpFromLine", color: "#0891b2", defaultDuration: 4,  fleets: ["amr","arm"] },
    { id: "LOAD",     label: "상차",     icon: "PackagePlus",     color: "#059669", defaultDuration: 6,  fleets: ["amr","agv","arm"] },
    { id: "UNLOAD",   label: "하차",     icon: "PackageMinus",    color: "#d97706", defaultDuration: 6,  fleets: ["amr","agv","arm"] },
    { id: "SCAN",     label: "스캔",     icon: "ScanLine",        color: "#7c3aed", defaultDuration: 3,  fleets: ["amr","arm"] },
    { id: "WAIT",     label: "대기",     icon: "Pause",           color: "#64748b", defaultDuration: 5,  fleets: ["amr","agv","arm"] },
    { id: "CHARGE",   label: "충전",     icon: "BatteryCharging", color: "#16a34a", defaultDuration: 20, fleets: ["amr","agv"] },
    { id: "GRIP",     label: "그립",     icon: "Hand",            color: "#9333ea", defaultDuration: 2,  fleets: ["arm"] },
    { id: "RELEASE",  label: "릴리즈",   icon: "HandMetal",       color: "#c026d3", defaultDuration: 2,  fleets: ["arm"] },
    { id: "ROTATE",   label: "회전",     icon: "RotateCw",        color: "#0284c7", defaultDuration: 3,  fleets: ["arm"] },
    { id: "DOCK",     label: "도킹",     icon: "Anchor",          color: "#0d9488", defaultDuration: 4,  fleets: ["amr","agv"] },
  ];

  // Pre-placed nodes available on the recipe builder map (clickable to add as step)
  const mapNodes = [
    { id: "MN-1", label: "A동 입고대",   x: 110, y: 110, fleets: ["amr","agv"] },
    { id: "MN-2", label: "A동 적재 #1", x: 220, y: 110, fleets: ["amr","agv"] },
    { id: "MN-3", label: "A동 적재 #2", x: 320, y: 160, fleets: ["amr","agv"] },
    { id: "MN-4", label: "교차 통로",    x: 420, y: 220, fleets: ["amr","agv"] },
    { id: "MN-5", label: "B동 하역 #1", x: 540, y: 280, fleets: ["amr","agv"] },
    { id: "MN-6", label: "B동 하역 #2", x: 650, y: 280, fleets: ["amr","agv"] },
    { id: "MN-7", label: "QC 라인 A",   x: 540, y: 360, fleets: ["amr"] },
    { id: "MN-8", label: "QC 라인 B",   x: 650, y: 360, fleets: ["amr"] },
    { id: "MN-9", label: "충전소 1",    x: 110, y: 360, fleets: ["amr","agv"] },
    { id: "MN-10",label: "충전소 2",    x: 200, y: 360, fleets: ["amr","agv"] },
    { id: "MN-11",label: "ARM 워크셀 A",x: 360, y: 360, fleets: ["arm"] },
    { id: "MN-12",label: "ARM 워크셀 B",x: 430, y: 360, fleets: ["arm"] },
  ];

  const recipes = [
    {
      id: "rcp-01", name: "A동→B동 자재이송", fleet: "amr", status: "published",
      steps: [
        { nodeId: "N1", actionType: "MOVE",   duration: 6 },
        { nodeId: "N2", actionType: "LOAD",   duration: 5 },
        { nodeId: "N3", actionType: "MOVE",   duration: 9 },
        { nodeId: "N4", actionType: "UNLOAD", duration: 5 },
      ],
      nodes: [
        { id: "N1", x: 120, y: 140, label: "Pick-A" },
        { id: "N2", x: 280, y: 140, label: "Load-A" },
        { id: "N3", x: 460, y: 260, label: "Drop-B" },
        { id: "N4", x: 600, y: 260, label: "Stage-B" },
      ],
    },
    {
      id: "rcp-02", name: "QC 라인 검수 순회", fleet: "amr", status: "published",
      steps: [
        { nodeId: "N1", actionType: "MOVE", duration: 4 },
        { nodeId: "N2", actionType: "SCAN", duration: 3 },
        { nodeId: "N3", actionType: "MOVE", duration: 5 },
        { nodeId: "N4", actionType: "SCAN", duration: 3 },
        { nodeId: "N5", actionType: "MOVE", duration: 5 },
      ],
      nodes: [],
    },
    {
      id: "rcp-03", name: "충전 스테이션 복귀", fleet: "amr", status: "published",
      steps: [
        { nodeId: "N1", actionType: "MOVE",   duration: 7 },
        { nodeId: "N2", actionType: "CHARGE", duration: 25 },
      ],
      nodes: [],
    },
    {
      id: "rcp-04", name: "팔레트 적재 시퀀스", fleet: "arm", status: "draft",
      steps: [
        { nodeId: "N1", actionType: "WAIT", duration: 2 },
        { nodeId: "N2", actionType: "LIFT", duration: 4 },
        { nodeId: "N3", actionType: "LOAD", duration: 6 },
      ],
      nodes: [],
    },
    {
      id: "rcp-05", name: "AGV 라인 보충", fleet: "agv", status: "published",
      steps: [
        { nodeId: "N1", actionType: "MOVE",   duration: 10 },
        { nodeId: "N2", actionType: "UNLOAD", duration: 5 },
        { nodeId: "N3", actionType: "MOVE",   duration: 8 },
      ],
      nodes: [],
    },
    {
      id: "rcp-06", name: "야간 순찰 루틴", fleet: "amr", status: "draft",
      steps: [
        { nodeId: "N1", actionType: "MOVE", duration: 12 },
        { nodeId: "N2", actionType: "SCAN", duration: 3 },
        { nodeId: "N3", actionType: "MOVE", duration: 12 },
      ],
      nodes: [],
    },
  ];

  // Helper: total recipe duration in minutes
  const recipeDuration = (r) => r.steps.reduce((s, st) => s + st.duration, 0);

  // Pre-seeded gantt orders
  // Time is in minutes from 00:00. We display 06:00 - 20:00 window.
  const orders = [
    { id: "ord-001", robotId: "AMR-01", recipeId: "rcp-01", start: 8*60 + 15,  status: "done" },
    { id: "ord-002", robotId: "AMR-01", recipeId: "rcp-02", start: 9*60 + 30,  status: "done" },
    { id: "ord-003", robotId: "AMR-01", recipeId: "rcp-01", start: 11*60 + 10, status: "running" },
    { id: "ord-004", robotId: "AMR-02", recipeId: "rcp-02", start: 8*60,       status: "done" },
    { id: "ord-005", robotId: "AMR-02", recipeId: "rcp-05", status: "queued", start: 10*60 + 25 },
    { id: "ord-006", robotId: "AMR-02", recipeId: "rcp-01", start: 12*60 + 40, status: "queued" },
    { id: "ord-007", robotId: "AMR-03", recipeId: "rcp-03", start: 9*60 + 5,   status: "done" },
    { id: "ord-008", robotId: "AMR-03", recipeId: "rcp-01", start: 11*60 + 30, status: "queued" },
    { id: "ord-009", robotId: "AMR-04", recipeId: "rcp-03", start: 7*60 + 45,  status: "running" },
    { id: "ord-010", robotId: "AGV-01", recipeId: "rcp-05", start: 9*60,       status: "done" },
    { id: "ord-011", robotId: "AGV-01", recipeId: "rcp-05", start: 10*60 + 50, status: "running" },
    { id: "ord-012", robotId: "AGV-02", recipeId: "rcp-05", start: 8*60 + 20,  status: "error" },
    { id: "ord-013", robotId: "ARM-01", recipeId: "rcp-04", start: 8*60 + 30,  status: "done" },
    { id: "ord-014", robotId: "ARM-01", recipeId: "rcp-04", start: 10*60,      status: "running" },
    { id: "ord-015", robotId: "ARM-02", recipeId: "rcp-04", start: 9*60 + 15,  status: "done" },
  ];

  // Sample logs
  const logs = [
    { ts: "13:42:08", level: "info",  robot: "AMR-01", msg: "Recipe 'A동→B동 자재이송' 완료 (PICK-2041)" },
    { ts: "13:41:55", level: "warn",  robot: "AMR-04", msg: "배터리 32% 도달 - 충전 스테이션으로 라우팅" },
    { ts: "13:40:12", level: "error", robot: "AGV-02", msg: "장애물 감지 - 경로 재계산 실패" },
    { ts: "13:39:01", level: "info",  robot: "ARM-01", msg: "팔레트 적재 시퀀스 시작 (ASSY-9001)" },
    { ts: "13:37:44", level: "info",  robot: "AMR-02", msg: "노드 N3 → N4 이동 중" },
    { ts: "13:35:20", level: "info",  robot: "AGV-01", msg: "TRANS-1102 작업 디스패치 완료" },
    { ts: "13:33:02", level: "warn",  robot: "AMR-03", msg: "스케줄 갭 감지 - 대기 상태 진입" },
    { ts: "13:31:15", level: "info",  robot: "AMR-01", msg: "스캔 완료: SKU-44218 (PASS)" },
    { ts: "13:30:00", level: "info",  robot: "—",      msg: "스케줄러: 12건 디스패치 (사이클 #2204)" },
    { ts: "13:28:38", level: "info",  robot: "ARM-02", msg: "Idle 상태 진입 - 대기" },
    { ts: "13:26:11", level: "error", robot: "AGV-02", msg: "EMS 호출 - 운영자 개입 필요" },
    { ts: "13:24:50", level: "info",  robot: "AMR-02", msg: "리프트 5cm 상승" },
  ];

  // Stations / nodes catalog (for 기준 관리)
  const stations = [
    { code: "ST-A01", name: "A동 입고 스테이션", zone: "A동", x: 12, y: 8,  type: "load" },
    { code: "ST-A02", name: "A동 적재대 #2",     zone: "A동", x: 18, y: 8,  type: "load" },
    { code: "ST-B01", name: "B동 하역장",        zone: "B동", x: 32, y: 18, type: "unload" },
    { code: "ST-B02", name: "B동 검수 라인",     zone: "B동", x: 40, y: 18, type: "qc" },
    { code: "ST-C01", name: "충전소 1열",        zone: "C동", x: 6,  y: 22, type: "charge" },
    { code: "ST-C02", name: "충전소 2열",        zone: "C동", x: 6,  y: 26, type: "charge" },
  ];

  return { fleets, robots, actionTypes, recipes, orders, logs, stations, mapNodes, statuses, statusMap, floors, recipeDuration };
})();
