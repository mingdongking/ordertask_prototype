// Other views: Monitoring Home, Analytics, Basis (기준관리), Logs
const { useState: vUseState, useMemo: vUseMemo, useEffect: vUseEffect } = React;

// ─── Monitoring Home ────────────────────────────────────────────────
function MonitoringHome() {
  const robots = window.AppData.robots;
  const stations = window.AppData.stations;
  const statuses = window.AppData.statuses;
  const fleets = window.AppData.fleets;
  const floors = window.AppData.floors;
  const [focusRobot, setFocusRobot] = vUseState(null);
  const [floorId, setFloorId] = vUseState(floors[0].id);
  const [floorDropOpen, setFloorDropOpen] = vUseState(false);
  // Multi-select filters — empty Set = show all
  const [statusFilter, setStatusFilter] = vUseState(new Set());
  const [fleetFilter, setFleetFilter] = vUseState(new Set());

  function toggleSet(set, key, setter) {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  }

  // Reified robot data for the map (deterministic positions matching the markers below)
  const mapRobots = [
    { id: "AMR-01", x: 280, y: 130, fleet: "amr", st: "run",        battery: 82, task: "PICK-2041", recipe: "A동→B동 자재이송", progress: 64 },
    { id: "AMR-02", x: 420, y: 200, fleet: "amr", st: "run",        battery: 64, task: "MOVE-2042", recipe: "QC 라인 검수 순회", progress: 42 },
    { id: "AMR-03", x: 140, y: 230, fleet: "amr", st: "idle",       battery: 95, task: null, recipe: null, progress: 0 },
    { id: "AMR-04", x: 150, y: 370, fleet: "amr", st: "charge",     battery: 31, task: "CHARGE", recipe: "충전 스테이션 복귀", progress: 88 },
    { id: "AGV-01", x: 640, y: 160, fleet: "agv", st: "run",        battery: 71, task: "TRANS-1102", recipe: "AGV 라인 보충", progress: 38 },
    { id: "AGV-02", x: 580, y: 220, fleet: "agv", st: "down",       battery: 58, task: "TRANS-1103", recipe: "AGV 라인 보충", progress: 22 },
    { id: "ARM-01", x: 480, y: 380, fleet: "arm", st: "manual",     battery: 88, task: "ASSY-9001", recipe: "팔레트 적재 시퀀스 (수동)", progress: 71 },
    { id: "ARM-02", x: 540, y: 380, fleet: "arm", st: "disconnect", battery: 90, task: null, recipe: null, progress: 0 },
    { id: "SEMI-01",x: 720, y: 360, fleet: "semi", st: "run",       battery: 76, task: "WAFER-2201", recipe: "웨이퍼 핸들링", progress: 55 },
    { id: "SEMI-02",x: 780, y: 360, fleet: "semi", st: "idle",      battery: 92, task: null, recipe: null, progress: 0 },
  ];
  const visibleRobots = mapRobots.filter(r =>
    (statusFilter.size === 0 || statusFilter.has(r.st)) &&
    (fleetFilter.size === 0  || fleetFilter.has(r.fleet))
  );
  const selected = focusRobot ? mapRobots.find(r => r.id === focusRobot) : null;
  const statusCounts = Object.fromEntries(statuses.map(s => [s.id, mapRobots.filter(r => r.st === s.id).length]));
  const currentFloor = floors.find(f => f.id === floorId);

  return (
    <div className="h-full p-5 overflow-auto bg-ink-50">
      {/* KPI strip — 4 columns; col 4 stacks 금일 처리량 + 활성 알람 */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatusBreakdownCard statusCounts={statusCounts} total={mapRobots.length}/>
        <FleetStatusCard fleets={window.AppData.fleets} robots={robots}/>
        <OrderSummaryCard inProgress={14} queued={22} todayTotal={47} todayDone={31}/>
        <div className="flex flex-col gap-3 min-h-0">
          <KpiCard label="금일 처리량"  value="247" trend="+12%" icon="TrendingUp" tone="emerald"/>
          <AlertsMiniCard
            alerts={[
              { level: "error", robot: "AGV-02", msg: "장애물 감지 · EMS 호출", time: "2m" },
              { level: "warn",  robot: "AMR-04", msg: "배터리 32% · 충전 라우팅", time: "5m" },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 360px" }}>
        {/* Big map */}
        <div className="bg-white border border-ink-200 rounded-lg shadow-card overflow-hidden">
          {/* Map header */}
          <div className="h-11 px-4 border-b border-ink-200 flex items-center gap-2.5">
            <Icon name="Map" size={14} className="text-ink-500"/>
            <div className="relative">
              <button
                onClick={() => setFloorDropOpen(o => !o)}
                className="flex items-center gap-1.5 h-8 px-2 -mx-2 rounded hover:bg-ink-100"
              >
                <span className="text-[13px] font-semibold text-ink-900">{currentFloor?.label}</span>
                <Icon name="ChevronDown" size={12} className="text-ink-400"/>
              </button>
              {floorDropOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFloorDropOpen(false)}/>
                  <div className="absolute z-20 top-full mt-1 left-0 w-[260px] bg-white rounded-lg shadow-pop border border-ink-200 py-1.5 overflow-hidden">
                    {floors.map(f => (
                      <button
                        key={f.id}
                        onClick={() => { setFloorId(f.id); setFloorDropOpen(false); }}
                        className={"w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-blue-50 " + (f.id === floorId ? "bg-blue-50" : "")}
                      >
                        <Icon name="Map" size={13} className={f.id === floorId ? "text-blue-600" : "text-ink-400"}/>
                        <div className="flex-1 min-w-0">
                          <div className={"text-[12.5px] font-medium " + (f.id === floorId ? "text-blue-700" : "text-ink-900")}>{f.label}</div>
                          <div className="text-[10.5px] text-ink-500 tnum">{f.robots}대 운영</div>
                        </div>
                        {f.id === floorId && <Icon name="Check" size={12} className="text-blue-600"/>}
                      </button>
                    ))}
                    <div className="border-t border-ink-200 mt-1 pt-1 px-3 py-1.5 text-[10.5px] text-ink-500 flex items-center gap-1.5">
                      <Icon name="Settings" size={10}/> 맵 관리 →
                    </div>
                  </div>
                </>
              )}
            </div>
            <span className="ml-1 text-[11px] text-ink-500">실시간 · {visibleRobots.length}/{mapRobots.length} 표시</span>
            <div className="ml-auto flex items-center gap-1">
              <button className="h-7 px-2 rounded text-[11.5px] text-ink-600 hover:bg-ink-100 flex items-center gap-1"><Icon name="Layers" size={11}/> 레이어</button>
              <button className="h-7 px-2 rounded text-[11.5px] text-ink-600 hover:bg-ink-100 flex items-center gap-1"><Icon name="Maximize2" size={11}/> 전체화면</button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="px-4 py-2 border-b border-ink-200 bg-ink-50/40 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-[10.5px] font-medium text-ink-500 uppercase tracking-wider mr-1">상태</span>
              <button
                onClick={() => setStatusFilter(new Set())}
                className={"h-6 px-2 rounded text-[10.5px] font-medium border " +
                  (statusFilter.size === 0 ? "bg-ink-900 text-white border-ink-900" : "bg-white text-ink-600 border-ink-200 hover:bg-ink-50")
                }
              >전체</button>
              {statuses.map(s => {
                const on = statusFilter.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSet(statusFilter, s.id, setStatusFilter)}
                    className={"h-6 px-2 rounded text-[10.5px] font-medium border flex items-center gap-1 transition " +
                      (on ? "border-transparent text-white" : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50")
                    }
                    style={on ? { background: s.color } : {}}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? "#fff" : s.color }}/>
                    {s.short}
                    <span className={"tnum " + (on ? "opacity-80" : "text-ink-400")}>{statusCounts[s.id]}</span>
                  </button>
                );
              })}
            </div>
            <div className="h-4 w-px bg-ink-200"/>
            <div className="flex items-center gap-1">
              <span className="text-[10.5px] font-medium text-ink-500 uppercase tracking-wider mr-1">Fleet</span>
              <button
                onClick={() => setFleetFilter(new Set())}
                className={"h-6 px-2 rounded text-[10.5px] font-medium border " +
                  (fleetFilter.size === 0 ? "bg-ink-900 text-white border-ink-900" : "bg-white text-ink-600 border-ink-200 hover:bg-ink-50")
                }
              >전체</button>
              {fleets.map(f => {
                const on = fleetFilter.has(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleSet(fleetFilter, f.id, setFleetFilter)}
                    className={"h-6 px-2 rounded text-[10.5px] font-medium border flex items-center gap-1 transition " +
                      (on ? "border-transparent text-white" : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50")
                    }
                    style={on ? { background: f.color } : {}}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? "#fff" : f.color }}/>
                    {f.id.toUpperCase()}
                  </button>
                );
              })}
            </div>
            {(statusFilter.size > 0 || fleetFilter.size > 0) && (
              <button
                onClick={() => { setStatusFilter(new Set()); setFleetFilter(new Set()); }}
                className="ml-auto h-6 px-2 rounded text-[10.5px] font-medium text-ink-500 hover:text-ink-900 flex items-center gap-1"
              >
                <Icon name="X" size={10}/> 필터 초기화
              </button>
            )}
          </div>
          <div className="relative dot-bg" style={{ height: 480 }}>
            {/* zones */}
            <div className="absolute top-[44px] left-[44px] w-[260px] h-[140px] rounded-md border border-blue-200/80 bg-blue-50/30">
              <span className="absolute top-1.5 left-2 text-[10px] font-medium tracking-wider uppercase text-blue-700/70">Zone A · 입고</span>
            </div>
            <div className="absolute top-[44px] right-[44px] w-[280px] h-[160px] rounded-md border border-emerald-200/80 bg-emerald-50/30">
              <span className="absolute top-1.5 left-2 text-[10px] font-medium tracking-wider uppercase text-emerald-700/70">Zone B · 하역</span>
            </div>
            <div className="absolute bottom-[44px] left-[44px] w-[200px] h-[80px] rounded-md border border-ink-200 bg-ink-100/40">
              <span className="absolute top-1.5 left-2 text-[10px] font-medium tracking-wider uppercase text-ink-500">Zone C · 충전</span>
            </div>
            <div className="absolute bottom-[44px] right-[160px] w-[240px] h-[100px] rounded-md border border-purple-200/80 bg-purple-50/30">
              <span className="absolute top-1.5 left-2 text-[10px] font-medium tracking-wider uppercase text-purple-700/70">Zone D · 조립</span>
            </div>

            {/* Stations */}
            {[
              { x: 90, y: 100, label: "ST-A01", type: "load" },
              { x: 200, y: 100, label: "ST-A02", type: "load" },
              { x: 280, y: 160, label: "ST-A03", type: "load" },
              { x: 540, y: 110, label: "ST-B01", type: "unload" },
              { x: 660, y: 130, label: "ST-B02", type: "qc" },
              { x: 760, y: 90,  label: "ST-B03", type: "unload" },
              { x: 90, y: 370, label: "CH-1", type: "charge" },
              { x: 150, y: 370, label: "CH-2", type: "charge" },
              { x: 210, y: 370, label: "CH-3", type: "charge" },
              { x: 480, y: 380, label: "ARM-W", type: "arm" },
            ].map((s, i) => (
              <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: s.x, top: s.y }}>
                <div className={"w-3 h-3 rounded-sm border-2 bg-white " +
                  (s.type === "load" ? "border-blue-500" :
                   s.type === "unload" ? "border-emerald-500" :
                   s.type === "qc" ? "border-purple-500" :
                   s.type === "charge" ? "border-amber-500" : "border-ink-400")
                }/>
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-medium text-ink-500 tnum whitespace-nowrap">{s.label}</div>
              </div>
            ))}

            {/* Paths */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path d="M 100 100 Q 220 70 360 130 T 660 130" stroke="#cbd5e1" strokeWidth="1.5" fill="none" strokeDasharray="3 3"/>
              <path d="M 100 370 Q 250 320 480 380" stroke="#cbd5e1" strokeWidth="1.5" fill="none" strokeDasharray="3 3"/>
            </svg>

            {/* Robots on the map */}
            {mapRobots.map((r) => {
              const isFocus = focusRobot === r.id;
              const isVisible = visibleRobots.includes(r);
              const sm = window.AppData.statusMap[r.st];
              const fm = window.AppData.fleets.find(f => f.id === r.fleet) || { color: "#64748b" };
              return (
                <div
                  key={r.id}
                  onClick={() => isVisible && setFocusRobot(focusRobot === r.id ? null : r.id)}
                  className={"absolute -translate-x-1/2 -translate-y-1/2 transition-opacity " +
                    (isVisible ? "cursor-pointer group opacity-100" : "opacity-15 grayscale pointer-events-none")
                  }
                  style={{ left: r.x, top: r.y }}
                >
                  {r.st === "run" && isVisible && (
                    <div className="absolute inset-0 w-8 h-8 rounded-full pulse-ring border-2" style={{ borderColor: fm.color, left: -16, top: -16 }}/>
                  )}
                  <div
                    className={"w-8 h-8 rounded-full grid place-items-center shadow-md border-2 text-white text-[10px] font-bold transition relative " + (isFocus ? "scale-125 z-10 ring-4 ring-blue-300/40" : "")}
                    style={{ background: fm.color, borderColor: "white" }}
                  >
                    <Icon name={r.id.startsWith("ARM") ? "Cog" : "Bot"} size={13}/>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: sm.color }}/>
                  </div>
                  <div className={"absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] font-semibold tnum whitespace-nowrap px-1 rounded " + (isFocus ? "bg-ink-900 text-white" : "text-ink-700")}>{r.id}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column — Command / Properties panel */}
        <CommandPropsPanel
          selectedRobot={selected}
          mapRobots={mapRobots}
          onClose={() => setFocusRobot(null)}
        />
      </div>

      {/* Secondary row: Fleet status / Alerts */}
      <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Fleet summary */}
        <div className="bg-white border border-ink-200 rounded-lg shadow-card overflow-hidden">
          <div className="h-11 px-4 border-b border-ink-200 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink-900">Fleet 상태</span>
            <span className="text-[11px] text-ink-400">실시간</span>
          </div>
          <div className="divide-y divide-ink-100">
            {window.AppData.fleets.map(f => {
              const fr = robots.filter(r => r.fleet === f.id);
              const running = fr.filter(r => r.status === "run").length;
              const pct = fr.length ? Math.round((running / fr.length) * 100) : 0;
              return (
                <div key={f.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: f.color }}/>
                    <span className="text-[12.5px] font-medium text-ink-900">{f.name}</span>
                    <span className="ml-auto text-[11.5px] text-ink-500 tnum">{running}/{fr.length} 가동</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: pct + "%", background: f.color }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active alerts (moved into where avg cycle used to be) */}
        <div className="bg-white border border-ink-200 rounded-lg shadow-card overflow-hidden">
          <div className="h-11 px-4 border-b border-ink-200 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink-900">활성 알람</span>
            <span className="text-[11px] font-medium text-rose-600 tnum">2건</span>
          </div>
          <div className="divide-y divide-ink-100">
            <AlertRow level="error" robot="AGV-02" msg="장애물 감지 · EMS 호출" time="2m"/>
            <AlertRow level="warn"  robot="AMR-04" msg="배터리 32% · 충전 라우팅" time="5m"/>
          </div>
        </div>
      </div>
    </div>
  );
}

// Robot-detail card shown in the right column when a robot is selected on the map
function RobotTaskPanel({ robot, onClose }) {
  if (!robot) {
    return (
      <div className="bg-white border border-dashed border-ink-300 rounded-lg p-5 text-center">
        <div className="w-9 h-9 mx-auto rounded-full bg-ink-50 grid place-items-center mb-2">
          <Icon name="Bot" size={16} className="text-ink-400"/>
        </div>
        <div className="text-[12.5px] font-medium text-ink-700">로봇 선택 안 됨</div>
        <div className="text-[11px] text-ink-500 mt-0.5 leading-relaxed">맵에서 로봇을 클릭하면<br/>현재 작업 정보가 표시됩니다.</div>
      </div>
    );
  }
  const sm = window.AppData.statusMap[robot.st];
  const fm = window.AppData.fleets.find(f => f.id === robot.fleet) || { color: "#64748b" };
  return (
    <div className="bg-white border border-ink-200 rounded-lg shadow-card overflow-hidden">
      <div className="px-4 pt-3 pb-2.5 border-b border-ink-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md grid place-items-center text-white" style={{ background: fm.color }}>
            <Icon name={robot.id.startsWith("ARM") ? "Cog" : "Bot"} size={15}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13.5px] font-semibold text-ink-900 tnum">{robot.id}</span>
              <span className="text-[10px] font-semibold px-1.5 py-px rounded flex items-center gap-1" style={{ background: sm.bg, color: sm.fg }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: sm.color }}/>
                {sm.label}
              </span>
            </div>
            <div className="text-[10.5px] text-ink-500 mt-0.5 tnum">위치 X:{robot.x} Y:{robot.y}</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 grid place-items-center rounded hover:bg-ink-100 text-ink-500"><Icon name="X" size={13}/></button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div>
          <div className="text-[10px] font-medium text-ink-400 uppercase tracking-wider mb-1">현재 수행 작업</div>
          {robot.task ? (
            <div>
              <div className="text-[13px] font-semibold text-ink-900">{robot.recipe}</div>
              <div className="text-[11px] text-ink-500 mt-0.5 tnum flex items-center gap-1.5">
                <Icon name="Hash" size={10}/> {robot.task}
                <span className="text-ink-300">·</span>
                <Icon name="Clock" size={10}/> 약 12분 잔여
              </div>
            </div>
          ) : robot.st === "disconnect" ? (
            <div className="text-[12px] text-ink-700 italic flex items-center gap-1.5">
              <Icon name="WifiOff" size={12} className="text-ink-500"/> 통신 두절 — 마지막 핑 2분 전
            </div>
          ) : (
            <div className="text-[12px] text-ink-500 italic">현재 할당된 작업 없음</div>
          )}
        </div>

        {robot.task && robot.st !== "disconnect" && (
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-ink-500">진행률</span>
              <span className="text-ink-900 font-semibold tnum">{robot.progress}%</span>
            </div>
            <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: robot.progress + "%", background: sm.color }}/>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10.5px] text-ink-500 tnum">
              <span>3 / 5 단계 완료</span>
              <span>이동 → 스캔 → <span className="text-ink-900 font-medium">현재: 하차</span></span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <MetricBox icon="BatteryMedium" label="배터리" value={robot.battery + "%"} pct={robot.battery} barColor={robot.battery > 50 ? "#10b981" : robot.battery > 25 ? "#f59e0b" : "#e11d48"}/>
          <MetricBox icon="Gauge" label="속도" value={robot.st === "run" ? "0.8 m/s" : "0.0 m/s"} pct={robot.st === "run" ? 65 : 0} barColor="#2563eb"/>
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-ink-200 bg-ink-50/50 flex items-center gap-1.5">
        <button className="flex-1 h-7 rounded text-[11.5px] font-medium text-ink-700 hover:bg-white border border-ink-200 bg-white flex items-center justify-center gap-1"><Icon name="Eye" size={11}/> 상세</button>
        <button className="flex-1 h-7 rounded text-[11.5px] font-medium text-ink-700 hover:bg-white border border-ink-200 bg-white flex items-center justify-center gap-1"><Icon name="Pause" size={11}/> 정지</button>
        <button className="flex-1 h-7 rounded text-[11.5px] font-medium text-rose-600 hover:bg-white border border-rose-200 bg-white flex items-center justify-center gap-1"><Icon name="AlertOctagon" size={11}/> EMS</button>
      </div>
    </div>
  );
}

function MetricBox({ icon, label, value, pct, barColor }) {
  return (
    <div className="rounded-md border border-ink-200 bg-ink-50/40 p-2">
      <div className="flex items-center gap-1.5 text-[10.5px] text-ink-500">
        <Icon name={icon} size={11}/> {label}
      </div>
      <div className="text-[13px] font-semibold text-ink-900 mt-0.5 tnum">{value}</div>
      <div className="h-1 mt-1 bg-white rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: pct + "%", background: barColor }}/>
      </div>
    </div>
  );
}

function StatusBreakdownCard({ statusCounts, total }) {
  const statuses = window.AppData.statuses;
  const run  = statuses.find(s => s.id === "run");
  const down = statuses.find(s => s.id === "down");
  return (
    <div className="bg-white border border-ink-200 rounded-lg p-3.5 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11.5px] text-ink-500">로봇 운영 현황</span>
        <span className="text-[10.5px] text-ink-400 tnum">총 {total}대</span>
      </div>
      {/* 가동 · 오류 dual emphasis */}
      <div className="flex items-baseline gap-4 mb-2.5">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-semibold tnum tracking-tight" style={{ color: run.fg }}>{statusCounts.run}</span>
            <span className="text-[11px] text-ink-500">/ {total}</span>
          </div>
          <div className="text-[10.5px] font-medium mt-px flex items-center gap-1" style={{ color: run.fg }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: run.color }}/> 가동
          </div>
        </div>
        <div className="h-9 w-px bg-ink-200"/>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-semibold tnum tracking-tight" style={{ color: down.fg }}>{statusCounts.down}</span>
            <span className="text-[11px] text-ink-500">대</span>
          </div>
          <div className="text-[10.5px] font-medium mt-px flex items-center gap-1" style={{ color: down.fg }}>
            <Icon name="AlertOctagon" size={10}/> 오류
          </div>
        </div>
      </div>
      {/* Stacked bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden bg-ink-100 mb-2">
        {statuses.map(s => {
          const c = statusCounts[s.id] || 0;
          if (c === 0) return null;
          const pct = (c / total) * 100;
          return <div key={s.id} style={{ width: pct + "%", background: s.color }} title={`${s.label} ${c}`}/>;
        })}
      </div>
      {/* 6-status chip grid */}
      <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-[10.5px]">
        {statuses.map(s => (
          <div key={s.id} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }}/>
            <span className="text-ink-600">{s.short}</span>
            <span className="ml-auto font-semibold text-ink-900 tnum">{statusCounts[s.id] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Combined Order summary card — replaces 진행 중 오더 + 대기 큐
function OrderSummaryCard({ inProgress, queued, todayTotal, todayDone }) {
  const donePct = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 0;
  return (
    <div className="bg-white border border-ink-200 rounded-lg p-3.5 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11.5px] text-ink-500">Order 현황</span>
        <div className="flex items-center gap-1 text-[10.5px] text-ink-400">
          <Icon name="ListTodo" size={11}/>
          <span className="tnum">총 {todayTotal}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-4 mb-2">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-semibold text-blue-700 tnum tracking-tight">{inProgress}</span>
            <span className="text-[11px] text-ink-500">건</span>
          </div>
          <div className="text-[10.5px] font-medium mt-px flex items-center gap-1 text-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"/> 진행 중
          </div>
        </div>
        <div className="h-9 w-px bg-ink-200"/>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-semibold text-amber-700 tnum tracking-tight">{queued}</span>
            <span className="text-[11px] text-ink-500">건</span>
          </div>
          <div className="text-[10.5px] font-medium mt-px flex items-center gap-1 text-amber-700">
            <Icon name="Clock" size={10}/> 대기 큐
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10.5px]">
        <span className="text-ink-500">금일 완료율</span>
        <div className="flex-1 h-1 bg-ink-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: donePct + "%" }}/>
        </div>
        <span className="text-ink-900 font-semibold tnum">{donePct}%</span>
        <span className="text-ink-400 tnum">{todayDone}/{todayTotal}</span>
      </div>
    </div>
  );
}

function KpiCard({ label, value, trend, icon, tone }) {  const toneCfg = {
    emerald: "text-emerald-500 bg-emerald-50",
    blue:    "text-blue-500 bg-blue-50",
    slate:   "text-ink-500 bg-ink-100",
    rose:    "text-rose-500 bg-rose-50",
  }[tone];
  const trendUp = trend && (trend.startsWith("+") && !trend.startsWith("+0"));
  return (
    <div className="bg-white border border-ink-200 rounded-lg p-3.5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] text-ink-500">{label}</span>
        <div className={"w-7 h-7 rounded-md grid place-items-center " + toneCfg}>
          <Icon name={icon} size={13}/>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <div className="text-[22px] font-semibold text-ink-900 tnum tracking-tight">{value}</div>
        {trend && (
          <span className={"text-[10.5px] font-medium tnum " + (trendUp ? "text-emerald-600" : "text-ink-500")}>{trend}</span>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, pct }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10.5px]">
        <span className="text-ink-500">{label}</span>
        <span className="text-ink-700 font-medium tnum">{value}</span>
      </div>
      <div className="h-1 mt-0.5 bg-ink-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: pct + "%" }}/>
      </div>
    </div>
  );
}

function AlertRow({ level, robot, msg, time }) {
  const lvCfg = level === "error"
    ? { bg: "bg-rose-50", icon: "AlertOctagon", color: "text-rose-600" }
    : { bg: "bg-amber-50", icon: "AlertTriangle", color: "text-amber-600" };
  return (
    <div className="px-4 py-2.5 flex items-start gap-2.5">
      <div className={"w-7 h-7 rounded-md grid place-items-center shrink-0 " + lvCfg.bg}>
        <Icon name={lvCfg.icon} size={13} className={lvCfg.color}/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11.5px] font-semibold text-ink-900 tnum">{robot}</span>
          <span className="text-[10.5px] text-ink-400 tnum">· {time} 전</span>
        </div>
        <div className="text-[11.5px] text-ink-700 mt-0.5">{msg}</div>
      </div>
      <button className="text-[10.5px] font-medium text-blue-600 hover:text-blue-700">처리</button>
    </div>
  );
}

function Sparkline({ values, color, height = 40 }) {
  const w = 280, h = height, pad = 4;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / (max - min || 1)) * (h - pad * 2);
    return [x, y];
  });
  const path = points.map((p, i) => (i === 0 ? "M" : "L") + p[0] + " " + p[1]).join(" ");
  const area = path + " L " + points[points.length - 1][0] + " " + (h - pad) + " L " + pad + " " + (h - pad) + " Z";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full mt-2" style={{ height }}>
      <path d={area} fill={color} opacity="0.08"/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p, i) => i === points.length - 1 && (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color}/>
      ))}
    </svg>
  );
}

// ─── Analytics dashboard ────────────────────────────────────────────
function AnalyticsView() {
  return (
    <div className="h-full overflow-auto p-6 bg-ink-50">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold text-ink-900 tracking-tight">분석 대시보드</h1>
          <p className="text-[12.5px] text-ink-500 mt-0.5">가동률 · 처리량 · 사이클 타임 추이</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-ink-200 rounded-md p-0.5">
            {["오늘","주","월","분기"].map((v, i) => (
              <button key={v} className={"h-7 px-3 rounded text-[12px] font-medium " + (i === 1 ? "bg-ink-100 text-ink-900" : "text-ink-500 hover:bg-ink-50")}>{v}</button>
            ))}
          </div>
          <button className="h-8 px-3 rounded-md border border-ink-200 bg-white hover:bg-ink-50 text-[12.5px] font-medium text-ink-700 flex items-center gap-1.5">
            <Icon name="Download" size={13}/> 내보내기
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <KpiCard label="가동률"        value="78.4%" trend="+3.2%" icon="Gauge"      tone="emerald"/>
        <KpiCard label="작업 완료율"   value="94.1%" trend="+1.1%" icon="CheckCircle2" tone="emerald"/>
        <KpiCard label="평균 사이클"   value="8.2분" trend="-0.4m" icon="Timer"      tone="blue"/>
        <KpiCard label="오류율"        value="1.8%"  trend="+0.3%" icon="AlertTriangle" tone="rose"/>
      </div>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <ChartCard title="시간대별 처리량" subtitle="단위: 작업">
          <BarChart data={[
            ["06", 12], ["07", 24], ["08", 38], ["09", 52], ["10", 64], ["11", 71],
            ["12", 48], ["13", 66], ["14", 72], ["15", 78], ["16", 64], ["17", 42],
            ["18", 28], ["19", 18]
          ]}/>
        </ChartCard>
        <ChartCard title="Fleet 별 가동률" subtitle="실시간">
          <Donut segments={[
            { label: "AMR", value: 82, color: "#2563eb" },
            { label: "AGV", value: 71, color: "#0ea5e9" },
            { label: "ARM", value: 88, color: "#7c3aed" },
          ]}/>
        </ChartCard>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <ChartCard title="사이클 타임 추이" subtitle="최근 14일">
          <LineChart series={[
            { label: "AMR", color: "#2563eb", values: [9.2,8.8,9.1,8.6,8.3,8.5,8.2,8.0,7.9,8.1,7.8,7.7,7.9,7.6] },
            { label: "AGV", color: "#0ea5e9", values: [10.4,10.1,10.3,9.8,9.6,9.9,9.4,9.2,9.5,9.1,9.0,9.2,8.9,8.7] },
          ]} yLabel="분"/>
        </ChartCard>
        <ChartCard title="레시피 별 호출 빈도" subtitle="이번 주 Top 5">
          <RankedBars items={[
            { label: "A동→B동 자재이송",   value: 84, color: "#2563eb" },
            { label: "QC 라인 검수 순회",   value: 62, color: "#0ea5e9" },
            { label: "AGV 라인 보충",      value: 48, color: "#7c3aed" },
            { label: "충전 스테이션 복귀",  value: 36, color: "#94a3b8" },
            { label: "팔레트 적재 시퀀스",  value: 22, color: "#94a3b8" },
          ]}/>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white border border-ink-200 rounded-lg shadow-card overflow-hidden">
      <div className="h-11 px-4 border-b border-ink-200 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-ink-900">{title}</div>
          {subtitle && <div className="text-[10.5px] text-ink-500">{subtitle}</div>}
        </div>
        <button className="w-6 h-6 grid place-items-center rounded hover:bg-ink-100 text-ink-400"><Icon name="MoreHorizontal" size={13}/></button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function BarChart({ data }) {
  const w = 600, h = 200, pad = { l: 28, r: 8, t: 8, b: 22 };
  const max = Math.max(...data.map(d => d[1]));
  const bw = (w - pad.l - pad.r) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 200 }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = pad.t + (1 - t) * (h - pad.t - pad.b);
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#e2e8f0" strokeDasharray={i === 4 ? "" : "2 2"}/>
            <text x={pad.l - 6} y={y + 3} textAnchor="end" className="fill-ink-400" style={{ fontSize: 9 }}>{Math.round(t * max)}</text>
          </g>
        );
      })}
      {data.map(([label, val], i) => {
        const x = pad.l + i * bw + bw * 0.2;
        const bh = (val / max) * (h - pad.t - pad.b);
        const y = h - pad.b - bh;
        return (
          <g key={label}>
            <rect x={x} y={y} width={bw * 0.6} height={bh} fill="#2563eb" rx="2"/>
            <text x={x + bw * 0.3} y={h - pad.b + 12} textAnchor="middle" className="fill-ink-500" style={{ fontSize: 9 }}>{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Donut({ segments }) {
  const cx = 100, cy = 100, r = 70, sw = 18;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 200 200" style={{ width: 180, height: 180 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw}/>
        {segments.map((s, i) => {
          const len = (s.value / 100) * (C / 3);
          const dash = `${len} ${C - len}`;
          const el = (
            <circle key={i}
              cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={sw}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="round"
            />
          );
          offset += len + 6;
          return el;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-ink-900" style={{ fontSize: 22, fontWeight: 600 }}>80.3%</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-ink-500" style={{ fontSize: 10 }}>avg utilization</text>
      </svg>
      <div className="space-y-2 flex-1">
        {segments.map(s => (
          <div key={s.label}>
            <div className="flex items-center gap-2 text-[12px]">
              <span className="w-2 h-2 rounded-sm" style={{ background: s.color }}/>
              <span className="text-ink-700">{s.label}</span>
              <span className="ml-auto font-medium text-ink-900 tnum">{s.value}%</span>
            </div>
            <div className="mt-1 h-1 bg-ink-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ background: s.color, width: s.value + "%" }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ series, yLabel }) {
  const w = 600, h = 200, pad = { l: 28, r: 8, t: 8, b: 22 };
  const N = series[0].values.length;
  const all = series.flatMap(s => s.values);
  const max = Math.max(...all) * 1.1;
  const min = Math.min(...all) * 0.9;
  const xy = (s, i) => [
    pad.l + (i / (N - 1)) * (w - pad.l - pad.r),
    pad.t + (1 - (s - min) / (max - min)) * (h - pad.t - pad.b),
  ];
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 200 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = pad.t + (1 - t) * (h - pad.t - pad.b);
          const v = min + (max - min) * t;
          return (
            <g key={i}>
              <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#e2e8f0" strokeDasharray={i === 0 ? "" : "2 2"}/>
              <text x={pad.l - 6} y={y + 3} textAnchor="end" className="fill-ink-400" style={{ fontSize: 9 }}>{v.toFixed(1)}</text>
            </g>
          );
        })}
        {series.map(s => {
          const pts = s.values.map((v, i) => xy(v, i));
          const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0] + " " + p[1]).join(" ");
          return (
            <g key={s.label}>
              <path d={path} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2" fill={s.color}/>)}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mt-2 pl-7">
        {series.map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-[11.5px]">
            <span className="w-2.5 h-0.5 rounded-full" style={{ background: s.color }}/>
            <span className="text-ink-600">{s.label}</span>
          </div>
        ))}
        <span className="ml-auto text-[10.5px] text-ink-400">{yLabel}</span>
      </div>
    </div>
  );
}

function RankedBars({ items }) {
  const max = Math.max(...items.map(i => i.value));
  return (
    <div className="space-y-2.5">
      {items.map((it, i) => (
        <div key={it.label}>
          <div className="flex items-center justify-between text-[12px] mb-1">
            <span className="text-ink-700 font-medium">{it.label}</span>
            <span className="text-ink-500 tnum">{it.value}</span>
          </div>
          <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ background: it.color, width: (it.value / max * 100) + "%" }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Basis (기준 관리 정보) ────────────────────────────────────────
function BasisView() {
  const tabs = ["스테이션", "Fleet · 로봇", "Action 마스터", "안전 영역", "경로 그래프"];
  const [tab, setTab] = vUseState(0);
  const stations = window.AppData.stations;
  return (
    <div className="h-full overflow-auto p-6 bg-ink-50">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="text-[20px] font-semibold text-ink-900 tracking-tight">기준 관리 정보</h1>
          <p className="text-[12.5px] text-ink-500 mt-0.5">맵, 스테이션, Fleet 등 시스템의 기준 데이터를 관리합니다.</p>
        </div>
        <button className="h-9 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-medium flex items-center gap-1.5">
          <Icon name="Plus" size={13}/> 스테이션 추가
        </button>
      </div>
      <div className="bg-white border border-ink-200 rounded-lg shadow-card overflow-hidden">
        <div className="h-11 px-3 border-b border-ink-200 flex items-center gap-1">
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={"h-8 px-3 rounded text-[12.5px] font-medium " +
                (tab === i ? "bg-blue-50 text-blue-700" : "text-ink-600 hover:bg-ink-50")
              }>
              {t}
            </button>
          ))}
        </div>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-[11.5px] text-ink-500 border-b border-ink-200">
              <th className="font-medium px-4 py-2.5">코드</th>
              <th className="font-medium py-2.5">이름</th>
              <th className="font-medium py-2.5">Zone</th>
              <th className="font-medium py-2.5">유형</th>
              <th className="font-medium py-2.5">좌표 (X, Y)</th>
              <th className="font-medium py-2.5">사용 중</th>
              <th className="font-medium py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {stations.map(s => (
              <tr key={s.code} className="border-b border-ink-100 hover:bg-ink-50/50">
                <td className="px-4 py-3 font-mono text-[11.5px] text-ink-900">{s.code}</td>
                <td className="py-3 font-medium text-ink-900">{s.name}</td>
                <td className="py-3 text-ink-700">{s.zone}</td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-ink-100 text-ink-700 text-[11px]">{s.type}</span>
                </td>
                <td className="py-3 tnum text-ink-600">{s.x.toFixed(1)}, {s.y.toFixed(1)}</td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> 활성
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <button className="w-7 h-7 grid place-items-center rounded hover:bg-ink-100 text-ink-500"><Icon name="MoreHorizontal" size={13}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Logs ──────────────────────────────────────────────────────────
function LogsView() {
  const logs = window.AppData.logs;
  const [filter, setFilter] = vUseState("all");
  const filtered = logs.filter(l => filter === "all" || l.level === filter);

  return (
    <div className="h-full flex flex-col bg-ink-50">
      <div className="h-12 px-5 border-b border-ink-200 bg-white flex items-center gap-3">
        <Icon name="ScrollText" size={14} className="text-ink-500"/>
        <span className="text-[13.5px] font-semibold text-ink-900">시스템 로그</span>
        <div className="ml-2 flex items-center gap-1">
          {[
            { id: "all",   label: "전체",   count: logs.length },
            { id: "info",  label: "Info",   count: logs.filter(l => l.level === "info").length },
            { id: "warn",  label: "Warn",   count: logs.filter(l => l.level === "warn").length },
            { id: "error", label: "Error",  count: logs.filter(l => l.level === "error").length },
          ].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              className={"h-7 px-2.5 rounded text-[11.5px] font-medium flex items-center gap-1.5 " +
                (filter === t.id ? "bg-ink-100 text-ink-900" : "text-ink-600 hover:bg-ink-100/60")
              }>
              {t.label} <span className="text-ink-400 tnum">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Icon name="Search" size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400"/>
            <input placeholder="로봇 ID, 메시지 검색" className="h-8 pl-7 pr-3 rounded-md border border-ink-200 bg-white text-[12px] w-[240px] outline-none focus:border-blue-400"/>
          </div>
          <button className="h-8 px-3 rounded-md border border-ink-200 bg-white hover:bg-ink-50 text-[12.5px] font-medium text-ink-700 flex items-center gap-1.5">
            <Icon name="Download" size={13}/> CSV
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-5">
        <div className="bg-white border border-ink-200 rounded-lg shadow-card overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[11px] text-ink-500 border-b border-ink-200">
                <th className="font-medium px-4 py-2.5 w-24">시각</th>
                <th className="font-medium py-2.5 w-20">레벨</th>
                <th className="font-medium py-2.5 w-28">소스</th>
                <th className="font-medium py-2.5">메시지</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => {
                const lvCfg = l.level === "error" ? "text-rose-600 bg-rose-50"
                  : l.level === "warn" ? "text-amber-700 bg-amber-50"
                  : "text-ink-600 bg-ink-100";
                return (
                  <tr key={i} className="border-b border-ink-100 hover:bg-ink-50/50">
                    <td className="px-4 py-2 font-mono text-[11px] text-ink-500 tnum">{l.ts}</td>
                    <td className="py-2">
                      <span className={"inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider " + lvCfg}>
                        {l.level}
                      </span>
                    </td>
                    <td className="py-2 font-mono text-[11px] text-ink-700">{l.robot}</td>
                    <td className="py-2 text-ink-800">{l.msg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

window.MonitoringHome = MonitoringHome;
window.AnalyticsView  = AnalyticsView;
window.BasisView      = BasisView;
window.LogsView       = LogsView;
