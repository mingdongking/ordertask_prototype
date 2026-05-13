// Gantt Scheduler view
const { useState: schUseState, useEffect: schUseEffect, useRef: schUseRef, useMemo: schUseMemo } = React;

const GANTT = {
  startHour: 6,
  endHour: 20,
  pxPerMin: 2.4, // 14h * 60 = 840 min * 2.4 = 2016 px wide
  rowH: 56,
  BUFFER_MIN: 5
};
const GANTT_WIDTH = (GANTT.endHour - GANTT.startHour) * 60 * GANTT.pxPerMin;
const ROBOT_COL_W = 168;

function fmtTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

const STATUS_COLORS = {
  done: { bg: "bg-ink-100", border: "border-ink-300", fg: "text-ink-700", label: "완료", chip: "#94a3b8" },
  running: { bg: "bg-blue-100", border: "border-blue-400", fg: "text-blue-900", label: "진행중", chip: "#2563eb" },
  queued: { bg: "bg-amber-50", border: "border-amber-300", fg: "text-amber-900", label: "예약", chip: "#d97706" },
  error: { bg: "bg-rose-100", border: "border-rose-400", fg: "text-rose-900", label: "실패", chip: "#e11d48" }
};

function SchedulerView({ initialFocusRecipeId }) {
  const [orders, setOrders] = schUseState(window.AppData.orders.map((o) => ({ ...o })));
  const [selectedOrder, setSelectedOrder] = schUseState(null);
  const [draggingRecipe, setDraggingRecipe] = schUseState(null);
  const [hoverPreview, setHoverPreview] = schUseState(null); // {robotId, start, duration, recipeId}
  const [libraryOpen, setLibraryOpen] = schUseState(true);
  const [now, setNow] = schUseState(11 * 60 + 12); // sim "now"
  const [highlightRecipeId, setHighlightRecipeId] = schUseState(initialFocusRecipeId || null);
  const [addDialogOpen, setAddDialogOpen] = schUseState(false);
  const [fleetFilter, setFleetFilter] = schUseState("all");
  const [movingOrder, setMovingOrder] = schUseState(null); // {orderId, robotId, ghostStart, conflict}
  const pressRef = schUseRef(null);
  const lastDragEndRef = schUseRef(0);
  const ganttRef = schUseRef(null);
  const headerRef = schUseRef(null);
  const robotsColRef = schUseRef(null);

  const allRobots = window.AppData.robots;
  const robots = fleetFilter === "all" ? allRobots : allRobots.filter((r) => r.fleet === fleetFilter);
  const recipes = window.AppData.recipes;

  // Tick the "now" line
  schUseEffect(() => {
    const id = setInterval(() => setNow((n) => n + 1), 8000);
    return () => clearInterval(id);
  }, []);

  // Sync horizontal scroll between header & rows
  schUseEffect(() => {
    const r = ganttRef.current;
    const h = headerRef.current;
    if (!r || !h) return;
    const onScroll = () => {
      h.scrollLeft = r.scrollLeft;
      if (robotsColRef.current) robotsColRef.current.scrollTop = r.scrollTop;
    };
    r.addEventListener("scroll", onScroll);
    return () => r.removeEventListener("scroll", onScroll);
  }, []);

  function timeFromClientX(clientX) {
    const rect = ganttRef.current.getBoundingClientRect();
    const x = clientX - rect.left + ganttRef.current.scrollLeft;
    const min = GANTT.startHour * 60 + x / GANTT.pxPerMin;
    return Math.max(GANTT.startHour * 60, Math.min(GANTT.endHour * 60, Math.round(min / 5) * 5));
  }

  // ─── Drag from library onto chart ───
  function onLibDragStart(e, recipeId) {
    setDraggingRecipe(recipeId);
    e.dataTransfer.setData("text/plain", recipeId);
    e.dataTransfer.effectAllowed = "copy";
  }
  function onRowDragOver(e, robotId) {
    e.preventDefault();
    if (!draggingRecipe) return;
    const r = recipes.find((r) => r.id === draggingRecipe);
    if (!r) return;
    const duration = window.AppData.recipeDuration(r);
    const start = timeFromClientX(e.clientX);
    const placed = computePlacement(orders, robotId, start, duration, null);
    setHoverPreview({ robotId, start: placed.start, duration, recipeId: r.id, conflict: placed.conflict });
  }
  function onRowDrop(e, robotId) {
    e.preventDefault();
    if (!draggingRecipe) return;
    const r = recipes.find((r) => r.id === draggingRecipe);
    if (!r) return;
    const duration = window.AppData.recipeDuration(r);
    const start = timeFromClientX(e.clientX);
    const placed = computePlacement(orders, robotId, start, duration, null);
    const newOrder = {
      id: "ord-" + (1000 + orders.length),
      robotId,
      recipeId: r.id,
      start: placed.start,
      status: "queued"
    };
    setOrders([...orders, newOrder]);
    setDraggingRecipe(null);
    setHoverPreview(null);
  }

  // Compute valid start respecting buffer
  function computePlacement(allOrders, robotId, desiredStart, duration, ignoreOrderId) {
    const rowOrders = allOrders.filter((o) => o.robotId === robotId && o.id !== ignoreOrderId);
    let start = desiredStart;
    let safety = 0;
    let conflict = false;
    while (safety++ < 100) {
      const end = start + duration;
      const blocker = rowOrders.find((o) => {
        const oDur = window.AppData.recipeDuration(recipes.find((r) => r.id === o.recipeId));
        const oStart = o.start - GANTT.BUFFER_MIN;
        const oEnd = o.start + oDur + GANTT.BUFFER_MIN;
        return start < oEnd && end > oStart;
      });
      if (!blocker) break;
      conflict = true;
      const oDur = window.AppData.recipeDuration(recipes.find((r) => r.id === blocker.recipeId));
      start = blocker.start + oDur + GANTT.BUFFER_MIN;
    }
    return { start, conflict };
  }

  // ─── Block edit permissions / move-by-drag / copy / delete ───
  function isEditable(o) {
    // editable only if it hasn't started yet
    return o.status === "queued" && o.start > now;
  }

  function copyOrder(o) {
    const r = recipes.find((rr) => rr.id === o.recipeId);
    if (!r) return;
    const dur = window.AppData.recipeDuration(r);
    // place just after the original
    const desired = o.start + dur + GANTT.BUFFER_MIN;
    const placed = computePlacement(orders, o.robotId, desired, dur, null);
    const copy = {
      id: "ord-" + (1000 + orders.length + Math.floor(Math.random() * 999)),
      robotId: o.robotId,
      recipeId: o.recipeId,
      start: placed.start,
      status: "queued"
    };
    setOrders([...orders, copy]);
    setSelectedOrder(null);
  }

  function deleteOrder(o) {
    setOrders(orders.filter((x) => x.id !== o.id));
    setSelectedOrder(null);
  }

  function onBlockMouseDown(e, o) {
    // Right click is reserved for context menu; ignore.
    if (e.button !== 0) return;
    if (!isEditable(o)) return;
    const r = recipes.find((rr) => rr.id === o.recipeId);
    if (!r) return;
    const duration = window.AppData.recipeDuration(r);

    pressRef.current = {
      orderId: o.id,
      robotId: o.robotId,
      startX: e.clientX,
      origStart: o.start,
      duration,
      moved: false
    };

    const onMove = (ev) => {
      const p = pressRef.current;
      if (!p) return;
      const dx = ev.clientX - p.startX;
      if (!p.moved && Math.abs(dx) < 4) return;
      p.moved = true;
      const dt = Math.round(dx / GANTT.pxPerMin / 5) * 5;
      const desired = Math.max(now, p.origStart + dt);
      const placement = computePlacement(orders, p.robotId, desired, p.duration, p.orderId);
      setMovingOrder({
        orderId: p.orderId,
        robotId: p.robotId,
        ghostStart: placement.start,
        conflict: placement.conflict
      });
    };
    const onUp = (ev) => {
      const p = pressRef.current;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (p && p.moved) {
        const dx = ev.clientX - p.startX;
        const dt = Math.round(dx / GANTT.pxPerMin / 5) * 5;
        const desired = Math.max(now, p.origStart + dt);
        const placement = computePlacement(orders, p.robotId, desired, p.duration, p.orderId);
        setOrders(orders.map((x) => x.id === p.orderId ? { ...x, start: placement.start } : x));
        lastDragEndRef.current = Date.now();
      }
      pressRef.current = null;
      setMovingOrder(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    e.preventDefault();
  }
  const filteredRecipes = recipes;

  return (
    <div className="h-full flex flex-col bg-ink-50">
      {/* Sub-header */}
      <div className="h-12 px-5 border-b border-ink-200 bg-white flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Icon name="CalendarRange" size={14} className="text-ink-500" />
          <span className="text-[13.5px] font-semibold text-ink-900">2026년 5월 13일 (수)</span>
          <button className="ml-1 w-6 h-6 grid place-items-center rounded hover:bg-ink-100 text-ink-500"><Icon name="ChevronLeft" size={13} /></button>
          <button className="w-6 h-6 grid place-items-center rounded hover:bg-ink-100 text-ink-500"><Icon name="ChevronRight" size={13} /></button>
        </div>
        <div className="h-5 w-px bg-ink-200" />
        <div className="flex items-center gap-1">
          {["일", "주", "월"].map((v, i) =>
          <button key={v} className={"h-7 px-2.5 rounded text-[12px] font-medium " + (i === 0 ? "bg-ink-100 text-ink-900" : "text-ink-500 hover:bg-ink-50")}>{v}</button>
          )}
        </div>
        <div className="ml-3 flex items-center gap-2 text-[11.5px] text-ink-500">
          {Object.entries(STATUS_COLORS).map(([k, v]) =>
          <span key={k} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: v.chip }} />
              {v.label}
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="h-8 px-3 rounded-md border border-ink-200 bg-white hover:bg-ink-50 text-[12.5px] font-medium text-ink-700 flex items-center gap-1.5">
            <Icon name="Wand2" size={13} /> 자동 최적화
          </button>
          <button
            onClick={() => setAddDialogOpen(true)}
            className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-medium flex items-center gap-1.5 shadow-sm">
            
            <Icon name="Plus" size={13} /> 작업 추가
          </button>
          <button
            onClick={() => setLibraryOpen((o) => !o)}
            className={"h-8 px-3 rounded-md text-[12.5px] font-medium flex items-center gap-1.5 " + (
            libraryOpen ? "bg-ink-100 text-ink-900" : "border border-ink-200 bg-white text-ink-700 hover:bg-ink-50")}>
            
            <Icon name="PanelRightOpen" size={13} /> 레시피 라이브러리
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex">
        {/* Gantt area */}
        <div className="flex-1 min-w-0 flex flex-col bg-white">
          {/* Top time ruler */}
          <div className="h-10 border-b border-ink-200 flex">
            <div className="shrink-0 border-r border-ink-200 bg-ink-50/70 flex items-center gap-2 px-3 relative" style={{ width: ROBOT_COL_W }}>
              <span className="text-[11px] font-medium text-ink-500 uppercase tracking-wider">로봇</span>
              <FleetFilterDropdown
                value={fleetFilter}
                onChange={setFleetFilter}
                counts={Object.fromEntries([
                ["all", allRobots.length],
                ...window.AppData.fleets.map((f) => [f.id, allRobots.filter((r) => r.fleet === f.id).length])]
                )} />
              
              <span className="ml-auto text-[10.5px] text-ink-400 tnum">{robots.length}</span>
            </div>
            <div ref={headerRef} className="flex-1 overflow-hidden">
              <div className="relative h-full" style={{ width: GANTT_WIDTH }}>
                {Array.from({ length: GANTT.endHour - GANTT.startHour + 1 }, (_, i) => {
                  const h = GANTT.startHour + i;
                  const x = i * 60 * GANTT.pxPerMin;
                  return (
                    <div key={h} className="absolute top-0 bottom-0 flex items-center" style={{ left: x }}>
                      <div className="w-px h-3 bg-ink-300" />
                      <span className="ml-1 text-[10.5px] font-medium text-ink-500 tnum">{String(h).padStart(2, "0")}:00</span>
                    </div>);

                })}
                {/* now line on header */}
                <div className="absolute top-0 bottom-0 w-px bg-rose-500" style={{ left: (now - GANTT.startHour * 60) * GANTT.pxPerMin }}>
                  <div className="absolute -top-px -left-[18px] text-[10px] font-semibold text-rose-600 tnum bg-white px-1 rounded">NOW {fmtTime(now)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="flex-1 min-h-0 flex">
            {/* Robot column */}
            <div ref={robotsColRef} className="shrink-0 border-r border-ink-200 bg-ink-50/40 overflow-y-hidden" style={{ width: ROBOT_COL_W }}>
              {robots.map((r) => {
                const fm = fleetMeta(r.fleet);
                const sm = window.AppData.statusMap[r.status] || window.AppData.statusMap.idle;
                return (
                  <div key={r.id} className="flex items-center gap-2.5 px-3 border-b border-ink-200/70" style={{ height: GANTT.rowH }}>
                    <div className="relative w-7 h-7 rounded-md grid place-items-center" style={{ background: fm.color + "18", color: fm.color }}>
                      <Icon name={r.fleet === "arm" ? "Cog" : "Bot"} size={14} />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white" style={{ background: sm.color }} />
                    </div>
                    <div className="min-w-0 leading-tight">
                      <div className="text-[12.5px] font-medium text-ink-900">{r.id}</div>
                      <div className="text-[10.5px] text-ink-500 truncate">{r.task || sm.label}</div>
                    </div>
                  </div>);

              })}
            </div>

            {/* Chart */}
            <div ref={ganttRef} className="flex-1 overflow-auto relative">
              <div className="relative" style={{ width: GANTT_WIDTH, height: robots.length * GANTT.rowH }}>
                {/* Vertical hour gridlines */}
                {Array.from({ length: GANTT.endHour - GANTT.startHour + 1 }, (_, i) =>
                <div key={i} className="absolute top-0 bottom-0 border-l border-ink-200/80" style={{ left: i * 60 * GANTT.pxPerMin }} />
                )}
                {/* Half-hour gridlines (lighter) */}
                {Array.from({ length: (GANTT.endHour - GANTT.startHour) * 2 }, (_, i) =>
                i % 2 === 1 ? <div key={i} className="absolute top-0 bottom-0 border-l border-ink-100" style={{ left: i * 30 * GANTT.pxPerMin }} /> : null
                )}
                {/* Row dividers + drop zones */}
                {robots.map((r, i) =>
                <div
                  key={r.id}
                  onDragOver={(e) => onRowDragOver(e, r.id)}
                  onDragLeave={() => setHoverPreview(null)}
                  onDrop={(e) => onRowDrop(e, r.id)}
                  className="absolute left-0 right-0 border-b border-ink-200/70"
                  style={{ top: i * GANTT.rowH, height: GANTT.rowH }} />

                )}

                {/* Now line */}
                <div className="absolute top-0 bottom-0 z-20 pointer-events-none" style={{ left: (now - GANTT.startHour * 60) * GANTT.pxPerMin }}>
                  <div className="w-px h-full bg-rose-500" />
                </div>

                {/* Order blocks */}
                {orders.map((o) => {
                  const r = recipes.find((rr) => rr.id === o.recipeId);
                  if (!r) return null;
                  const dur = window.AppData.recipeDuration(r);
                  const rowIdx = robots.findIndex((rb) => rb.id === o.robotId);
                  if (rowIdx < 0) return null;
                  // If this order is currently being moved, hide the original (the ghost renders below)
                  const isMoving = movingOrder?.orderId === o.id;
                  const left = (o.start - GANTT.startHour * 60) * GANTT.pxPerMin;
                  const width = dur * GANTT.pxPerMin;
                  const top = rowIdx * GANTT.rowH + 6;
                  const height = GANTT.rowH - 12;
                  const s = STATUS_COLORS[o.status];
                  const isSel = selectedOrder?.id === o.id;
                  const isHighlight = highlightRecipeId && o.recipeId === highlightRecipeId;
                  const editable = isEditable(o);
                  return (
                    <button
                      key={o.id}
                      onMouseDown={(e) => onBlockMouseDown(e, o)}
                      onClick={(e) => {
                        // suppress click if user just finished a drag
                        if (Date.now() - lastDragEndRef.current < 200) {
                          e.preventDefault();
                          return;
                        }
                        setSelectedOrder({ ...o, recipe: r });
                      }}
                      className={"absolute rounded-md border text-left px-2 py-1.5 transition shadow-sm overflow-hidden " +
                      s.bg + " " + s.border + " " + s.fg + (
                      isSel ? " ring-2 ring-blue-500 ring-offset-1 z-10" : " hover:shadow-md hover:z-10") + (
                      isHighlight ? " ring-2 ring-amber-400" : "") + (
                      isMoving ? " opacity-30" : "") + (
                      editable ? " cursor-grab active:cursor-grabbing" : " cursor-pointer")
                      }
                      style={{ left, top, width, height }}>
                      
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="w-1 h-3 rounded-sm" style={{ background: s.chip }} />
                        <span className="text-[11px] font-semibold truncate flex-1">{r.name}</span>
                        {!editable && o.status === "queued" &&
                        <Icon name="Lock" size={9} className="opacity-60 shrink-0" />
                        }
                      </div>
                      <div className="text-[10px] tnum opacity-80 flex items-center gap-1.5">
                        <span>{fmtTime(o.start)}—{fmtTime(o.start + dur)}</span>
                        <span className="opacity-60">·</span>
                        <span>{dur}분</span>
                        {o.status === "running" && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse ml-auto" />}
                        {o.status === "error" && <Icon name="AlertTriangle" size={10} className="ml-auto" />}
                      </div>
                      {o.status === "running" &&
                      <div className="absolute left-0 bottom-0 h-0.5 shimmer-bar" style={{ width: "100%" }} />
                      }
                    </button>);

                })}

                {/* Moving ghost (live preview during block drag) */}
                {movingOrder && (() => {
                  const o = orders.find((x) => x.id === movingOrder.orderId);
                  if (!o) return null;
                  const r = recipes.find((rr) => rr.id === o.recipeId);
                  if (!r) return null;
                  const dur = window.AppData.recipeDuration(r);
                  const rowIdx = robots.findIndex((rb) => rb.id === movingOrder.robotId);
                  if (rowIdx < 0) return null;
                  const left = (movingOrder.ghostStart - GANTT.startHour * 60) * GANTT.pxPerMin;
                  const width = dur * GANTT.pxPerMin;
                  const top = rowIdx * GANTT.rowH + 6;
                  return (
                    <div
                      className={"absolute rounded-md border-2 px-2 py-1.5 z-30 pointer-events-none shadow-pop " + (
                      movingOrder.conflict ? "border-amber-500 bg-amber-100" : "border-blue-500 bg-blue-100")
                      }
                      style={{ left, top, width, height: GANTT.rowH - 12 }}>
                      
                      <div className="text-[11px] font-semibold text-ink-900 truncate">{r.name}</div>
                      <div className="text-[10px] tnum text-ink-700 flex items-center gap-1.5">
                        {fmtTime(movingOrder.ghostStart)}—{fmtTime(movingOrder.ghostStart + dur)}
                        {movingOrder.conflict &&
                        <span className="ml-auto inline-flex items-center gap-0.5 text-amber-700">
                            <Icon name="AlertTriangle" size={9} /> 충돌 회피
                          </span>
                        }
                      </div>
                    </div>);

                })()}

                {/* Hover preview ghost */}
                {hoverPreview && (() => {
                  const rowIdx = robots.findIndex((rb) => rb.id === hoverPreview.robotId);
                  if (rowIdx < 0) return null;
                  const left = (hoverPreview.start - GANTT.startHour * 60) * GANTT.pxPerMin;
                  const width = hoverPreview.duration * GANTT.pxPerMin;
                  const top = rowIdx * GANTT.rowH + 6;
                  const r = recipes.find((rr) => rr.id === hoverPreview.recipeId);
                  return (
                    <>
                      {/* buffer */}
                      <div
                        className="absolute pointer-events-none border-2 border-dashed border-amber-300 bg-amber-50/50 rounded-md"
                        style={{
                          left: left - GANTT.BUFFER_MIN * GANTT.pxPerMin,
                          width: (hoverPreview.duration + 2 * GANTT.BUFFER_MIN) * GANTT.pxPerMin,
                          top, height: GANTT.rowH - 12
                        }} />
                      
                      <div
                        className={"absolute pointer-events-none rounded-md border-2 z-20 px-2 py-1.5 " + (
                        hoverPreview.conflict ?
                        "border-amber-500 bg-amber-100/80" :
                        "border-blue-500 bg-blue-100/80")
                        }
                        style={{ left, width, top, height: GANTT.rowH - 12 }}>
                        
                        <div className="text-[11px] font-semibold text-ink-900 truncate">{r?.name}</div>
                        <div className="text-[10px] tnum text-ink-700">
                          {fmtTime(hoverPreview.start)} · {hoverPreview.duration}분
                          {hoverPreview.conflict && " · 충돌 회피 +" + (hoverPreview.start - timeFromClientXFallback(hoverPreview)) + "m"}
                        </div>
                      </div>
                    </>);

                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Recipe library slide panel */}
        {libraryOpen &&
        <RecipeLibrary
          onDragStart={onLibDragStart}
          onDragEnd={() => {setDraggingRecipe(null);setHoverPreview(null);}}
          highlightRecipeId={highlightRecipeId} />

        }
      </div>

      {/* Order details popover */}
      {selectedOrder &&
      <OrderDetail
        order={selectedOrder}
        editable={isEditable(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onDelete={() => deleteOrder(selectedOrder)}
        onCopy={() => copyOrder(selectedOrder)} />

      }

      {/* Add Order modal */}
      {addDialogOpen &&
      <AddOrderDialog
        robots={robots}
        recipes={recipes}
        orders={orders}
        computePlacement={computePlacement}
        onClose={() => setAddDialogOpen(false)}
        onCreate={(payload) => {
          const r = recipes.find((rr) => rr.id === payload.recipeId);
          if (!r) return;
          const duration = window.AppData.recipeDuration(r);
          const placed = computePlacement(orders, payload.robotId, payload.start, duration, null);
          const newOrder = {
            id: "ord-" + (1000 + orders.length + Math.floor(Math.random() * 99)),
            robotId: payload.robotId,
            recipeId: payload.recipeId,
            start: placed.start,
            status: "queued"
          };
          setOrders([...orders, newOrder]);
          setAddDialogOpen(false);
          // scroll/highlight the new block briefly
          setHighlightRecipeId(payload.recipeId);
          setTimeout(() => setHighlightRecipeId(null), 3500);
        }} />

      }
    </div>);

}

function timeFromClientXFallback() {return 0;}

function FleetFilterDropdown({ value, onChange, counts }) {
  const [open, setOpen] = schUseState(false);
  const fleets = window.AppData.fleets;
  const items = [
  { id: "all", label: "전체 Fleet", color: null },
  ...fleets.map((f) => ({ id: f.id, label: f.name + " Fleet", color: f.color }))];

  const current = items.find((i) => i.id === value) || items[0];
  return (
    <div className="relative flex-1 min-w-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className={"h-7 w-full pl-2 pr-1.5 rounded-md border bg-white flex items-center gap-1.5 text-[11.5px] font-medium transition " + (
        open ? "border-blue-400 ring-2 ring-blue-100" : "border-ink-200 hover:border-ink-300")
        }>
        
        {current.color && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: current.color }} />}
        <span className="text-ink-800 truncate">{current.id === "all" ? "전체" : fleets.find((f) => f.id === current.id)?.name || current.id.toUpperCase()}</span>
        <Icon name="ChevronDown" size={11} className={"ml-auto text-ink-400 transition " + (open ? "rotate-180" : "")} />
      </button>
      {open &&
      <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full mt-1 left-0 right-0 min-w-[180px] bg-white rounded-lg shadow-pop border border-ink-200 py-1 overflow-hidden">
            {items.map((it) =>
          <button
            key={it.id}
            onClick={() => {onChange(it.id);setOpen(false);}}
            className={"w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-blue-50 " + (it.id === value ? "bg-blue-50" : "")}>
            
                {it.color ?
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: it.color }} /> :
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-ink-400" />
            }
                <span className={"text-[12px] flex-1 " + (it.id === value ? "text-blue-700 font-medium" : "text-ink-800")}>{it.label}</span>
                <span className="text-[10.5px] text-ink-400 tnum">{counts[it.id]}</span>
                {it.id === value && <Icon name="Check" size={11} className="text-blue-600 ml-1" />}
              </button>
          )}
          </div>
        </>
      }
    </div>);

}

// ─── Recipe Library panel ───────────────────────────────────────────
function RecipeLibrary({ onDragStart, onDragEnd, highlightRecipeId }) {
  const [q, setQ] = schUseState("");
  const [fleetFilter, setFleetFilter] = schUseState("all");
  const recipes = window.AppData.recipes.filter((r) => {
    if (fleetFilter !== "all" && r.fleet !== fleetFilter) return false;
    if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  return (
    <aside className="w-[320px] shrink-0 border-l border-ink-200 bg-white flex flex-col">
      <div className="h-12 px-4 border-b border-ink-200 flex items-center gap-2">
        <Icon name="Library" size={14} className="text-ink-500" />
        <span className="text-[13px] font-semibold text-ink-900">레시피 라이브러리</span>
        <span className="text-[11px] text-ink-400 tnum">{recipes.length}</span>
      </div>
      <div className="px-4 py-3 border-b border-ink-200 space-y-2">
        <div className="relative">
          <Icon name="Search" size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="레시피 검색"
            className="h-8 pl-7 pr-3 w-full rounded-md border border-ink-200 bg-ink-50 text-[12px] outline-none focus:border-blue-400 focus:bg-white" />
          
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {[{ id: "all", label: "전체" }, ...window.AppData.fleets.map((f) => ({ id: f.id, label: f.name }))].map((t) =>
          <button
            key={t.id}
            onClick={() => setFleetFilter(t.id)}
            className={"h-6 px-2 rounded text-[11px] font-medium " + (
            fleetFilter === t.id ? "bg-blue-50 text-blue-700" : "text-ink-500 hover:bg-ink-100")
            }>
            {t.label}</button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        <div className="text-[10.5px] text-ink-400 px-1 pt-1 flex items-center gap-1">
          <Icon name="GripVertical" size={11} /> 카드를 간트로 드래그하여 스케줄
        </div>
        {recipes.map((r) => {
          const fm = fleetMeta(r.fleet);
          const dur = window.AppData.recipeDuration(r);
          const isHL = r.id === highlightRecipeId;
          return (
            <div
              key={r.id}
              draggable
              onDragStart={(e) => onDragStart(e, r.id)}
              onDragEnd={onDragEnd}
              className={"group rounded-lg border bg-white p-3 cursor-grab active:cursor-grabbing transition select-none " + (
              isHL ? "border-amber-400 ring-2 ring-amber-200" : "border-ink-200 hover:border-blue-400 hover:shadow-card")
              }>
              
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-md grid place-items-center shrink-0" style={{ background: fm.color + "18", color: fm.color }}>
                  <Icon name="Workflow" size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium text-ink-900 truncate">{r.name}</div>
                  <div className="text-[10.5px] text-ink-500 tnum mt-0.5">{r.id} · {fm.name}</div>
                </div>
                <Icon name="GripVertical" size={13} className="text-ink-300 group-hover:text-ink-500 mt-1" />
              </div>
              {/* mini-flow */}
              <div className="flex items-center gap-1 mt-2.5 overflow-hidden">
                {r.steps.slice(0, 6).map((s, i) => {
                  const a = actionMeta(s.actionType);
                  return (
                    <React.Fragment key={i}>
                      <div className="w-5 h-5 rounded grid place-items-center shrink-0" style={{ background: a.color + "18" }}>
                        <Icon name={a.icon} size={10} style={{ color: a.color }} />
                      </div>
                      {i < Math.min(r.steps.length, 6) - 1 && <div className="w-1 h-px bg-ink-300 shrink-0" />}
                    </React.Fragment>);

                })}
                {r.steps.length > 6 && <span className="text-[10px] text-ink-400 ml-0.5">+{r.steps.length - 6}</span>}
                <span className="ml-auto text-[10.5px] text-ink-500 tnum">{dur}분 · {r.steps.length}단계</span>
              </div>
            </div>);

        })}
      </div>
      <div className="px-4 py-3 border-t border-ink-200 bg-ink-50/40 text-[10.5px] text-ink-500 leading-relaxed flex gap-1.5">
        <Icon name="Info" size={11} className="mt-0.5 shrink-0 text-ink-400" />
        <span>드래그 시 앞뒤 작업 사이에 자동으로 <strong className="text-ink-700">{GANTT.BUFFER_MIN}분 버퍼</strong>가 적용됩니다.</span>
      </div>
    </aside>);

}

// ─── Order detail popover ───────────────────────────────────────────
function OrderDetail({ order, editable, onClose, onDelete, onCopy }) {
  const r = order.recipe;
  const dur = window.AppData.recipeDuration(r);
  const fm = fleetMeta(r.fleet);
  const s = STATUS_COLORS[order.status];
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end p-4 pointer-events-none">
      <div className="w-[420px] bg-white rounded-xl shadow-pop border border-ink-200 pointer-events-auto overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-ink-200">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-semibold" style={{ background: s.chip + "20", color: s.chip }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.chip }} /> {s.label}
            </span>
            <span className="text-[10.5px] text-ink-400 tnum">{order.id}</span>
            <button onClick={onClose} className="ml-auto w-7 h-7 grid place-items-center rounded hover:bg-ink-100 text-ink-500"><Icon name="X" size={14} /></button>
          </div>
          <h3 className="text-[16px] font-semibold text-ink-900 mt-1.5">{r.name}</h3>
          <div className="text-[11.5px] text-ink-500 mt-0.5 flex items-center gap-3">
            <span className="flex items-center gap-1"><Icon name="Bot" size={11} /> {order.robotId}</span>
            <span className="flex items-center gap-1"><Icon name="Clock" size={11} /> {fmtTime(order.start)} — {fmtTime(order.start + dur)}</span>
            <span className="tnum">{dur}분</span>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-ink-200">
          <div className="text-[10.5px] font-medium text-ink-400 uppercase tracking-wider mb-2">단계 진행</div>
          <div className="space-y-1.5">
            {r.steps.map((st, i) => {
              const a = actionMeta(st.actionType);
              // simulate progress
              const isDone = order.status === "done" || order.status === "running" && i < Math.floor(r.steps.length * 0.6);
              const isCurr = order.status === "running" && i === Math.floor(r.steps.length * 0.6);
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={"w-5 h-5 rounded-full grid place-items-center shrink-0 " + (
                  isDone ? "bg-emerald-500 text-white" : isCurr ? "bg-blue-500 text-white" : "bg-ink-100 text-ink-400")
                  }>
                    {isDone ? <Icon name="Check" size={10} /> : isCurr ? <Icon name={a.icon} size={10} /> : <span className="text-[9px] font-semibold tnum">{i + 1}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Icon name={a.icon} size={11} style={{ color: a.color }} />
                    <span className="text-[12px] text-ink-800">{a.label}</span>
                    <span className="text-[10.5px] text-ink-400">@ {st.nodeId}</span>
                  </div>
                  <span className="text-[10.5px] text-ink-500 tnum">{st.duration}m</span>
                </div>);

            })}
          </div>
        </div>

        <div className="px-5 py-3 grid grid-cols-3 gap-3 border-b border-ink-200">
          <Stat label="Fleet" value={fm.name} />
          <Stat label="우선순위" value="P2 · 표준" />
          <Stat label="요청자" value="auto-disp" />
        </div>

        <div className="px-5 py-3 flex items-center gap-2">
          {editable ?
          <>
              <button onClick={onCopy} className="flex-1 h-9 rounded-md border border-ink-200 bg-white hover:bg-ink-50 text-[12.5px] font-medium text-ink-700 flex items-center justify-center gap-1.5">
                <Icon name="Copy" size={13} /> 복사
              </button>
              <button className="flex-1 h-9 rounded-md border border-ink-200 bg-white hover:bg-ink-50 text-[12.5px] font-medium text-ink-700 flex items-center justify-center gap-1.5">
                <Icon name="ArrowRightLeft" size={13} /> 재할당
              </button>
              <button onClick={onDelete} className="h-9 px-3 rounded-md border border-rose-200 bg-white hover:bg-rose-50 text-[12.5px] font-medium text-rose-600 flex items-center justify-center gap-1.5">
                <Icon name="Trash2" size={13} />
              </button>
            </> :

          <>
              <div className="flex-1 h-9 rounded-md bg-ink-50 border border-ink-200 text-[11.5px] text-ink-500 flex items-center justify-center gap-1.5">
                <Icon name="Lock" size={12} />
                {order.status === "done" && "완료된 작업은 수정할 수 없습니다"}
                {order.status === "running" && "진행 중인 작업은 수정할 수 없습니다"}
                {order.status === "error" && "실패 - 시스템 검토 필요"}
                {order.status === "queued" && "현재 시점 이후 작업만 수정 가능"}
              </div>
            </>
          }
        </div>
      </div>
    </div>);

}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-[10.5px] text-ink-400 uppercase tracking-wider">{label}</div>
      <div className="text-[12.5px] font-medium text-ink-900 mt-0.5 truncate">{value}</div>
    </div>);

}

window.SchedulerView = SchedulerView;