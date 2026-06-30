export default function App() {
  return (
    <div className="flex h-full flex-col bg-surface text-text-primary">
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-48 bg-panel border-r border-divider p-2">Sidebar</aside>
        <main className="flex-1 bg-surface">Canvas</main>
        <aside className="w-64 bg-panel border-l border-divider p-2">Properties</aside>
      </div>
    </div>
  )
}
