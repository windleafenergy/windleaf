import * as THREE from 'three'


/** Converts geographic coordinates to a point on a sphere of the given radius. */
export function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (lat * Math.PI) / 180
  const theta = (lon * Math.PI) / 180
  return new THREE.Vector3(
    radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.sin(phi),
    radius * Math.cos(phi) * Math.cos(theta),
  )
}

/**
 * Globe rotation (in radians) that brings the given coordinates to face the
 * camera. Pairs with a group whose Euler order is the default `XYZ`.
 */
export function rotationForLatLon(lat: number, lon: number): { x: number; y: number } {
  return { x: (lat * Math.PI) / 180, y: -(lon * Math.PI) / 180 }
}

/**
 * Points along a great-circle arc between two surface positions, lifted into a
 * smooth parabola whose height scales with the distance travelled.
 */
export function greatCircleArc(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  segments = 72,
): THREE.Vector3[] {
  const a = from.clone().normalize()
  const b = to.clone().normalize()
  const omega = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1))
  const sinOmega = Math.sin(omega)
  // Kept shallow so the longest arcs stay inside the camera frustum. The camera
  // frames FIT_RADIUS = 116 world units against a sphere radius of 100 (see
  // `frameCamera` in globe-scene.ts), so the longest arc — omega = PI — has to
  // stay under 1.16x the radius. Raise these and raise FIT_RADIUS with them.
  const lift = radius * (0.05 + 0.085 * (omega / Math.PI))

  const points: THREE.Vector3[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments

    let point: THREE.Vector3
    if (sinOmega < 1e-6) {
      point = a.clone().lerp(b, t).normalize()
    } else {
      point = a
        .clone()
        .multiplyScalar(Math.sin((1 - t) * omega) / sinOmega)
        .addScaledVector(b, Math.sin(t * omega) / sinOmega)
        .normalize()
    }

    points.push(point.multiplyScalar(radius + lift * Math.sin(Math.PI * t)))
  }

  return points
}

/**
 * Soft radial sprite used to bloom the location beacons without post-processing.
 * Falls off to transparent black, so it is meant for additive blending.
 */
export function createGlowTexture(hex: string): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // The canvas is sRGB, so read the hex literally rather than letting three's
  // colour management convert it into the linear working space first.
  const { r, g, b } = new THREE.Color().setStyle(hex, THREE.NoColorSpace)
  const rgb = `${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}`

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, `rgba(${rgb}, 1)`)
  gradient.addColorStop(0.18, `rgba(${rgb}, 0.65)`)
  gradient.addColorStop(0.45, `rgba(${rgb}, 0.18)`)
  gradient.addColorStop(1, `rgba(${rgb}, 0)`)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * Three-blade wind rotor, drawn once into a canvas and used as a sprite.
 *
 * A sprite rather than a mesh on purpose: sprites always face the camera, so
 * the rotor reads as a disc wherever it sits on the globe. A plane laid flat
 * on the surface would foreshorten towards the limb and collapse to a line
 * edge-on, which is exactly where several of these markers live.
 *
 * The blade shape is a wind-turbine blade, not a fan wing, and the difference
 * is the whole point: a fan blade is short, broad and widest at the tip, which
 * is what makes those stock "fan" icons read as a desk fan or a propeller. A
 * turbine blade is long and slender — narrow at the root, widest around a
 * third of the way out, then tapering to a fine tip — with a rotor disc mostly
 * made of air rather than blade. Getting that proportion right is what makes
 * the marker read as wind energy at 20 pixels across.
 */
export function createRotorTexture(hex: string): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const { r, g, b } = new THREE.Color().setStyle(hex, THREE.NoColorSpace)
  const fill = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`

  const S = size
  const tip = S * 0.47
  ctx.fillStyle = fill
  ctx.translate(S / 2, S / 2)

  for (let i = 0; i < 3; i++) {
    ctx.save()
    ctx.rotate((i * Math.PI * 2) / 3)
    ctx.beginPath()
    // Leading edge: out of the hub, bellying to its widest around a third of
    // the span, then drawing in to a fine tip.
    ctx.moveTo(-S * 0.035, -S * 0.075)
    ctx.bezierCurveTo(-S * 0.062, -S * 0.19, -S * 0.032, -S * 0.36, -S * 0.011, -tip)
    // Rounded tip rather than a point — a sharp one disappears when the sprite
    // is drawn small.
    ctx.quadraticCurveTo(0, -tip - S * 0.016, S * 0.011, -tip)
    // Trailing edge back to the root, straighter than the leading edge.
    ctx.bezierCurveTo(S * 0.028, -S * 0.34, S * 0.046, -S * 0.17, S * 0.04, -S * 0.075)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // Hub last, so the blade roots vanish beneath it.
  ctx.beginPath()
  ctx.arc(0, 0, S * 0.085, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
