// App shell — sidebar + top header + routing host
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const NAV = [
{ id: "home", label: "모니터링 홈", icon: "LayoutDashboard" },
{ id: "analytics", label: "분석 대시보드", icon: "BarChart3" },
{ id: "basis", label: "기준 관리 정보", icon: "Database" },
{ id: "recipe", label: "레시피 생성", icon: "Workflow" },
{ id: "schedule", label: "작업 스케줄링", icon: "CalendarRange" },
{ id: "logs", label: "로그 조회", icon: "ScrollText" }];


function Sidebar({ active, onChange }) {
  return (
    <aside className="w-[224px] shrink-0 h-full border-r border-ink-200 bg-white flex flex-col">
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-ink-200">
        <div className="w-7 h-7 rounded-md bg-blue-600 grid place-items-center text-white">
          <Icon name="Boxes" size={16} strokeWidth={2} />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-ink-900">Connection - ICS
</div>
          <div className="text-[10.5px] text-ink-500 tracking-wide">Orchestrator · v2.4</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <div className="text-[10.5px] font-medium text-ink-400 uppercase tracking-wider px-2.5 pt-3 pb-1.5">Workspace</div>
        {NAV.map((n) => {const isOn = n.id === active;
          return (
            <button
              key={n.id}
              onClick={() => onChange(n.id)}
              className={
              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors mb-0.5 " + (
              isOn ?
              "bg-blue-50 text-blue-700" :
              "text-ink-700 hover:bg-ink-100")
              }>
                
              <Icon name={n.icon} size={16} strokeWidth={isOn ? 2 : 1.75} className={isOn ? "text-blue-600" : "text-ink-500"} />
              <span>{n.label}</span>
              {isOn && <span className="ml-auto w-1 h-4 rounded-full bg-blue-600" />}
            </button>);

        })}

        <div className="text-[10.5px] font-medium text-ink-400 uppercase tracking-wider px-2.5 pt-5 pb-1.5">Fleets</div>
        {window.AppData.fleets.map((f) =>
        <div key={f.id} className="flex items-center gap-2.5 px-2.5 py-1.5 text-[12.5px] text-ink-700">
            <span className="w-2 h-2 rounded-full" style={{ background: f.color }} />
            <span>{f.name}</span>
            <span className="ml-auto text-ink-400 tnum">
              {window.AppData.robots.filter((r) => r.fleet === f.id).length}
            </span>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-ink-200">
        <div className="rounded-lg bg-ink-50 border border-ink-200 p-2.5">
          <div className="flex items-center gap-2 text-[11.5px] text-ink-500">
            <Icon name="Activity" size={12} className="text-emerald-500" />
            <span>모든 시스템 정상</span>
          </div>
          <div className="mt-1 text-[10.5px] text-ink-400">마지막 동기화 · 13:42:08</div>
        </div>
      </div>
    </aside>);

}

function RobotPill({ statusId, count }) {
  const s = window.AppData.statusMap[statusId];
  if (!s) return null;
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: s.bg, color: s.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      <span className="text-[11.5px] font-medium">{s.short}</span>
      <span className="text-[12px] font-semibold tnum">{count}</span>
    </div>);

}

function Header({ activeLabel, onOpenCmd }) {
  const robots = window.AppData.robots;
  const counts = Object.fromEntries(
    window.AppData.statuses.map((s) => [s.id, robots.filter((r) => r.status === s.id).length])
  );
  return (
    <header className="h-14 shrink-0 bg-white border-b border-ink-200 px-5 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-ink-400">Workspace</span>
        <Icon name="ChevronRight" size={12} className="text-ink-300" />
        <span className="text-[13.5px] font-semibold text-ink-900">{activeLabel}</span>
      </div>

      <div className="ml-6 flex items-center gap-1">
        {window.AppData.statuses.map((s) =>
        <RobotPill key={s.id} statusId={s.id} count={counts[s.id]} />
        )}
      </div>

      <button
        onClick={onOpenCmd}
        className="ml-auto h-9 flex items-center gap-2 px-3 rounded-md bg-ink-50 border border-ink-200 hover:bg-white text-[12.5px] text-ink-500 min-w-[280px]">
        
        <Icon name="Search" size={14} className="text-ink-400" />
        <span>레시피 · 로봇 · 오더 검색</span>
        <span className="ml-auto flex items-center gap-1">
          <kbd className="font-mono text-[10.5px] bg-white border border-ink-200 rounded px-1.5 py-px text-ink-500">Ctrl</kbd>
          <kbd className="font-mono text-[10.5px] bg-white border border-ink-200 rounded px-1.5 py-px text-ink-500">K</kbd>
        </span>
      </button>

      <button className="relative w-9 h-9 grid place-items-center rounded-md hover:bg-ink-100 text-ink-600">
        <Icon name="Bell" size={16} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
      </button>
      <button className="w-9 h-9 grid place-items-center rounded-md hover:bg-ink-100 text-ink-600">
        <Icon name="Settings" size={16} />
      </button>

      <div className="flex items-center gap-2 pl-3 border-l border-ink-200 ml-1">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 grid place-items-center text-white text-[11px] font-semibold">김</div>
        <div className="leading-tight">
          <div className="text-[12.5px] font-medium text-ink-900">김삼성</div>
          <div className="text-[10.5px] text-ink-500">Master
</div>
        </div>
        <Icon name="ChevronDown" size={12} className="text-ink-400" />
      </div>
    </header>);
}

// ─── Command palette (Ctrl+K) ───────────────────────────────────────────────
function CommandPalette({ open, onClose, onJump }) {
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (open) setTimeout(() => ref.current?.focus(), 50);else
    setQ("");
  }, [open]);

  if (!open) return null;

  const recipes = window.AppData.recipes;
  const robots = window.AppData.robots;
  const ql = q.toLowerCase();

  const sections = [
  {
    title: "레시피",
    icon: "Workflow",
    items: recipes.filter((r) => !q || r.name.toLowerCase().includes(ql) || r.id.includes(ql)).
    slice(0, 6).map((r) => ({
      key: "rcp-" + r.id,
      left: r.name,
      right: r.id + " · " + r.steps.length + "단계",
      jump: { view: "schedule", payload: { focusRecipeId: r.id } }
    }))
  },
  {
    title: "로봇",
    icon: "Bot",
    items: robots.filter((r) => !q || r.id.toLowerCase().includes(ql)).
    slice(0, 5).map((r) => ({
      key: "rbt-" + r.id,
      left: r.id,
      right: r.task ? "수행중: " + r.task : "Idle",
      jump: { view: "home", payload: { focusRobotId: r.id } }
    }))
  },
  {
    title: "이동",
    icon: "Compass",
    items: NAV.filter((n) => !q || n.label.includes(q)).map((n) => ({
      key: "nav-" + n.id,
      left: n.label,
      right: "메뉴 이동",
      jump: { view: n.id, payload: {} }
    }))
  }].
  filter((s) => s.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/30 backdrop-blur-[2px] flex items-start justify-center pt-[14vh]" onClick={onClose}>
      <div className="w-[640px] bg-white rounded-xl shadow-pop border border-ink-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 h-14 border-b border-ink-200">
          <Icon name="Search" size={18} className="text-ink-400" />
          <input
            ref={ref}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="레시피, 로봇 ID, 또는 메뉴를 입력하세요…"
            className="flex-1 bg-transparent outline-none text-[14px] text-ink-900 placeholder:text-ink-400" />
          
          <kbd className="font-mono text-[10.5px] bg-ink-50 border border-ink-200 rounded px-1.5 py-px text-ink-500">ESC</kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto py-2">
          {sections.length === 0 &&
          <div className="px-4 py-8 text-center text-[13px] text-ink-400">결과가 없습니다.</div>
          }
          {sections.map((s) =>
          <div key={s.title} className="mb-1">
              <div className="px-4 pt-2 pb-1 text-[10.5px] font-medium text-ink-400 uppercase tracking-wider flex items-center gap-1.5">
                <Icon name={s.icon} size={11} /> {s.title}
              </div>
              {s.items.map((it) =>
            <button
              key={it.key}
              onClick={() => {onJump(it.jump);onClose();}}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 text-left group">
              
                  <Icon name={s.icon} size={14} className="text-ink-400 group-hover:text-blue-600" />
                  <span className="text-[13px] text-ink-900 flex-1">{it.left}</span>
                  <span className="text-[11.5px] text-ink-400 tnum">{it.right}</span>
                  <Icon name="CornerDownLeft" size={12} className="text-ink-300 group-hover:text-blue-500" />
                </button>
            )}
            </div>
          )}
        </div>
        <div className="h-9 px-4 flex items-center gap-4 border-t border-ink-200 bg-ink-50 text-[10.5px] text-ink-500">
          <span className="flex items-center gap-1.5"><kbd className="font-mono bg-white border border-ink-200 rounded px-1 py-px">↑↓</kbd> 탐색</span>
          <span className="flex items-center gap-1.5"><kbd className="font-mono bg-white border border-ink-200 rounded px-1 py-px">Enter</kbd> 선택</span>
          <span className="ml-auto">12건 결과</span>
        </div>
      </div>
    </div>);

}

window.Sidebar = Sidebar;
window.Header = Header;
window.CommandPalette = CommandPalette;
window.NAV = NAV;