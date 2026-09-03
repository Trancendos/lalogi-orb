# Bug Analysis & Fixes Report

## Bugs Found in lalogi-orb Project

### 1. **vite.config.ts - Workbox Minification Bug**
**Bug**: The `mode: 'development'` setting doesn't actually disable service worker minification. The correct way to skip terser minification in Workbox is to use `debug: true`.

**Location**: `vite.config.ts` line 40

**Fix**: Change `mode: 'development'` to `debug: true` in the workbox configuration.

```typescript
// BEFORE (BUGGY):
workbox: {
  mode: 'development',  // ❌ This doesn't disable minification
  globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
  ...
}

// AFTER (FIXED):
workbox: {
  debug: true,  // ✅ This properly skips terser minification
  globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
  ...
}
```

---

### 2. **Graph.tsx - Geometry Recreation Bug**
**Bug**: `RingGeometry` and `SphereGeometry` were being created inside the `nodeThreeObject` callback, causing thousands of unnecessary geometry allocations on every render.

**Location**: `Graph.tsx` lines 86, 103, 107

**Fix**: Move geometry creation outside the component to module level for reuse.

```typescript
// BEFORE (BUGGY):
const nodeThreeObject = useCallback((node: GraphNode) => {
  const group = new THREE.Group()
  const ringGeo = new THREE.RingGeometry(6.5, 8.5, 32)  // ❌ Created per node
  const ringMat = new THREE.MeshBasicMaterial({...})
  group.add(new THREE.Mesh(ringGeo, ringMat))
  
  if (node.photo) {
    try {
      const tex = getTexture(node.photo)
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({...}))  // New material each time
      ...
    } catch {
      const geo = new THREE.SphereGeometry(5, 16, 16)  // ❌ Created per node
      group.add(new THREE.Mesh(geo, ...))
    }
  } else {
    const geo = new THREE.SphereGeometry(5, 16, 16)  // ❌ Created per node
    group.add(new THREE.Mesh(geo, ...))
  }
  return group
}, [selectedPersonId])

// AFTER (FIXED):
// Module-level geometries (created once)
const ringGeo = new THREE.RingGeometry(6.5, 8.5, 32)
const sphereGeo = new THREE.SphereGeometry(5, 16, 16)

const nodeThreeObject = useCallback((node: GraphNode) => {
  const group = new THREE.Group()
  // ✅ Reuse geometries
  const ringMat = new THREE.MeshBasicMaterial({...})
  group.add(new THREE.Mesh(ringGeo, ringMat))
  
  if (node.photo) {
    try {
      const tex = getTexture(node.photo)
      // Create material (not geometry) per node
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true })
      const sprite = new THREE.Sprite(spriteMat)
      sprite.scale.set(14, 14, 1)
      group.add(sprite)
    } catch {
      // ✅ Reuse sphereGeo
      group.add(new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: '#0ea5e9' })))
    }
  } else {
    // ✅ Reuse sphereGeo
    group.add(new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({...})))
  }
  return group
}, [selectedPersonId])
```

---

### 3. **Graph.tsx - Bloom Pass Strength Not Updating Bug**
**Bug**: When quality changed, the existing bloom pass was ignored (early return), so bloom strength never updated dynamically.

**Location**: `Graph.tsx` lines 43-46

**Fix**: Update existing bloom pass strength instead of returning early.

```typescript
// BEFORE (BUGGY):
if (existing) return  // ❌ Ignores updates
const strength = ...
const bloomPass = new UnrealBloomPass(...)

// AFTER (FIXED):
const strength = quality === 'low' ? 0.6 : quality === 'medium' ? 1.1 : 1.5

if (existing) {
  existing.strength = strength  // ✅ Update existing pass
  return
}
const bloomPass = new UnrealBloomPass(...)
```

---

### 4. **Graph.tsx - Missing Bloom Pass Cleanup Bug**
**Bug**: No cleanup function to remove bloom pass when component unmounts or quality changes, causing memory leaks.

**Location**: `Graph.tsx` bloom pass effect

**Fix**: Add proper cleanup to remove bloom pass from composer.

```typescript
// AFTER (FIXED):
useEffect(() => {
  const fg = fgRef.current
  if (!fg) return
  const composer = fg.postProcessingComposer?.()
  if (!composer) return
  
  const existing = (composer as any).passes?.find(...)
  
  if (existing) {
    existing.strength = strength
    return
  }
  
  const bloomPass = new UnrealBloomPass(...)
  composer.addPass(bloomPass)
  
  // ✅ Add cleanup function
  return () => {
    const comp = fgRef.current?.postProcessingComposer?.()
    if (comp) {
      const idx = (comp as any).passes?.findIndex(
        (p: any) => p.constructor?.name === 'UnrealBloomPass'
      )
      if (idx !== undefined && idx >= 0) {
        (comp as any).passes.splice(idx, 1)
      }
    }
  }
}, [quality])
```

---

### 5. **Graph.tsx - Window Resize Not Handled for Bloom Pass Bug**
**Bug**: Bloom pass resolution was set only once at creation, causing visual artifacts on window resize.

**Location**: `Graph.tsx` bloom effect

**Fix**: Add window resize listener to update bloom pass resolution.

```typescript
// AFTER (FIXED):
useEffect(() => {
  const handleResize = () => {
    const fg = fgRef.current
    if (!fg) return
    const composer = fg.postProcessingComposer?.()
    if (!composer) return
    const bloomPass = (composer as any).passes?.find(
      (p: any) => p.constructor?.name === 'UnrealBloomPass'
    )
    if (bloomPass) {
      bloomPass.resolution.set(window.innerWidth, window.innerHeight)
    }
  }
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

---

### 6. **Graph.tsx - Texture Cache Memory Leak Bug**
**Bug**: Textures were cached forever with no cleanup, causing memory leaks in long-running sessions.

**Location**: `Graph.tsx` lines 9-19

**Fix**: Add cleanup function to dispose textures on unmount.

```typescript
// AFTER (FIXED):
const textureCache = new Map<string, THREE.Texture>()

// ✅ Add cleanup function
function clearTextureCache() {
  textureCache.forEach((texture) => texture.dispose())
  textureCache.clear()
}

// In component:
useEffect(() => {
  return () => {
    clearTextureCache()  // ✅ Clean up textures on unmount
  }
}, [])
```

---

### 7. **Graph.tsx - graphData Dependency Array Bug**
**Bug**: Dependency array only had `graphData.links.length` but not `graphData.nodes.length`, causing simulation to not reheat properly when nodes change.

**Location**: `Graph.tsx` line 76

**Fix**: Add both node and link lengths to dependency array.

```typescript
// BEFORE (BUGGY):
useEffect(() => {
  ...
  fg.d3ReheatSimulation?.()
}, [graphData.links.length, quality])  // ❌ Missing nodes.length

// AFTER (FIXED):
useEffect(() => {
  ...
  fg.d3ReheatSimulation?.()
}, [graphData.nodes.length, graphData.links.length, quality])  // ✅ Both included
```

---

### 8. **Graph.tsx - graphData Recalculation Bug**
**Bug**: `getGraphData()` was called on every render, creating new array/object references unnecessarily.

**Location**: `Graph.tsx` line 35

**Fix**: Use `useMemo` and proper Zustand subscription to memoize graph data.

```typescript
// BEFORE (BUGGY):
const graphData = getGraphData()  // ❌ Called every render

// AFTER (FIXED):
const data = useOrbStore((state) => state.data)
const viewMode = useOrbStore((state) => state.viewMode)
const graphData = useMemo(() => getGraphData(), [data, viewMode, getGraphData])
```

---

### 9. **Graph.tsx - pixelRatio Recalculation Bug**
**Bug**: `pixelRatio` was calculated as a plain variable, recalculated on every render unnecessarily.

**Location**: `Graph.tsx` lines 130-135

**Fix**: Wrap in `useMemo` for proper memoization.

```typescript
// BEFORE (BUGGY):
const pixelRatio =
  quality === 'low'
    ? Math.min(window.devicePixelRatio || 1, 1.25)
    : ...

// AFTER (FIXED):
const pixelRatio = useMemo(() =>
  quality === 'low'
    ? Math.min(window.devicePixelRatio || 1, 1.25)
    : quality === 'medium'
      ? Math.min(window.devicePixelRatio || 1, 1.75)
      : Math.min(window.devicePixelRatio || 1, 2),
  [quality]
)
```

---

## Summary of Fixes

| Bug # | Component | Issue | Impact | Fix |
|-------|-----------|-------|--------|-----|
| 1 | vite.config.ts | `mode: 'development'` doesn't skip minification | Service worker minification failure on Termux | Use `debug: true` |
| 2 | Graph.tsx | Geometry created per node | Massive memory allocations, poor performance | Move to module level |
| 3 | Graph.tsx | Bloom strength not updating | Visual quality doesn't adapt | Update existing pass |
| 4 | Graph.tsx | No bloom cleanup | Memory leaks | Add cleanup function |
| 5 | Graph.tsx | No resize handling | Visual artifacts on resize | Add resize listener |
| 6 | Graph.tsx | No texture cleanup | Memory leaks | Dispose textures on unmount |
| 7 | Graph.tsx | Missing nodes.length dep | Simulation issues | Add to dependency array |
| 8 | Graph.tsx | getGraphData() every render | Unnecessary recalculations | Use useMemo |
| 9 | Graph.tsx | pixelRatio recalculated | Unnecessary work | Use useMemo |
