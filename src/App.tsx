import Graph from './components/Graph'
import Controls from './components/Controls'
import MemoryPanel from './components/MemoryPanel'
import ReloadPrompt from './components/ReloadPrompt'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Graph />
      <Controls />
      <MemoryPanel />
      <ReloadPrompt />

      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          color: 'rgba(148, 163, 184, 0.7)',
          fontSize: 13,
          letterSpacing: 1,
          pointerEvents: 'none',
        }}
      >
        LALOGI ORB · Family by Blood &amp; by Love
      </div>
    </div>
  )
}
