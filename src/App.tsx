import Graph from './components/Graph'
import Controls from './components/Controls'
import MemoryPanel from './components/MemoryPanel'
import ReloadPrompt from './components/ReloadPrompt'

export default function App() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100dvh',
        position: 'relative',
        overflow: 'hidden',
        background: '#030308',
      }}
    >
      <Graph />
      <Controls />
      <MemoryPanel />
      <ReloadPrompt />

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          color: 'rgba(148, 163, 184, 0.65)',
          fontSize: 12,
          letterSpacing: 1,
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        LALOGI ORB · Family by Blood &amp; by Love
      </div>
    </div>
  )
}
