import { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'

const vertex = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

// The wave and Bayer thresholding follow React Bits' Dither background shader,
// combined into one pass for the OGL renderer already used in this project.
const fragment = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uDpr;
uniform float uPointerActive;

vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }
float cnoise(vec2 p) {
  vec4 pi = floor(p.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 pf = fract(p.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  pi = mod289(pi);
  vec4 ix = pi.xzxz;
  vec4 iy = pi.yyww;
  vec4 fx = pf.xzxz;
  vec4 fy = pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx -= tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 f = fade(pf.xy);
  vec2 nx = mix(vec2(n00, n01), vec2(n10, n11), f.x);
  return 2.3 * mix(nx.x, nx.y, f.y);
}
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 1.0;
  for (int i = 0; i < 4; i++) {
    value += amplitude * abs(cnoise(p));
    p *= 3.0;
    amplitude *= 0.3;
  }
  return value;
}
float bayer8(int x, int y) {
  int index = y * 8 + x;
  float values[64] = float[64](
    0.,48.,12.,60.,3.,51.,15.,63., 32.,16.,44.,28.,35.,19.,47.,31.,
    8.,56.,4.,52.,11.,59.,7.,55., 40.,24.,36.,20.,43.,27.,39.,23.,
    2.,50.,14.,62.,1.,49.,13.,61., 34.,18.,46.,30.,33.,17.,45.,29.,
    10.,58.,6.,54.,9.,57.,5.,53., 42.,26.,38.,22.,41.,25.,37.,21.
  );
  return values[index] / 64.0;
}
void main() {
  vec2 resolution = uResolution;
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 point = uv - 0.5;
  point.x *= resolution.x / resolution.y;
  float time = uTime * 0.05;
  float wave = fbm(point + fbm(point - time));
  vec2 pointer = (uPointer / resolution - 0.5) * vec2(1.0, -1.0);
  pointer.x *= resolution.x / resolution.y;
  float interaction = (1.0 - smoothstep(0.0, 1.0, distance(point, pointer))) * uPointerActive;
  wave = clamp(wave - interaction * 0.2, 0.0, 1.0);

  vec3 color = mix(vec3(0.071, 0.071, 0.078), vec3(0.686, 0.682, 0.635), wave);
  vec2 pixel = floor(gl_FragCoord.xy / (3.0 * uDpr));
  float threshold = bayer8(int(mod(pixel.x, 8.0)), int(mod(pixel.y, 8.0))) - 0.25;
  float levels = 4.0;
  color += threshold / (levels - 1.0);
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = clamp(color - mix(0.2, 0.0, smoothstep(0.45, 0.8, luminance)), 0.0, 1.0);
  color = floor(color * (levels - 1.0) + 0.5) / (levels - 1.0);
  fragColor = vec4(color, 1.0);
}
`

export default function Dither() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new Renderer({ alpha: false, antialias: false, dpr: Math.min(window.devicePixelRatio || 1, 1.5) })
    const { gl } = renderer
    if (!renderer.isWebgl2) return

    const canvas = gl.canvas
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    container.appendChild(canvas)

    const uniforms = {
      uResolution: { value: [1, 1] },
      uPointer: { value: [0, 0] },
      uTime: { value: 0 },
      uDpr: { value: renderer.dpr },
      uPointerActive: { value: 0 }
    }
    const scene = new Mesh(gl, {
      geometry: new Triangle(gl),
      program: new Program(gl, { vertex, fragment, uniforms, depthTest: false, depthWrite: false })
    })
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let startTime = 0
    let visible = true

    const render = (now: number) => {
      if (!startTime) startTime = now
      uniforms.uTime.value = reducedMotion.matches ? 0 : (now - startTime) / 1000
      renderer.render({ scene })
    }
    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height)
      uniforms.uResolution.value = [Math.floor(width * renderer.dpr), Math.floor(height * renderer.dpr)]
      render(performance.now())
    }
    const draw = (now = performance.now()) => {
      render(now)
      if (!reducedMotion.matches && visible) frame = requestAnimationFrame(draw)
    }
    const pointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      uniforms.uPointer.value = [(event.clientX - bounds.left) * renderer.dpr, (bounds.bottom - event.clientY) * renderer.dpr]
      uniforms.uPointerActive.value = 1
    }
    const pointerLeave = () => { uniforms.uPointerActive.value = 0 }
    const visibilityChange = () => {
      visible = document.visibilityState === 'visible'
      cancelAnimationFrame(frame)
      if (visible && !reducedMotion.matches) frame = requestAnimationFrame(draw)
      else if (visible) render(performance.now())
    }
    const motionChange = () => {
      cancelAnimationFrame(frame)
      if (visible && !reducedMotion.matches) frame = requestAnimationFrame(draw)
      else if (visible) render(performance.now())
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    canvas.addEventListener('pointermove', pointerMove, { passive: true })
    canvas.addEventListener('pointerleave', pointerLeave, { passive: true })
    document.addEventListener('visibilitychange', visibilityChange)
    reducedMotion.addEventListener('change', motionChange)
    resize()
    if (!reducedMotion.matches) frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.removeEventListener('pointermove', pointerMove)
      canvas.removeEventListener('pointerleave', pointerLeave)
      document.removeEventListener('visibilitychange', visibilityChange)
      reducedMotion.removeEventListener('change', motionChange)
      renderer.gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
    }
  }, [])

  return <div className="hero-dither" ref={containerRef} aria-hidden="true" />
}
