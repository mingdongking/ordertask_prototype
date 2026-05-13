// Recipe Builder view
const { useState: rcpUseState, useMemo: rcpUseMemo, useRef: rcpUseRef } = React;

function fleetMeta(id) {
  return window.AppData.fleets.find(f => f.id === id) || { name: id, color: "#64748b" };
}
function actionMeta(id) {
  return window.AppData.actionTypes.find(a => a.id === id) || { id, label: id, icon: "Circle", color: "#64748b" };
}

// ─── List view (table of recipes) ─────────────────────────────────
function RecipeList({ onOpen, onNew }) {
  const recipes = window.AppData.recipes;
  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold text-ink-900 tracking-tight">레시피 생성</h1>
          <p className="text-[12.5px] text-ink-500 mt-0.5">Fleet 별 작업 시퀀스를 정의하고 스케줄러에서 디스패치합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-3 rounded-md border border-ink-200 bg-white hover:bg-ink-50 text-[12.5px] font-medium text-ink-700 flex items-center gap-1.5">
            <Icon name="Upload" size={13}/> 가져오기
          </button>
          <button
            onClick={onNew}
            className="h-9 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-medium flex items-center gap-1.5 shadow-sm"
          >
            <Icon name="Plus" size={14}/> 새 레시피 생성
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "전체 레시피",   value: recipes.length, icon: "Workflow", tone: "blue" },
          { label: "퍼블리시드",   value: recipes.filter(r => r.status === "published").length, icon: "CheckCircle2", tone: "emerald" },
          { label: "초안",        value: recipes.filter(r => r.status === "draft").length, icon: "FilePen", tone: "amber" },
          { label: "오늘 디스패치", value: 47, icon: "Send", tone: "slate" },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-ink-200 rounded-lg p-3.5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] text-ink-500">{s.label}</span>
              <Icon name={s.icon} size={14} className={
                s.tone === "blue" ? "text-blue-500" :
                s.tone === "emerald" ? "text-emerald-500" :
                s.tone === "amber" ? "text-amber-500" : "text-ink-400"
              }/>
            </div>
            <div className="text-[24px] font-semibold text-ink-900 tnum mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-ink-200 rounded-lg shadow-card overflow-hidden">
        <div className="h-11 px-4 flex items-center gap-3 border-b border-ink-200 bg-ink-50/60">
          <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-700">
            <Icon name="ListFilter" size={13}/> 전체 레시피
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Icon name="Search" size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400"/>
              <input placeholder="이름으로 검색" className="h-8 pl-7 pr-3 rounded-md border border-ink-200 bg-white text-[12px] w-[200px] outline-none focus:border-blue-400"/>
            </div>
            <select className="h-8 px-2 rounded-md border border-ink-200 bg-white text-[12px] text-ink-700">
              <option>모든 Fleet</option>
              {window.AppData.fleets.map(f => (
                <option key={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-[11.5px] text-ink-500 border-b border-ink-200">
              <th className="font-medium px-4 py-2.5 w-8"><input type="checkbox" className="rounded"/></th>
              <th className="font-medium py-2.5">레시피 이름</th>
              <th className="font-medium py-2.5">Fleet 대상</th>
              <th className="font-medium py-2.5">단계 수</th>
              <th className="font-medium py-2.5">예상 소요</th>
              <th className="font-medium py-2.5">상태</th>
              <th className="font-medium py-2.5">최근 수정</th>
              <th className="font-medium py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {recipes.map(r => {
              const dur = window.AppData.recipeDuration(r);
              const fm = fleetMeta(r.fleet);
              return (
                <tr key={r.id} className="border-b border-ink-100 hover:bg-ink-50/50 group">
                  <td className="px-4 py-3"><input type="checkbox" className="rounded"/></td>
                  <td className="py-3">
                    <button onClick={() => onOpen(r.id)} className="font-medium text-ink-900 hover:text-blue-600 text-left">
                      {r.name}
                    </button>
                    <div className="text-[11px] text-ink-400 mt-0.5 tnum">{r.id}</div>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-ink-100 text-ink-700 text-[11.5px]">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: fm.color }}/>
                      {fm.name}
                    </span>
                  </td>
                  <td className="py-3 tnum text-ink-700">{r.steps.length}단계</td>
                  <td className="py-3 tnum text-ink-700">{dur}분</td>
                  <td className="py-3">
                    {r.status === "published" ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"/> Draft
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-ink-500 tnum">2일 전</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => onOpen(r.id)} className="w-7 h-7 grid place-items-center rounded hover:bg-ink-100 text-ink-500"><Icon name="Pencil" size={13}/></button>
                      <button className="w-7 h-7 grid place-items-center rounded hover:bg-ink-100 text-ink-500"><Icon name="Copy" size={13}/></button>
                      <button className="w-7 h-7 grid place-items-center rounded hover:bg-ink-100 text-ink-500"><Icon name="Trash2" size={13}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Builder (map + action panel + flow timeline) ─────────────────
function RecipeBuilder({ recipeId, onBack }) {
  const initial = window.AppData.recipes.find(r => r.id === recipeId);
  const isNew = !initial;
  const [name, setName] = rcpUseState(initial ? initial.name : "신규 레시피");
  const [fleet, setFleet] = rcpUseState(initial ? initial.fleet : "amr");
  const [nodes, setNodes] = rcpUseState(() => {
    if (initial && initial.nodes && initial.nodes.length > 0) {
      return initial.nodes;
    }
    if (initial) {
      // synthesize nodes from step list along an S-curve
      return initial.steps.map((s, i) => {
        const cx = 120 + (i % 4) * 160;
        const cy = 140 + Math.floor(i / 4) * 130;
        return { id: s.nodeId, x: cx, y: cy, label: "Node " + (i+1) };
      });
    }
    return [];
  });
  const [steps, setSteps] = rcpUseState(() => initial ? [...initial.steps] : []);
  const [selectedStepIdx, setSelectedStepIdx] = rcpUseState(steps.length > 0 ? 0 : null);

  const mapRef = rcpUseRef(null);
  const [mapMode, setMapMode] = rcpUseState("select"); // "select" = pick from existing, "create" = click empty to add custom node
  const [dragStepIdx, setDragStepIdx] = rcpUseState(null);
  const [dragOverIdx, setDragOverIdx] = rcpUseState(null);

  function handleMapClick(e) {
    // Only create a custom node in create mode
    if (mapMode !== "create") return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const id = "N" + (nodes.length + 1);
    const newNode = { id, x, y, label: "Custom " + (nodes.length + 1), custom: true };
    addStepForNode(newNode);
  }

  function addStepForNode(node) {
    // Add node if not already in node set
    if (!nodes.find(n => n.id === node.id)) {
      setNodes([...nodes, node]);
    }
    // Pick a default action for this fleet
    const validActs = window.AppData.actionTypes.filter(a => a.fleets.includes(fleet));
    const defaultAct = validActs[0] || window.AppData.actionTypes[0];
    const newStep = { nodeId: node.id, actionType: defaultAct.id, duration: defaultAct.defaultDuration };
    setSteps([...steps, newStep]);
    setSelectedStepIdx(steps.length);
  }

  function updateStep(idx, patch) {
    setSteps(steps.map((s, i) => i === idx ? { ...s, ...patch } : s));
  }
  function removeStep(idx) {
    const node = steps[idx].nodeId;
    setSteps(steps.filter((_, i) => i !== idx));
    setNodes(nodes.filter(n => n.id !== node));
    setSelectedStepIdx(null);
  }

  const totalDur = steps.reduce((s, st) => s + (st.duration || 0), 0);
  const selectedStep = selectedStepIdx !== null ? steps[selectedStepIdx] : null;
  const selectedNode = selectedStep ? nodes.find(n => n.id === selectedStep.nodeId) : null;

  return (
    <div className="h-full flex flex-col">
      {/* Sub-header */}
      <div className="h-12 px-5 border-b border-ink-200 bg-white flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-[12.5px] text-ink-500 hover:text-ink-900">
          <Icon name="ArrowLeft" size={13}/> 목록
        </button>
        <span className="text-ink-300">/</span>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="text-[14px] font-semibold text-ink-900 bg-transparent outline-none focus:bg-ink-50 px-1.5 py-0.5 rounded -ml-1.5"
        />
        <span className="text-[11.5px] text-ink-400 tnum">{isNew ? "신규" : recipeId}</span>
        <div className="ml-auto flex items-center gap-2">
          <button className="h-8 px-3 rounded-md text-[12.5px] text-ink-700 hover:bg-ink-100 flex items-center gap-1.5">
            <Icon name="Play" size={12}/> 시뮬레이션
          </button>
          <button className="h-8 px-3 rounded-md border border-ink-200 bg-white hover:bg-ink-50 text-[12.5px] font-medium text-ink-700">
            초안 저장
          </button>
          <button className="h-8 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-medium flex items-center gap-1.5">
            <Icon name="Send" size={12}/> 퍼블리시
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid" style={{ gridTemplateColumns: "280px 1fr" }}>
        {/* LEFT — Action panel */}
        <div className="border-r border-ink-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-ink-200">
            <div className="text-[11px] font-medium text-ink-400 uppercase tracking-wider mb-1.5">레시피 명</div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="레시피 이름을 입력하세요"
              className="h-9 px-2.5 w-full rounded-md border border-ink-200 bg-white text-[13px] text-ink-900 font-medium outline-none focus:border-blue-400 placeholder:text-ink-400 placeholder:font-normal"
            />
            <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-ink-500">
              <Icon name="Hash" size={10}/> <span className="tnum">{isNew ? "신규 · 미저장" : recipeId}</span>
            </div>
          </div>

          <div className="p-4 border-b border-ink-200">
            <div className="text-[11px] font-medium text-ink-400 uppercase tracking-wider mb-2">대상 Fleet</div>
            <div className="grid grid-cols-3 gap-1.5">
              {window.AppData.fleets.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFleet(f.id)}
                  className={
                    "h-8 rounded-md text-[11.5px] font-medium border " +
                    (fleet === f.id
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50")
                  }
                >
                  {f.id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-ink-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-medium text-ink-400 uppercase tracking-wider">선택한 노드</div>
              {selectedNode && (
                <button onClick={() => removeStep(selectedStepIdx)} className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1">
                  <Icon name="Trash2" size={11}/> 삭제
                </button>
              )}
            </div>
            {!selectedNode ? (
              <div className="rounded-md bg-ink-50 border border-dashed border-ink-200 p-3 text-center">
                <Icon name="MousePointerClick" size={16} className="text-ink-400 mx-auto mb-1"/>
                <p className="text-[11.5px] text-ink-500 leading-relaxed">맵에서 점선 노드를 클릭하여<br/>단계로 추가하세요</p>
              </div>
            ) : (
              <div className="rounded-md border border-ink-200 bg-ink-50/40 p-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white grid place-items-center text-[11px] font-semibold tnum">
                    {selectedStepIdx + 1}
                  </div>
                  <div className="leading-tight">
                    <div className="text-[12.5px] font-medium text-ink-900">{selectedNode.label}</div>
                    <div className="text-[10.5px] text-ink-500 tnum">x: {selectedNode.x}, y: {selectedNode.y}</div>
                  </div>
                </div>
                <input
                  value={selectedNode.label}
                  onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, label: e.target.value } : n))}
                  className="mt-2.5 w-full h-7 px-2 rounded border border-ink-200 bg-white text-[11.5px] outline-none focus:border-blue-400"
                />
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-medium text-ink-400 uppercase tracking-wider">Action Type</div>
              <span className="text-[10px] text-ink-400 tnum">
                {window.AppData.actionTypes.filter(a => a.fleets.includes(fleet)).length}개 사용 가능
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {window.AppData.actionTypes.filter(a => a.fleets.includes(fleet)).map(a => {
                const isActive = selectedStep && selectedStep.actionType === a.id;
                return (
                  <button
                    key={a.id}
                    disabled={!selectedStep}
                    onClick={() => updateStep(selectedStepIdx, { actionType: a.id, duration: a.defaultDuration })}
                    className={
                      "h-14 rounded-md border flex flex-col items-center justify-center gap-1 transition " +
                      (!selectedStep ? "opacity-40 cursor-not-allowed border-ink-200 " : "") +
                      (isActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50")
                    }
                  >
                    <Icon name={a.icon} size={15} style={{ color: a.color }} />
                    <span className="text-[10.5px] font-medium text-ink-700">{a.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-[10px] text-ink-400 leading-relaxed">
              Fleet 변경 시 사용 가능한 액션이 갱신됩니다.
            </div>

            {selectedStep && (
              <div className="mt-4">
                <div className="text-[11px] font-medium text-ink-400 uppercase tracking-wider mb-1.5">소요 시간 (분)</div>
                <div className="flex items-center gap-2">
                  <input
                    type="range" min="1" max="60"
                    value={selectedStep.duration}
                    onChange={e => updateStep(selectedStepIdx, { duration: +e.target.value })}
                    className="flex-1 accent-blue-600"
                  />
                  <div className="w-12 h-7 rounded border border-ink-200 bg-white text-[12px] font-medium grid place-items-center tnum">{selectedStep.duration}m</div>
                </div>

                <div className="text-[11px] font-medium text-ink-400 uppercase tracking-wider mt-4 mb-1.5">파라미터</div>
                <div className="space-y-1.5">
                  {selectedStep.actionType === "MOVE" && (
                    <Param label="속도" value="0.8 m/s"/>
                  )}
                  {selectedStep.actionType === "LIFT" && (
                    <Param label="높이" value="120 mm"/>
                  )}
                  {(selectedStep.actionType === "LOAD" || selectedStep.actionType === "UNLOAD") && (
                    <Param label="페이로드" value="Box-L"/>
                  )}
                  {selectedStep.actionType === "SCAN" && (
                    <Param label="모드" value="Barcode"/>
                  )}
                  <Param label="재시도" value="3회"/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Map + Timeline */}
        <div className="min-w-0 flex flex-col">
          <div className="relative flex-1 min-h-0 overflow-hidden bg-ink-50">
            {/* Map toolbar */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white rounded-md border border-ink-200 shadow-card p-1">
              <button
                onClick={() => setMapMode("select")}
                className={"h-7 px-2 rounded text-[11.5px] font-medium flex items-center gap-1 " +
                  (mapMode === "select" ? "bg-blue-50 text-blue-700" : "text-ink-600 hover:bg-ink-100")
                }
                title="기존 노드에서 선택"
              >
                <Icon name="MousePointer2" size={12}/> 노드 선택
              </button>
              <button
                onClick={() => setMapMode("create")}
                className={"h-7 px-2 rounded text-[11.5px] font-medium flex items-center gap-1 " +
                  (mapMode === "create" ? "bg-blue-50 text-blue-700" : "text-ink-600 hover:bg-ink-100")
                }
                title="맵 클릭으로 커스텀 노드 추가"
              >
                <Icon name="Plus" size={12}/> 새 노드
              </button>
              <div className="w-px h-5 bg-ink-200 mx-0.5"/>
              <button className="w-7 h-7 grid place-items-center rounded hover:bg-ink-100 text-ink-600"><Icon name="ZoomOut" size={13}/></button>
              <span className="text-[11px] text-ink-500 tnum px-1">100%</span>
              <button className="w-7 h-7 grid place-items-center rounded hover:bg-ink-100 text-ink-600"><Icon name="ZoomIn" size={13}/></button>
            </div>
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-white rounded-md border border-ink-200 shadow-card px-2.5 py-1.5">
              <span className="text-[11px] text-ink-500">맵</span>
              <select className="text-[11.5px] font-medium text-ink-900 bg-transparent outline-none">
                <option>Floor 2 - 자동화 라인</option>
                <option>Floor 1 - 입출고동</option>
              </select>
            </div>

            <div
              ref={mapRef}
              onClick={handleMapClick}
              className={"absolute inset-0 grid-bg " + (mapMode === "create" ? "cursor-crosshair" : "cursor-default")}
            >
              {/* Zones */}
              <div className="absolute top-[40px] left-[40px] w-[280px] h-[160px] rounded border border-blue-200 bg-blue-50/30 pointer-events-none">
                <div className="absolute top-1 left-2 text-[10px] font-medium text-blue-700/70 tracking-wide uppercase">Zone A · Loading</div>
              </div>
              <div className="absolute top-[200px] left-[400px] w-[320px] h-[180px] rounded border border-emerald-200 bg-emerald-50/30 pointer-events-none">
                <div className="absolute top-1 left-2 text-[10px] font-medium text-emerald-700/70 tracking-wide uppercase">Zone B · Drop-off</div>
              </div>
              <div className="absolute top-[330px] left-[80px] w-[180px] h-[60px] rounded border border-amber-200 bg-amber-50/30 pointer-events-none">
                <div className="absolute top-1 left-2 text-[10px] font-medium text-amber-700/70 tracking-wide uppercase">Charging</div>
              </div>
              <div className="absolute top-[330px] left-[330px] w-[170px] h-[60px] rounded border border-purple-200 bg-purple-50/30 pointer-events-none">
                <div className="absolute top-1 left-2 text-[10px] font-medium text-purple-700/70 tracking-wide uppercase">ARM Cells</div>
              </div>

              {/* Pre-placed map nodes (catalog stations available to this fleet) */}
              {window.AppData.mapNodes
                .filter(mn => mn.fleets.includes(fleet))
                .filter(mn => !nodes.find(n => n.id === mn.id))
                .map(mn => (
                  <button
                    key={mn.id}
                    onClick={(e) => { e.stopPropagation(); addStepForNode({ ...mn }); }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: mn.x, top: mn.y }}
                    title={"클릭하여 단계로 추가: " + mn.label}
                  >
                    <div className="w-7 h-7 rounded-full border-2 border-dashed border-ink-300 bg-white/70 grid place-items-center transition group-hover:border-blue-500 group-hover:bg-blue-50 group-hover:scale-110">
                      <Icon name="Plus" size={11} className="text-ink-400 group-hover:text-blue-600"/>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 text-[9.5px] text-ink-500 group-hover:text-blue-700 whitespace-nowrap font-medium">
                      {mn.label}
                    </div>
                  </button>
                ))
              }

              {/* Path lines between selected nodes */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
                {steps.map((s, i) => {
                  if (i === 0) return null;
                  const a = nodes.find(n => n.id === steps[i-1].nodeId);
                  const b = nodes.find(n => n.id === s.nodeId);
                  if (!a || !b) return null;
                  const mx = (a.x + b.x) / 2;
                  const my = (a.y + b.y) / 2 - 20;
                  return (
                    <g key={i}>
                      <path
                        d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        opacity="0.7"
                      />
                      <polygon
                        points={`${b.x},${b.y} ${b.x-8},${b.y-4} ${b.x-8},${b.y+4}`}
                        fill="#2563eb"
                        opacity="0.7"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Selected nodes (used in this recipe) */}
              {nodes.map((n, i) => {
                const stepIdx = steps.findIndex(s => s.nodeId === n.id);
                const act = stepIdx >= 0 ? actionMeta(steps[stepIdx].actionType) : actionMeta("MOVE");
                const isSel = stepIdx === selectedStepIdx;
                return (
                  <div
                    key={n.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedStepIdx(stepIdx); }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ left: n.x, top: n.y }}
                  >
                    {isSel && <div className="absolute inset-0 rounded-full pulse-ring border-2" style={{ borderColor: act.color, width: 36, height: 36, left: -18, top: -18 }}/>}
                    <div
                      className={"w-9 h-9 rounded-full grid place-items-center shadow-md border-2 transition " + (isSel ? "scale-110" : "")}
                      style={{ background: "#fff", borderColor: act.color }}
                    >
                      <Icon name={act.icon} size={14} style={{ color: act.color }}/>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
                      <div className="text-[10.5px] font-semibold text-ink-900 tnum">{stepIdx + 1}. {n.label}</div>
                      <div className="text-[10px] text-ink-500 text-center">{act.label}</div>
                    </div>
                  </div>
                );
              })}

              {/* Mode hint badge */}
              <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1.5 rounded-md bg-white border border-ink-200 shadow-card flex items-center gap-1.5 text-[10.5px] text-ink-600">
                <Icon name={mapMode === "create" ? "Crosshair" : "MousePointer2"} size={11} className="text-blue-600"/>
                {mapMode === "create"
                  ? "맵을 클릭하여 커스텀 노드 추가"
                  : <span><strong className="text-ink-800">기존 노드</strong>를 클릭하여 단계로 추가</span>
                }
              </div>

              {/* Empty state hint (only when no pre-placed nodes available for this fleet) */}
              {nodes.length === 0 && window.AppData.mapNodes.filter(mn => mn.fleets.includes(fleet)).length === 0 && (
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-white border border-dashed border-ink-300 grid place-items-center mb-2">
                      <Icon name="MousePointerClick" size={18} className="text-ink-400"/>
                    </div>
                    <div className="text-[13px] font-medium text-ink-700">맵을 클릭하여 노드 추가</div>
                    <div className="text-[11.5px] text-ink-500 mt-0.5">툴바에서 <strong>새 노드</strong> 모드를 활성화한 후 맵을 클릭하세요</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Flow timeline */}
          <div className="h-[152px] border-t border-ink-200 bg-white px-5 py-3 overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink-700">
                <Icon name="GitBranch" size={13}/> Flow 시퀀스
                <span className="text-ink-400 font-normal">· {steps.length}단계 · 총 {totalDur}분</span>
              </div>
              <div className="flex items-center gap-2 text-[10.5px] text-ink-500">
                <Icon name="Info" size={11}/> 카드를 드래그하여 순서를 변경할 수 있습니다
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="flex items-center gap-1.5 pb-2 min-w-min">
                {steps.length === 0 && (
                  <div className="text-[12px] text-ink-400 italic">단계가 없습니다 — 맵에 노드를 추가해 보세요.</div>
                )}
                {steps.map((s, i) => {
                  const act = actionMeta(s.actionType);
                  const node = nodes.find(n => n.id === s.nodeId);
                  const isSel = i === selectedStepIdx;
                  const isDragging = dragStepIdx === i;
                  const showDropBefore = dragOverIdx === i && dragStepIdx !== null && dragStepIdx !== i;
                  return (
                    <React.Fragment key={i}>
                      {showDropBefore && (
                        <div className="shrink-0 w-1.5 h-[80px] rounded-full bg-blue-500"/>
                      )}
                      <div
                        draggable
                        onDragStart={(e) => {
                          setDragStepIdx(i);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", String(i));
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragStepIdx === null || dragStepIdx === i) return;
                          setDragOverIdx(i);
                        }}
                        onDragLeave={() => {
                          if (dragOverIdx === i) setDragOverIdx(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const from = dragStepIdx;
                          const to = i;
                          if (from === null || from === to) { setDragStepIdx(null); setDragOverIdx(null); return; }
                          const next = [...steps];
                          const [moved] = next.splice(from, 1);
                          next.splice(to, 0, moved);
                          setSteps(next);
                          setSelectedStepIdx(to);
                          setDragStepIdx(null);
                          setDragOverIdx(null);
                        }}
                        onDragEnd={() => { setDragStepIdx(null); setDragOverIdx(null); }}
                        onClick={() => setSelectedStepIdx(i)}
                        className={
                          "relative shrink-0 w-[156px] rounded-lg border bg-white p-2.5 text-left transition cursor-grab active:cursor-grabbing " +
                          (isSel
                            ? "border-blue-500 ring-2 ring-blue-100"
                            : "border-ink-200 hover:border-ink-300") +
                          (isDragging ? " opacity-40" : "") + " group"
                        }
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Icon name="GripVertical" size={12} className="text-ink-300 shrink-0"/>
                            <span className="text-[10.5px] font-semibold text-ink-400 tnum shrink-0">#{i+1}</span>
                            <span className="text-[11px] font-medium text-ink-900 truncate">{node?.label || s.nodeId}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStep(i);
                            }}
                            className="w-5 h-5 grid place-items-center rounded text-ink-400 hover:bg-rose-50 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition shrink-0"
                            title="단계 삭제"
                          >
                            <Icon name="X" size={12}/>
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded grid place-items-center shrink-0" style={{ background: act.color + "15" }}>
                            <Icon name={act.icon} size={12} style={{ color: act.color }}/>
                          </div>
                          <div className="leading-tight min-w-0">
                            <div className="text-[11.5px] font-medium text-ink-800 truncate">{act.label}</div>
                            <div className="text-[10.5px] text-ink-500 tnum">{s.duration}분</div>
                          </div>
                        </div>
                      </div>
                      {i < steps.length - 1 && (
                        <div className="shrink-0 flex items-center text-ink-300">
                          <Icon name="ChevronRight" size={14}/>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
                {/* Trailing drop zone */}
                {dragStepIdx !== null && dragStepIdx !== steps.length - 1 && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOverIdx(steps.length); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = dragStepIdx;
                      if (from === null) return;
                      const next = [...steps];
                      const [moved] = next.splice(from, 1);
                      next.push(moved);
                      setSteps(next);
                      setSelectedStepIdx(next.length - 1);
                      setDragStepIdx(null);
                      setDragOverIdx(null);
                    }}
                    className={"shrink-0 w-1.5 h-[80px] rounded-full " + (dragOverIdx === steps.length ? "bg-blue-500" : "bg-ink-200")}
                  />
                )}
                <button
                  onClick={(e) => { e.preventDefault(); }}
                  className="shrink-0 w-[110px] h-[80px] rounded-lg border border-dashed border-ink-300 text-ink-400 hover:border-blue-400 hover:text-blue-600 grid place-items-center text-[11.5px]"
                  title="맵에서 노드 클릭하여 추가"
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <Icon name="Plus" size={14}/>
                    <span>맵에서 추가</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Param({ label, value }) {
  return (
    <div className="flex items-center justify-between h-7 px-2 rounded border border-ink-200 bg-white">
      <span className="text-[11px] text-ink-500">{label}</span>
      <span className="text-[11.5px] font-medium text-ink-800">{value}</span>
    </div>
  );
}

function RecipeView() {
  const [mode, setMode] = rcpUseState("list"); // list | builder
  const [editingId, setEditingId] = rcpUseState(null);

  if (mode === "builder") {
    return <RecipeBuilder recipeId={editingId} onBack={() => setMode("list")} />;
  }
  return (
    <RecipeList
      onOpen={(id) => { setEditingId(id); setMode("builder"); }}
      onNew={() => { setEditingId(null); setMode("builder"); }}
    />
  );
}

window.RecipeView = RecipeView;
