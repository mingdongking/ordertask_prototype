// "오더 추가" modal — used by the Scheduler view.
// Fleet → Recipe (filtered) → Robot (filtered) → Date + Time selection.
const { useState: aoUseState, useMemo: aoUseMemo } = React;

function _todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function _fmtTime(min) {
  const h = Math.floor(min / 60),m = min % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

function AddOrderDialog({ robots, recipes, orders, computePlacement, onClose, onCreate }) {
  const [fleet, setFleet] = aoUseState("amr");
  const fleetRecipes = recipes.filter((r) => r.fleet === fleet);
  const fleetRobots = robots.filter((r) => r.fleet === fleet);
  const [recipeId, setRecipeId] = aoUseState(fleetRecipes[0]?.id || "");
  const [robotId, setRobotId] = aoUseState(fleetRobots[0]?.id || "");
  const [date, setDate] = aoUseState(_todayStr());
  const [hour, setHour] = aoUseState(13);
  const [minute, setMinute] = aoUseState(0);
  const [priority, setPriority] = aoUseState("P2");

  // Keep selections valid when fleet changes
  React.useEffect(() => {
    const rs = recipes.filter((r) => r.fleet === fleet);
    const rb = robots.filter((r) => r.fleet === fleet);
    if (!rs.find((r) => r.id === recipeId)) setRecipeId(rs[0]?.id || "");
    if (!rb.find((r) => r.id === robotId)) setRobotId(rb[0]?.id || "");
  }, [fleet]);

  const recipe = recipes.find((r) => r.id === recipeId);
  const duration = recipe ? window.AppData.recipeDuration(recipe) : 0;
  const desiredStart = hour * 60 + minute;
  const placement = recipe && robotId ?
  computePlacement(orders, robotId, desiredStart, duration, null) :
  { start: desiredStart, conflict: false };
  const shifted = placement.conflict && placement.start !== desiredStart;

  function submit() {
    if (!recipeId || !robotId) return;
    onCreate({ recipeId, robotId, start: placement.start, date, priority });
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-[2px] grid place-items-center p-4" onClick={onClose}>
      <div className="w-[560px] bg-white rounded-xl shadow-pop border border-ink-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="h-12 px-5 border-b border-ink-200 flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-50 grid place-items-center text-blue-600">
            <Icon name="CalendarPlus" size={14} />
          </div>
          <h3 className="text-[14px] font-semibold text-ink-900">새 작업 추가</h3>
          <button onClick={onClose} className="ml-auto w-7 h-7 grid place-items-center rounded hover:bg-ink-100 text-ink-500">
            <Icon name="X" size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <AoField label="Fleet 선택">
            <div className="grid grid-cols-3 gap-1.5">
              {window.AppData.fleets.map((f) =>
              <button
                key={f.id}
                onClick={() => setFleet(f.id)}
                className={"h-9 rounded-md text-[12.5px] font-medium border transition flex items-center justify-center gap-1.5 " + (
                fleet === f.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50")
                }>
                
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: f.color }} />
                  {f.name}
                </button>
              )}
            </div>
          </AoField>

          <div className="grid grid-cols-2 gap-3">
            <AoField label="레시피">
              <AoSelect value={recipeId} onChange={setRecipeId} placeholder="레시피 선택">
                {fleetRecipes.map((r) =>
                <option key={r.id} value={r.id}>{r.name} · {window.AppData.recipeDuration(r)}분</option>
                )}
                {fleetRecipes.length === 0 && <option disabled value="">사용 가능한 레시피 없음</option>}
              </AoSelect>
              {recipe &&
              <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-ink-500">
                  <Icon name="Workflow" size={10} /> {recipe.steps.length}단계
                  <span className="text-ink-300">·</span>
                  <Icon name="Clock" size={10} /> {duration}분
                </div>
              }
            </AoField>
            <AoField label="할당 로봇">
              <AoSelect value={robotId} onChange={setRobotId} placeholder="로봇 선택">
                {fleetRobots.map((r) => {
                  const sm = window.AppData.statusMap[r.status] || {};
                  return <option key={r.id} value={r.id}>{r.id} · {sm.label || r.status}</option>;
                })}
              </AoSelect>
            </AoField>
          </div>

          <AoField label="시작 일시">
            <div className="grid grid-cols-3 gap-2">
              <div className="relative col-span-1">
                <Icon name="Calendar" size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 pl-7 pr-2 w-full rounded-md border border-ink-200 bg-white text-[12.5px] text-ink-800 outline-none focus:border-blue-400" />
                
              </div>
              <AoSelect value={hour} onChange={(v) => setHour(+v)}>
                {Array.from({ length: 24 }, (_, i) =>
                <option key={i} value={i}>{String(i).padStart(2, "0")}시</option>
                )}
              </AoSelect>
              <AoSelect value={minute} onChange={(v) => setMinute(+v)}>
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) =>
                <option key={m} value={m}>{String(m).padStart(2, "0")}분</option>
                )}
              </AoSelect>
            </div>
          </AoField>

          <AoField label="우선순위">
            <div className="flex items-center gap-1.5">
              {[
              { id: "P1", label: "P1 · 긴급", color: "rose" },
              { id: "P2", label: "P2 · 표준", color: "blue" },
              { id: "P3", label: "P3 · 낮음", color: "slate" }].
              map((p) =>
              <button
                key={p.id}
                onClick={() => setPriority(p.id)}
                className={"flex-1 h-8 rounded-md text-[12px] font-medium border transition " + (
                priority === p.id ?
                p.color === "rose" ? "border-rose-400 bg-rose-50 text-rose-700" :
                p.color === "blue" ? "border-blue-400 bg-blue-50 text-blue-700" :
                "border-ink-300 bg-ink-100 text-ink-800" :
                "border-ink-200 bg-white text-ink-600 hover:bg-ink-50")
                }>
                {p.label}</button>
              )}
            </div>
          </AoField>

          {/* Live preview */}
          {recipe && robotId &&
          <div className={"rounded-md border p-3 " + (shifted ? "border-amber-300 bg-amber-50" : "border-blue-200 bg-blue-50/60")}>
              <div className="flex items-center gap-2 text-[11.5px]">
                <Icon name={shifted ? "AlertTriangle" : "Sparkles"} size={12} className={shifted ? "text-amber-600" : "text-blue-600"} />
                <span className={"font-semibold " + (shifted ? "text-amber-900" : "text-blue-900")}>
                  {shifted ? "충돌 회피 적용됨" : "스케줄 가능"}
                </span>
                <span className="ml-auto text-ink-500 tnum">
                  {robotId} · {_fmtTime(placement.start)} — {_fmtTime(placement.start + duration)}
                </span>
              </div>
              {shifted &&
            <div className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                  요청 시각 {_fmtTime(desiredStart)} 에 다른 작업이 있어 <strong>{placement.start - desiredStart}분 뒤</strong>로 자동 이동되었습니다.
                  (앞뒤 5분 버퍼 포함)
                </div>
            }
            </div>
          }
        </div>

        {/* Footer */}
        <div className="h-14 px-5 border-t border-ink-200 bg-ink-50/50 flex items-center gap-2">
          <span className="text-[11px] text-ink-500 flex items-center gap-1">
            <Icon name="Info" size={11} /> 드래그 또는 모달로 오더 생성 가능
          </span>
          <button onClick={onClose} className="ml-auto h-9 px-3.5 rounded-md border border-ink-200 bg-white hover:bg-ink-50 text-[12.5px] font-medium text-ink-700">
            취소
          </button>
          <button
            onClick={submit}
            disabled={!recipeId || !robotId}
            className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-ink-300 text-white text-[12.5px] font-medium flex items-center gap-1.5 shadow-sm">
            
            <Icon name="Send" size={13} /> 생성
          </button>
        </div>
      </div>
    </div>);

}

function AoField({ label, children }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-ink-500 mb-1">{label}</div>
      {children}
    </div>);

}

function AoSelect({ value, onChange, children, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-3 pr-8 w-full rounded-md border border-ink-200 bg-white text-[12.5px] text-ink-800 outline-none focus:border-blue-400 appearance-none cursor-pointer">
        
        {placeholder && !value && <option value="" disabled>{placeholder}</option>}
        {children}
      </select>
      <Icon name="ChevronDown" size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
    </div>);

}

window.AddOrderDialog = AddOrderDialog;