import { useRef, useEffect, useCallback, useState } from 'react'
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import * as THREE from 'three'
import { useOrbStore } from '../hooks/useOrbStore'
import { getLinkColor } from '../data/colors'
import type { GraphNode, GraphLink } from '../types/orb'

const textureLoader = new THREE.TextureLoader()
const textureCache = new Map<string, THREE.Texture>()

const QUALITY = {
  low: {
    bloom: 0.55,
    bloomScale: 0.5,
    charge: -70,
    maxDist: 280,
    particles: 1,
    warmup: 40,
    cooldown: 60,
    pixRatio: 1.25,
    antialias: false,
    power: 'low-power' as const,
  },
  medium: {
    bloom: 1.0,
    bloomScale: 0.5,
    charge: -90,
    maxDist: 400,
    particles: 2,
    warmup: 80,
    cooldown: 120,
    pixRatio: 1.75,
    antialias: true,
    power: 'high-performance' as const,
  },
  high: {
    bloom: 1.5,
    bloomScale: 1,
    charge: -110,
    maxDist: 400,
    particles: 3,
    warmup: 80,
    cooldown: 120,
    pixRatio: 2,
    antialias: true,
    power: 'high-performance' as const,
  },
} as const

function getTexture(url: string): THREE.Texture {
  if (textureCache.has(url)) return textureCache.get(url)!
  const tex = textureLoader.load(url)
  tex.colorSpace = THREE.SRGBColorSpace
  textureCache.set(url, tex)
  return tex
}

function detectQuality(): keyof typeof QUALITY {
  if (typeof navigator === 'undefined') return 'medium'
  const mem = (navigator as any).deviceMemory ?? 4
  const cores = navigator.hardwareConcurrency ?? 4
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  if (isMobile && (mem <= 4 || cores <= 4)) return 'low'
  if (isMobile || mem <= 6) return 'medium'
  return 'high'
}

export default function Graph() {
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>()
  const containerRef = useRef<HTMLDivElement>(null)
  const { getGraphData, selectPerson, selectedPersonId, resetToSample } = useOrbStore()
  const graphData = getGraphData()
  const [quality] = useState(detectQuality)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const cfg = QUALITY[quality]
  const isEmpty = graphData.nodes.length === 0

  // Keep canvas sized to the real container (fixes blank mobile/desktop canvas)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      setSize({ w: Math.max(1, Math.floor(r.width)), h: Math.max(1, Math.floor(r.height)) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    const fg = fgRef.current
    if (!fg || isEmpty) return
    const composer = fg.postProcessingComposer?.()
    if (!composer) return
    const existing = (composer as any).passes?.find(
      (p: any) => p.constructor?.name === 'UnrealBloomPass'
    )
    if (existing) return

    const w = Math.max(1, size.w * cfg.bloomScale)
    const h = Math.max(1, size.h * cfg.bloomScale)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      cfg.bloom,
      0.55,
      0.15
    )
    composer.addPass(bloomPass)
  }, [cfg.bloom, cfg.bloomScale, size.w, size.h, isEmpty])

  useEffect(() => {
    const fg = fgRef.current
    if (!fg || isEmpty) return

    const linkForce = fg.d3Force('link') as any
    if (linkForce) {
      linkForce
        .distance((link: GraphLink) => (link.type === 'blood' ? 55 : 85))
        .strength((link: GraphLink) =>
          link.type === 'blood' ? 0.8 : 0.28 * (link.strength ?? 0.85)
        )
    }

    const chargeForce = fg.d3Force('charge') as any
    if (chargeForce) {
      chargeForce.strength(cfg.charge).distanceMax(cfg.maxDist)
    }

    const centerForce = fg.d3Force('center') as any
    if (centerForce) centerForce.strength(0.05)

    fg.d3ReheatSimulation?.()
  }, [graphData.links.length, cfg.charge, cfg.maxDist, isEmpty])

  const handleNodeClick = useCallback(
    (node: GraphNode) => selectPerson(node.id),
    [selectPerson]
  )

  const nodeThreeObject = useCallback(
    (node: GraphNode) => {
      const group = new THREE.Group()
      const ringGeo = new THREE.RingGeometry(6.5, 8.5, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: selectedPersonId === node.id ? '#7dd3fc' : '#334155',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      })
      group.add(new THREE.Mesh(ringGeo, ringMat))

      if (node.photo) {
        try {
          const tex = getTexture(node.photo)
          const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: tex, transparent: true })
          )
          sprite.scale.set(14, 14, 1)
          group.add(sprite)
        } catch {
          const geo = new THREE.SphereGeometry(5, 16, 16)
          group.add(
            new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#0ea5e9' }))
          )
        }
      } else {
        const geo = new THREE.SphereGeometry(5, 16, 16)
        group.add(
          new THREE.Mesh(
            geo,
            new THREE.MeshBasicMaterial({
              color: selectedPersonId === node.id ? '#7dd3fc' : '#0ea5e9',
            })
          )
        )
      }
      return group
    },
    [selectedPersonId]
  )

  const linkColor = useCallback((link: GraphLink) => getLinkColor(link), [])
  const linkWidth = useCallback(
    (link: GraphLink) => (link.type === 'blood' ? 1.4 : 1.8),
    []
  )
  const linkCurvature = useCallback(
    (link: GraphLink) => (link.type === 'blood' ? 0.05 : 0.25),
    []
  )
  const linkDirectionalParticles = useCallback(
    (link: GraphLink) => (link.type === 'blood' ? 0 : cfg.particles),
    [cfg.particles]
  )

  const pixelRatio = Math.min(
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    cfg.pixRatio
  )

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        background: '#030308',
      }}
    >
      {isEmpty ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
            color: '#e2e8f0',
            zIndex: 5,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 35% 30%, #7dd3fc, #0ea5e9 40%, #1e1b4b 70%, #030308)',
              boxShadow: '0 0 48px rgba(14, 165, 233, 0.45)',
              marginBottom: 24,
            }}
          />
          <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 600 }}>
            Your constellation is empty
          </h2>
          <p style={{ margin: '0 0 20px', color: '#94a3b8', maxWidth: 320, lineHeight: 1.5 }}>
            Load the sample demo, import a GEDCOM or backup, or start adding people and bonds.
          </p>
          <button
            onClick={resetToSample}
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '12px 20px',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Load sample demo
          </button>
        </div>
      ) : size.w > 0 && size.h > 0 ? (
        <ForceGraph3D
          ref={fgRef}
          width={size.w}
          height={size.h}
          graphData={graphData}
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}
          linkColor={linkColor}
          linkWidth={linkWidth}
          linkCurvature={linkCurvature}
          linkDirectionalParticles={linkDirectionalParticles}
          linkDirectionalParticleWidth={1.2}
          linkDirectionalParticleSpeed={0.006}
          backgroundColor="#030308"
          showNavInfo={false}
          enableNodeDrag={true}
          onNodeClick={handleNodeClick}
          d3AlphaDecay={0.022}
          d3VelocityDecay={0.32}
          warmupTicks={cfg.warmup}
          cooldownTicks={cfg.cooldown}
          rendererConfig={{
            antialias: cfg.antialias,
            alpha: false,
            powerPreference: cfg.power,
          }}
          // @ts-expect-error pixelRatio supported by underlying renderer
          pixelRatio={pixelRatio}
        />
      ) : null}
    </div>
  )
}
