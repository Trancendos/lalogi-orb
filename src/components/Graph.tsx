import { useRef, useEffect, useCallback, useState } from 'react'
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import * as THREE from 'three'
import { useOrbStore } from '../hooks/useOrbStore'
import { getLinkColor } from '../data/colors'
import type { GraphNode, GraphLink } from '../types/orb'
const textureCache = new Map<string, THREE.Texture>()

const QUALITY = {
  low:    { bloom: 0.6, charge: -70,  maxDist: 280, particles: 1, warmup: 40, cooldown: 60, pixRatio: 1.25, antialias: false, power: 'low-power' as GPUPowerPreference },
  medium: { bloom: 1.1, charge: -90,  maxDist: 400, particles: 3, warmup: 80, cooldown: 120, pixRatio: 1.75, antialias: true,  power: 'high-performance' as GPUPowerPreference },
  high:   { bloom: 1.5, charge: -110, maxDist: 400, particles: 3, warmup: 80, cooldown: 120, pixRatio: 2,    antialias: true,  power: 'high-performance' as GPUPowerPreference },
} as const
const textureLoader = new THREE.TextureLoader()
const textureCache = new Map<string, THREE.Texture>()
const ringGeo = new THREE.RingGeometry(6.5, 8.5, 32)
const sphereGeo = new THREE.SphereGeometry(5, 16, 16)

function getTexture(url: string): THREE.Texture {
  if (textureCache.has(url)) return textureCache.get(url)!
  const tex = textureLoader.load(url)
  tex.colorSpace = THREE.SRGBColorSpace
  textureCache.set(url, tex)
  return tex
}

function detectQuality(): 'low' | 'medium' | 'high' {
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
  const { getGraphData, selectPerson, selectedPersonId } = useOrbStore()
  const graphData = getGraphData()
  const [quality] = useState(detectQuality)

  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
    const composer = fg.postProcessingComposer?.()
    if (!composer) return
    const existing = (composer as any).passes?.find(
      (p: any) => p.constructor?.name === 'UnrealBloomPass'
    )
    if (existing) return
    const cfg = QUALITY[quality]
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), cfg.bloom, 0.55, 0.15)
    composer.addPass(bloomPass)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      strength,
      0.55,
      0.15
    )
    composer.addPass(bloomPass)
  }, [quality])

  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
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
    const cfg = QUALITY[quality]
    if (chargeForce) chargeForce.strength(cfg.charge).distanceMax(cfg.maxDist)
      chargeForce.strength(strength).distanceMax(quality === 'low' ? 280 : 400)
    }
    const centerForce = fg.d3Force('center') as any
    if (centerForce) centerForce.strength(0.05)
    fg.d3ReheatSimulation?.()
  }, [graphData.links.length, quality])

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
          group.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#0ea5e9' })))
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
  const linkWidth = useCallback((link: GraphLink) => (link.type === 'blood' ? 1.4 : 1.8), [])
  const linkCurvature = useCallback((link: GraphLink) => (link.type === 'blood' ? 0.05 : 0.25), [])
  const linkDirectionalParticles = useCallback(
    (link: GraphLink) => (link.type === 'blood' ? 0 : quality === 'low' ? 1 : 3),
    [quality]
  )

  const pixelRatio =
    quality === 'low'
      ? Math.min(window.devicePixelRatio || 1, 1.25)
      : quality === 'medium'
        ? Math.min(window.devicePixelRatio || 1, 1.75)
        : Math.min(window.devicePixelRatio || 1, 2)

  return (
    <ForceGraph3D
      ref={fgRef}
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
      warmupTicks={quality === 'low' ? 40 : 80}
      cooldownTicks={quality === 'low' ? 60 : 120}
      rendererConfig={{
        antialias: quality !== 'low',
        alpha: false,
        powerPreference: quality === 'low' ? 'low-power' : 'high-performance',
      }}
      // @ts-ignore
      pixelRatio={pixelRatio}
    />
  )
}
