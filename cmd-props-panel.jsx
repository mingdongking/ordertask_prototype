// Command/Properties slide panel — mounted on the right of the Monitoring Home map.
// Tabs: "Command" (quick robot actions) and "Properties" (selected robot's order status).
const { useState: cpUseState, useMemo: cpUseMemo } = React;

function CommandPropsPanel({ selectedRobot, mapRobots, onClose }) {
  const [tab, setTab] = cpUseState("command");
  const sm = selectedRobot ? window.AppData.statusMap[selectedRobot.st] : null;
  const fm = selectedRobot ? window.AppData.fleets.find(f => f.id === selectedRobot.fleet) : null;

  return (
    <aside className="bg-white border border-ink-200 rounded-lg shadow-card overflow-hidden flex flex-col" style={{ minHeight: 480 }}>
      {/* Header */}
      <div className="h-11 px-3 border-b border-ink-200 flex items-center gap-1">
        <button
          onClick={() => setTab("command")}
          className={"h-8 px-3 rounded text-[12.5px] font-medium flex items-center gap-1.5 " +
            (tab === "command" ? "bg-blue-50 text-blue-700" : "text-ink-600 hover:bg-ink-50")
          }
        >
          <Icon name="Terminal" size={13}/> Command
        </button>
        <button
          onClick={() => setTab("props")}
          className={"h-8 px-3 rounded text-[12.5px] font-medium flex items-center gap-1.5 " +
            (tab === "props" ? "bg-blue-50 text-blue-700" : "text-ink-600 hover:bg-ink-50")
          }
        >
          <Icon name="Info" size={13}/> Properties
        </button>
        <button onClick={onClose} className="ml-auto w-7 h-7 grid place-items-center rounded hover:bg-ink-100 text-ink-500" title="닫기">
          <Icon name="X" size={13}/>
        </button>
      </div>

      {/* Target robot strip */}
      <div className="px-3 py-2.5 border-b border-ink-200 bg-ink-50/50">
        {selectedRobot ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md grid place-items-center text-white shrink-0" style={{ background: fm?.color || "#64748b" }}>
              <Icon name={selectedRobot.id.startsWith("ARM") ? "Cog" : "Bot"} size={13}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink-900 tnum">{selectedRobot.id}</span>
                <span className="text-[10px] font-semibold px-1.5 py-px rounded flex items-center gap-1" style={{ background: sm.bg, color: sm.fg }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sm.color }}/> {sm.label}
                </span>
              </div>
              <div className="text-[10.5px] text-ink-500 tnum mt-px">배터리 {selectedRobot.battery}% · X{selectedRobot.x} Y{selectedRobot.y}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11.5px] text-ink-500">
            <Icon name="MousePointerClick" size={12}/>
            <span>맵에서 로봇을 클릭하여 대상 선택</span>
          </div>
        )}
      </div>

      {/* Tab body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {tab === "command"
          ? <CommandTab robot={selectedRobot}/>
          : <PropertiesTab robot={selectedRobot}/>
        }
      </div>
    </aside>
  );
}

window.CommandPropsPanel = CommandPropsPanel;

// ─── Command tab ────────────────────────────────────────────────────
function CommandTab({ robot }) {
  const [toast, setToast] = cpUseState(null);
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);
  function fire(label) {
    setToast({ msg: label, ts: new Date().toLocaleTimeString("ko-KR", { hour12: false }) });
  }

  return (
    <div className="p-3 space-y-2.5 relative">
      <IssueOrderSection mapRobot={robot} onFire={fire}/>
      <StopOrderSection  mapRobot={robot} onFire={fire}/>
      <MoveSection       mapRobot={robot} onFire={fire}/>
      <ChargeSection     mapRobot={robot} onFire={fire}/>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink-900 text-white text-[12px] px-3 py-2 rounded-md shadow-pop flex items-center gap-2 max-w-[320px]">
          <Icon name="Check" size={13} className="text-emerald-400"/>
          <span className="flex-1">{toast.msg}</span>
          <span className="text-[10.5px] text-ink-400 tnum">{toast.ts}</span>
        </div>
      )}
    </div>
  );
}

// ─── Per-section robot target picker (Fleet + Robot dropdowns) ─────
function TargetPicker({ fleet, robotId, onFleetChange, onRobotChange, gate }) {
  // gate: optional filter for robots (e.g. only running). returns true if allowed.
  const fleets = window.AppData.fleets;
  const robots = window.AppData.robots;
  const candidates = robots.filter(r => r.fleet === fleet && (!gate || gate(r)));
  return (
    <div className="grid grid-cols-2 gap-1.5 mb-2">
      <CmdSelect value={fleet} onChange={onFleetChange} compact prefix="Fleet">
        {fleets.map(f => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </CmdSelect>
      <CmdSelect value={robotId} onChange={onRobotChange} compact prefix="로봇" placeholder={candidates.length === 0 ? "대상 없음" : "선택"}>
        {candidates.map(r => {
          const sm = window.AppData.statusMap[r.status];
          return <option key={r.id} value={r.id}>{r.id} · {sm?.short || r.status}</option>;
        })}
      </CmdSelect>
    </div>
  );
}

// Helper: keep the section's fleet/robot in sync with map selection
function useTargetSelection(mapRobot, gate) {
  const defaultFleet = mapRobot?.fleet || window.AppData.fleets[0].id;
  const [fleet, setFleet] = cpUseState(defaultFleet);
  const candidates = window.AppData.robots.filter(r => r.fleet === fleet && (!gate || gate(r)));
  const defaultRobot = mapRobot && mapRobot.fleet === fleet && (!gate || gate(window.AppData.robots.find(r => r.id === mapRobot.id) || {}))
    ? mapRobot.id
    : (candidates[0]?.id || "");
  const [robotId, setRobotId] = cpUseState(defaultRobot);

  // Sync to map selection changes
  React.useEffect(() => {
    if (mapRobot) {
      const dataRobot = window.AppData.robots.find(r => r.id === mapRobot.id);
      if (dataRobot && (!gate || gate(dataRobot))) {
        setFleet(mapRobot.fleet);
        setRobotId(mapRobot.id);
      }
    }
  }, [mapRobot?.id]);

  // Keep robot id valid when fleet changes
  React.useEffect(() => {
    const list = window.AppData.robots.filter(r => r.fleet === fleet && (!gate || gate(r)));
    if (!list.find(r => r.id === robotId)) setRobotId(list[0]?.id || "");
  }, [fleet]);

  const selected = window.AppData.robots.find(r => r.id === robotId) || null;
  return { fleet, setFleet, robotId, setRobotId, selected };
}

// ─── 즉시 오더 발행 ──────────────────────────────────────────────────
function IssueOrderSection({ mapRobot, onFire }) {
  const { fleet, setFleet, robotId, setRobotId, selected } = useTargetSelection(mapRobot, null);
  const [recipeId, setRecipeId] = cpUseState("");
  const [priority, setPriority] = cpUseState("P2");
  const recipes = window.AppData.recipes.filter(r => r.fleet === fleet && r.status === "published");
  const canFire = !!robotId && !!recipeId;
  return (
    <CmdSection icon="Send" tone="blue" title="즉시 오더 발행" subtitle="대상 로봇에 레시피를 디스패치">
      <TargetPicker fleet={fleet} robotId={robotId} onFleetChange={setFleet} onRobotChange={setRobotId}/>
      <CmdSelect value={recipeId} onChange={setRecipeId} placeholder={recipes.length === 0 ? "사용 가능 레시피 없음" : "레시피 선택"}>
        {recipes.map(r => (
          <option key={r.id} value={r.id}>{r.name} · {window.AppData.recipeDuration(r)}분</option>
        ))}
      </CmdSelect>
      <div className="flex items-center gap-1.5 mt-2">
        {[
          { id: "P1", label: "긴급" },
          { id: "P2", label: "표준" },
          { id: "P3", label: "낮음" },
        ].map(p => (
          <button
            key={p.id}
            onClick={() => setPriority(p.id)}
            className={"flex-1 h-6 rounded text-[10.5px] font-medium border transition " +
              (priority === p.id
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50")
            }
          >{p.id}·{p.label}</button>
        ))}
      </div>
      <CmdButton
        disabled={!canFire}
        tone="blue"
        icon="Send"
        onClick={() => onFire("오더 발행: " + (recipes.find(r => r.id === recipeId)?.name) + " → " + robotId)}
      >
        {robotId ? robotId + "에 발행" : "발행"}
      </CmdButton>
    </CmdSection>
  );
}

// ─── 즉시 오더 중지 ──────────────────────────────────────────────────
function StopOrderSection({ mapRobot, onFire }) {
  // Only robots currently running an order are valid targets
  const gate = r => r.status === "run" && !!r.task;
  const { fleet, setFleet, robotId, setRobotId, selected } = useTargetSelection(mapRobot, gate);
  const [mode, setMode] = cpUseState("graceful"); // graceful | immediate
  const candidates = window.AppData.robots.filter(r => r.fleet === fleet && gate(r));
  const canFire = !!robotId && candidates.find(c => c.id === robotId);
  return (
    <CmdSection icon="Square" tone="rose" title="즉시 오더 중지" subtitle="진행 중인 작업을 안전하게 종료">
      <TargetPicker fleet={fleet} robotId={robotId} onFleetChange={setFleet} onRobotChange={setRobotId} gate={gate}/>
      {selected && (
        <div className="px-2 py-1.5 rounded bg-ink-50/80 text-[10.5px] flex items-center gap-1.5 mb-2">
          <Icon name="PlayCircle" size={11} className="text-blue-500"/>
          <span className="text-ink-500">현재:</span>
          <span className="font-medium text-ink-900 truncate">{selected.task}</span>
        </div>
      )}
      {candidates.length === 0 && (
        <div className="px-2 py-2 rounded bg-amber-50 text-[10.5px] text-amber-700 flex items-center gap-1.5 mb-2">
          <Icon name="Info" size={11}/> 이 Fleet 에 진행 중인 로봇이 없습니다.
        </div>
      )}
      <div className="flex items-center gap-1.5">
        {[
          { id: "graceful", label: "정상 종료" },
          { id: "immediate", label: "즉시 정지" },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={"flex-1 h-6 rounded text-[10.5px] font-medium border transition " +
              (mode === m.id
                ? (m.id === "immediate" ? "border-rose-400 bg-rose-50 text-rose-700" : "border-blue-500 bg-blue-50 text-blue-700")
                : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50")
            }
          >{m.label}</button>
        ))}
      </div>
      <CmdButton
        disabled={!canFire}
        tone="rose"
        icon="Square"
        onClick={() => onFire(mode === "immediate" ? "즉시 정지: " + robotId : "정상 종료: " + robotId)}
      >
        {mode === "immediate" ? "즉시 정지" : "정상 종료"}
      </CmdButton>
    </CmdSection>
  );
}

// ─── 이동 명령 ──────────────────────────────────────────────────────
function MoveSection({ mapRobot, onFire }) {
  const { fleet, setFleet, robotId, setRobotId } = useTargetSelection(mapRobot, null);
  const [target, setTarget] = cpUseState("");
  const stations = window.AppData.stations.filter(s => s.type !== "charge");
  return (
    <CmdSection icon="Navigation" tone="indigo" title="이동 명령" subtitle="대상 스테이션으로 즉시 이동">
      <TargetPicker fleet={fleet} robotId={robotId} onFleetChange={setFleet} onRobotChange={setRobotId}/>
      <CmdSelect value={target} onChange={setTarget} placeholder="목적지 선택">
        {stations.map(s => (
          <option key={s.code} value={s.code}>{s.name} · {s.zone}</option>
        ))}
      </CmdSelect>
      <div className="flex items-center gap-1.5 mt-2 text-[10.5px] text-ink-500">
        <Icon name="Gauge" size={10}/> 속도 0.8 m/s
        <span className="text-ink-300">·</span>
        <Icon name="Spline" size={10}/> 자동 경로
      </div>
      <CmdButton
        disabled={!robotId || !target}
        tone="indigo"
        icon="Navigation"
        onClick={() => onFire(robotId + " 이동: " + (stations.find(s => s.code === target)?.name))}
      >이동 시작</CmdButton>
    </CmdSection>
  );
}

// ─── 충전 명령 ──────────────────────────────────────────────────────
function ChargeSection({ mapRobot, onFire }) {
  const { fleet, setFleet, robotId, setRobotId, selected } = useTargetSelection(mapRobot, null);
  const [target, setTarget] = cpUseState("auto");
  const chargeStations = window.AppData.stations.filter(s => s.type === "charge");
  return (
    <CmdSection icon="BatteryCharging" tone="emerald" title="충전 명령" subtitle="충전 스테이션으로 복귀">
      <TargetPicker fleet={fleet} robotId={robotId} onFleetChange={setFleet} onRobotChange={setRobotId}/>
      <CmdSelect value={target} onChange={setTarget}>
        <option value="auto">자동 선택 (최단경로)</option>
        {chargeStations.map(s => (
          <option key={s.code} value={s.code}>{s.name}</option>
        ))}
      </CmdSelect>
      {selected && (
        <div className="mt-2 flex items-center gap-2 text-[10.5px] text-ink-500">
          <span>{selected.id} 배터리</span>
          <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: selected.battery + "%", background: selected.battery > 50 ? "#10b981" : selected.battery > 25 ? "#f59e0b" : "#e11d48" }}/>
          </div>
          <span className="tnum font-medium text-ink-700">{selected.battery}%</span>
        </div>
      )}
      <CmdButton
        disabled={!robotId}
        tone="emerald"
        icon="BatteryCharging"
        onClick={() => onFire(robotId + " 충전 시작: " + (target === "auto" ? "자동 라우팅" : chargeStations.find(s => s.code === target)?.name))}
      >충전 시작</CmdButton>
    </CmdSection>
  );
}

function CmdSection({ icon, tone, title, subtitle, children }) {
  const accent = {
    blue:    { bg: "bg-blue-50",    fg: "text-blue-700" },
    indigo:  { bg: "bg-indigo-50",  fg: "text-indigo-700" },
    emerald: { bg: "bg-emerald-50", fg: "text-emerald-700" },
    rose:    { bg: "bg-rose-50",    fg: "text-rose-700" },
  }[tone] || { bg: "bg-ink-50", fg: "text-ink-700" };
  return (
    <div className="rounded-md border border-ink-200 p-2.5">
      <div className="flex items-center gap-2 mb-2">
        <div className={"w-6 h-6 rounded grid place-items-center " + accent.bg + " " + accent.fg}>
          <Icon name={icon} size={12}/>
        </div>
        <div className="leading-tight">
          <div className="text-[12.5px] font-semibold text-ink-900">{title}</div>
          <div className="text-[10px] text-ink-500">{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function CmdSelect({ value, onChange, disabled, placeholder, children, compact, prefix }) {
  return (
    <div className="relative flex-1 min-w-0">
      {prefix && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9.5px] font-medium text-ink-400 uppercase tracking-wide pointer-events-none">{prefix}</span>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={"w-full rounded-md border bg-white text-[11.5px] outline-none appearance-none cursor-pointer transition " +
          (compact ? "h-7 " : "h-8 ") +
          (prefix ? "pl-10 " : "pl-2.5 ") +
          "pr-6 " +
          (disabled
            ? "opacity-50 cursor-not-allowed border-ink-200 text-ink-400"
            : "border-ink-200 text-ink-800 focus:border-blue-400")
        }
      >
        {placeholder && !value && <option value="" disabled>{placeholder}</option>}
        {children}
      </select>
      <Icon name="ChevronDown" size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"/>
    </div>
  );
}

function CmdButton({ disabled, tone, icon, children, onClick }) {
  const toneCls = {
    blue:    "bg-blue-600 hover:bg-blue-700",
    indigo:  "bg-indigo-600 hover:bg-indigo-700",
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    rose:    "bg-rose-600 hover:bg-rose-700",
  }[tone] || "bg-ink-900 hover:bg-ink-700";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={"w-full h-8 mt-2 rounded-md text-white text-[12px] font-medium flex items-center justify-center gap-1.5 transition shadow-sm " +
        toneCls + " disabled:bg-ink-300 disabled:cursor-not-allowed disabled:shadow-none"
      }
    >
      <Icon name={icon} size={12}/> {children}
    </button>
  );
}

// ─── Properties tab ────────────────────────────────────────────────
function PropertiesTab({ robot }) {
  if (!robot) {
    return (
      <div className="p-6 text-center">
        <div className="w-10 h-10 mx-auto rounded-full bg-ink-50 grid place-items-center mb-2">
          <Icon name="Info" size={16} className="text-ink-400"/>
        </div>
        <div className="text-[12.5px] font-medium text-ink-700">로봇 선택 안 됨</div>
        <div className="text-[11px] text-ink-500 mt-0.5 leading-relaxed">맵에서 로봇을 클릭하면<br/>오더 현황 및 속성이 표시됩니다.</div>
      </div>
    );
  }

  // Find orders for this robot
  const allOrders = window.AppData.orders;
  const recipes = window.AppData.recipes;
  const myOrders = allOrders
    .filter(o => o.robotId === robot.id)
    .map(o => {
      const r = recipes.find(rr => rr.id === o.recipeId);
      const dur = r ? window.AppData.recipeDuration(r) : 0;
      return { ...o, recipe: r, dur };
    })
    .sort((a, b) => a.start - b.start);

  function fmtT(min) {
    const h = Math.floor(min / 60), m = min % 60;
    return String(h).padStart(2,"0") + ":" + String(m).padStart(2,"0");
  }
  const STAT = {
    done:    { label: "완료",   color: "#94a3b8", bg: "#f1f5f9" },
    running: { label: "진행중", color: "#2563eb", bg: "#dbeafe" },
    queued:  { label: "예약",   color: "#d97706", bg: "#fef3c7" },
    error:   { label: "실패",   color: "#e11d48", bg: "#ffe4e6" },
  };

  return (
    <div className="p-3 space-y-3">
      {/* Spec grid */}
      <div className="rounded-md border border-ink-200 p-2.5">
        <div className="text-[10.5px] font-medium text-ink-400 uppercase tracking-wider mb-1.5">Specification</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11.5px]">
          <PSpec label="모델"   value={robot.id.startsWith("AMR") ? "MiR250" : robot.id.startsWith("AGV") ? "RXC-3000" : "UR10e"}/>
          <PSpec label="Fleet"  value={(window.AppData.fleets.find(f => f.id === robot.fleet) || {}).name}/>
          <PSpec label="펌웨어"  value="v3.14.2"/>
          <PSpec label="IP"     value={"10.42.1." + (40 + parseInt(robot.id.slice(-2)))}/>
          <PSpec label="배터리"  value={robot.battery + "%"} bar={robot.battery}/>
          <PSpec label="가동시간" value="14h 22m"/>
        </div>
      </div>

      {/* Current task */}
      <div className="rounded-md border border-ink-200 p-2.5">
        <div className="text-[10.5px] font-medium text-ink-400 uppercase tracking-wider mb-1.5">현재 수행</div>
        {robot.task ? (
          <>
            <div className="text-[12.5px] font-semibold text-ink-900">{robot.recipe}</div>
            <div className="text-[10.5px] text-ink-500 mt-0.5 tnum flex items-center gap-1.5">
              <Icon name="Hash" size={10}/> {robot.task}
              <span className="text-ink-300">·</span>
              <Icon name="Clock" size={10}/> 12분 잔여
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10.5px] mb-1">
                <span className="text-ink-500">진행률</span>
                <span className="text-ink-900 font-semibold tnum">{robot.progress}%</span>
              </div>
              <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: robot.progress + "%" }}/>
              </div>
            </div>
          </>
        ) : (
          <div className="text-[11.5px] text-ink-500 italic">할당된 작업 없음</div>
        )}
      </div>

      {/* Order history / queue */}
      <div className="rounded-md border border-ink-200 overflow-hidden">
        <div className="px-2.5 py-2 border-b border-ink-200 flex items-center justify-between">
          <div className="text-[12px] font-semibold text-ink-900">오더 현황</div>
          <span className="text-[10.5px] text-ink-400 tnum">{myOrders.length}건</span>
        </div>
        {myOrders.length === 0 ? (
          <div className="px-3 py-4 text-center text-[11.5px] text-ink-400 italic">오늘 이 로봇에 할당된 오더가 없습니다.</div>
        ) : (
          <div className="divide-y divide-ink-100 max-h-[280px] overflow-y-auto">
            {myOrders.map(o => {
              const st = STAT[o.status];
              return (
                <div key={o.id} className="px-2.5 py-2 hover:bg-ink-50/50">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1 h-3 rounded-sm" style={{ background: st.color }}/>
                    <span className="text-[11.5px] font-medium text-ink-900 truncate flex-1">{o.recipe?.name || o.recipeId}</span>
                    <span className="text-[9.5px] font-semibold px-1.5 py-px rounded tnum" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-ink-500 tnum pl-2.5">
                    <Icon name="Clock" size={9}/> {fmtT(o.start)}—{fmtT(o.start + o.dur)}
                    <span className="opacity-50">·</span>
                    <span>{o.dur}분</span>
                    <span className="ml-auto">{o.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PSpec({ label, value, bar }) {
  return (
    <div>
      <div className="text-[10px] text-ink-500">{label}</div>
      <div className="text-[12px] font-medium text-ink-900 truncate tnum">{value}</div>
      {bar !== undefined && (
        <div className="h-0.5 mt-0.5 bg-ink-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: bar + "%", background: bar > 50 ? "#10b981" : bar > 25 ? "#f59e0b" : "#e11d48" }}/>
        </div>
      )}
    </div>
  );
}
