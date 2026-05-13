// Root app
const { useState: appUseState, useEffect: appUseEffect } = React;

function App() {
  const [active, setActive] = appUseState("schedule");
  const [cmdOpen, setCmdOpen] = appUseState(false);
  const [focusRecipeId, setFocusRecipeId] = appUseState(null);

  // Ctrl/Cmd + K for command palette
  appUseEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen(o => !o);
      } else if (e.key === "Escape") {
        setCmdOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleJump({ view, payload }) {
    if (view === "schedule" && payload?.focusRecipeId) {
      setFocusRecipeId(payload.focusRecipeId);
      // auto-clear highlight after a few seconds
      setTimeout(() => setFocusRecipeId(null), 4500);
    }
    setActive(view);
  }

  const activeMeta = window.NAV.find(n => n.id === active);

  return (
    <div className="h-screen w-screen flex bg-ink-50">
      <Sidebar active={active} onChange={setActive}/>
      <div className="flex-1 min-w-0 flex flex-col">
        <Header activeLabel={activeMeta?.label || ""} onOpenCmd={() => setCmdOpen(true)}/>
        <main className="flex-1 min-h-0">
          {active === "home"      && <MonitoringHome/>}
          {active === "analytics" && <AnalyticsView/>}
          {active === "basis"     && <BasisView/>}
          {active === "recipe"    && <RecipeView/>}
          {active === "schedule"  && <SchedulerView initialFocusRecipeId={focusRecipeId}/>}
          {active === "logs"      && <LogsView/>}
        </main>
      </div>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onJump={handleJump}/>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
