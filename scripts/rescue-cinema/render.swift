// Offline renderer for the puppet theatre. swiftc -O render.swift -o render
// render <animal> <variation> <background.jpg> <film.mp4> <start.jpg> <end.jpg> <registered-poses>
// Props, camera and staging are native 3-D; the animal uses registered illustrated poses.
import AppKit
import Foundation
import Metal
import SceneKit
import simd

let args = CommandLine.arguments
guard args.count == 8, let metal = MTLCreateSystemDefaultDevice() else {
  fatalError("A Metal-capable renderer and seven arguments are required")
}
let species = args[1]
let trick = args[2]
let winter = ["cub", "wolf", "penguin"].contains(species)
let bird = ["penguin", "owl"].contains(species)
let canine = ["wolf", "cub", "fox"].contains(species)
let fourPaws = canine || ["cat", "hedgehog", "mouse", "hare"].contains(species)
typealias V = SIMD3<Float>
let pi = Double.pi
func ease(_ t: Double, _ start: Double, _ end: Double) -> Double {
  let u = max(0, min(1, (t - start) / (end - start)))
  return u * u * (3 - 2 * u)
}
func pulse(_ t: Double, _ start: Double, _ end: Double) -> Double { sin(pi * ease(t, start, end)) }
func color(_ rgb: Int, _ a: CGFloat = 1) -> NSColor {
  NSColor(
    srgbRed: CGFloat((rgb >> 16) & 255) / 255, green: CGFloat((rgb >> 8) & 255) / 255,
    blue: CGFloat(rgb & 255) / 255, alpha: a)
}
func paint(_ rgb: Int, _ gloss: CGFloat = 0.06) -> SCNMaterial {
  let m = SCNMaterial()
  m.diffuse.contents = color(rgb)
  m.lightingModel = .physicallyBased
  m.roughness.contents = gloss > 0.3 ? 0.2 : 0.78
  m.metalness.contents = 0.0
  return m
}
func root(_ parent: SCNNode, _ x: Double = 0, _ y: Double = 0, _ z: Double = 0) -> SCNNode {
  let n = SCNNode()
  n.position = SCNVector3(x, y, z)
  parent.addChildNode(n)
  return n
}
func mesh(
  _ parent: SCNNode, _ g: SCNGeometry, _ m: SCNMaterial, _ x: Double, _ y: Double, _ z: Double
) -> SCNNode {
  g.materials = [m]
  let n = SCNNode(geometry: g)
  parent.addChildNode(n)
  n.position = SCNVector3(x, y, z)
  return n
}
func oval(
  _ p: SCNNode, _ mat: SCNMaterial, _ x: Double, _ y: Double, _ z: Double, _ a: Double, _ b: Double,
  _ c: Double
) -> SCNNode {
  let o = SCNSphere(radius: 1)
  o.segmentCount = 42
  let n = mesh(p, o, mat, x, y, z)
  n.scale = SCNVector3(a, b, c)
  return n
}
@discardableResult func stroke(_ p: SCNNode, _ a: V, _ b: V, _ radius: Double, _ mat: SCNMaterial)
  -> SCNNode
{
  let diff = b - a
  let d = simd_length(diff)
  let mid = (a + b) / 2
  let g = SCNCapsule(capRadius: radius, height: Double(d) + radius * 2)
  g.radialSegmentCount = 12
  let n = mesh(p, g, mat, Double(mid.x), Double(mid.y), Double(mid.z))
  n.simdOrientation = simd_quatf(from: V(0, 1, 0), to: simd_normalize(diff))
  return n
}
let scene = SCNScene()
let world = SCNNode()
scene.rootNode.addChildNode(world)
scene.background.contents = NSImage(contentsOfFile: args[3])!
let camera = root(world, 0, 2.32, 8)
camera.camera = SCNCamera()
camera.camera!.usesOrthographicProjection = true
camera.camera!.orthographicScale = 1.65
camera.camera!.zNear = 0.05
camera.camera!.zFar = 40
camera.look(at: SCNVector3(0, 1.38, 0))
func light(
  _ type: SCNLight.LightType, _ rgb: Int, _ amount: CGFloat, _ x: Double, _ y: Double, _ z: Double
) {
  let n = root(world, x, y, z)
  let l = SCNLight()
  l.type = type
  l.color = color(rgb)
  l.intensity = amount
  n.light = l
  if type != .ambient { n.look(at: SCNVector3(0, 0.8, 0)) }
}
light(.ambient, 0xd8e8f7, 335, 0, 0, 0)
light(.directional, 0xffddb4, 1270, -3, 5, 2.5)
light(.directional, 0xd2e4ff, 270, 3, 1, 3)
light(.directional, 0xffedc5, 1600, 3, 4, -4)
let mustard = paint(0xf3b74d)
let red = paint(0xcd5951)
let blue = paint(0x4999aa)
let snow = paint(0xf5faff)
let ground = root(world)
let actor = root(world)
let shadowImage = NSImage(size: NSSize(width: 192, height: 192), flipped: false) { rect in
  for j in (1...70).reversed() {
    let q = CGFloat(j) / 70
    let inset = 96 * (1 - q)
    NSColor(srgbRed: 0.11, green: 0.10, blue: 0.16, alpha: (1.0 - q) * 0.044).setFill()
    NSBezierPath(ovalIn: rect.insetBy(dx: inset, dy: inset)).fill()
  }
  return true
}
let sm = SCNMaterial()
sm.diffuse.contents = shadowImage
sm.lightingModel = .constant
sm.writesToDepthBuffer = false
let shadow = mesh(ground, SCNPlane(width: 2.18, height: 1.4), sm, 0, 0.02, 0)
shadow.eulerAngles.x = -1.10
// Transparent, optically registered poses carry the fine fur, expression and changing silhouette.
// The same stage retains true 3-D props, contact shadows, perspective, timing and collisions.
let illustrated = root(actor)
let celMat = SCNMaterial()
celMat.lightingModel = .constant
celMat.isDoubleSided = true
celMat.writesToDepthBuffer = false
celMat.readsFromDepthBuffer = true
celMat.blendMode = .alpha
let cel = mesh(illustrated, SCNPlane(width: 1, height: 1), celMat, 0, 0, 0)
let poseFolder = URL(fileURLWithPath: args[7])
let paintedPoses: [NSImage] = (0...42).map { index in
  let path = poseFolder.appendingPathComponent(String(format: "%02d.png", index))
  guard let pose = NSImage(contentsOf: path) else { fatalError("Missing pose at \(path.path)") }
  return pose
}
let artSize: Double =
  species == "mouse"
  ? 1.97
  : (species == "hare" || bird) ? 2.28 : (species == "wolf" || species == "cub") ? 2.56 : 2.48
cel.scale = SCNVector3(artSize, artSize, 1)
cel.position = SCNVector3(0, artSize * 0.48, 0.00)

var celIndex = -1
let propRoot = root(world)
let obstacle = root(propRoot)
let accessory = root(propRoot)
let piece = root(propRoot)
let gold = paint(0xd79a48)
let wood = paint(0x985f41)
let mint = paint(0x62ad83)
let ice = paint(0xaeeafa, 0.6)
ice.lightingModel = .constant
ice.diffuse.contents = color(0x84d5f0, 0.34)
ice.transparency = 0.88
ice.isDoubleSided = false
ice.writesToDepthBuffer = false
let wave = paint(0x739cc3, 0.45)
wave.transparency = 0.62
func box(
  _ p: SCNNode, _ w: Double, _ h: Double, _ d: Double, _ r: Double, _ m: SCNMaterial, _ x: Double,
  _ y: Double, _ z: Double
) -> SCNNode { mesh(p, SCNBox(width: w, height: h, length: d, chamferRadius: r), m, x, y, z) }
@discardableResult func ring(
  _ p: SCNNode, _ rr: Double, _ thick: Double, _ mat: SCNMaterial, _ x: Double, _ y: Double,
  _ z: Double
) -> SCNNode { mesh(p, SCNTorus(ringRadius: rr, pipeRadius: thick), mat, x, y, z) }
let chosenTrick = trick == "A" ? 0 : trick == "B" ? 1 : 2
let iceSpecies = species == "wolf"
var litter: [SCNNode] = []
if iceSpecies {
  _ = box(obstacle, 1.98, 2.60, 1.42, 0.14, ice, 0, 1.30, 0.1)
  obstacle.eulerAngles.y = 0.135
  let glint = paint(0xe4ffff)
  glint.transparency = 0.67
  for side: Float in [-1, 1] {
    stroke(obstacle, V(side * 0.95, 0.10, 0.79), V(side * 0.95, 2.47, 0.79), 0.014, glint)
    stroke(
      obstacle, V(-0.90, side < 0 ? 0.085 : 2.52, 0.79), V(0.90, side < 0 ? 0.085 : 2.52, 0.79),
      0.015, glint)
  }
  for i in 0..<3 {
    let x = Float(i) * 0.30 - 0.40
    stroke(obstacle, V(x, 2.20, 0.80), V(x - 0.19, 1.93, 0.80), 0.018, glint)
  }
  _ = oval(accessory, wave, 0, 0.02, 0.08, 1.05, 0.025, 0.40)
} else if species == "cub" {
  for i in 0..<12 {
    let a = Double(i) * 2.4
    _ = oval(
      obstacle, snow, cos(a) * 0.62, 0.34 + abs(sin(a)) * 0.22, sin(a) * 0.19, 0.58, 0.59, 0.38)
  }
  _ = oval(piece, snow, 0, 0, 0, 0.42, 0.22, 0.34)
  _ = oval(piece, snow, 0.08, 0.16, -0.04, 0.30, 0.17, 0.26)
} else if species == "fox" {
  for i in 0..<3 {
    let rope = ring(obstacle, 0.535, 0.043, red, 0, 0.74 + Double(i) * 0.19, 0)
    rope.scale.z = 0.86
    rope.eulerAngles.z = 0.13 - Double(i) * 0.09
  }
  for side in [-1.0, 1.0] {
    let loop = ring(accessory, 0.17, 0.041, red, side * 0.15, 0, 0)
    loop.eulerAngles.x = .pi / 2
    loop.scale.x = 1.17
  }
  _ = oval(accessory, red, 0, 0, 0, 0.083, 0.09, 0.08)
} else if species == "bear" {
  _ = oval(obstacle, paint(0xca854b), 0, 0.31, 0.18, 0.83, 0.57, 0.52)
  let rim = ring(obstacle, 0.66, 0.057, gold, 0, 0.61, 0.18)
  rim.scale.z = 0.72
  for i in 0..<5 {
    _ = oval(
      obstacle, gold, Double(i - 2) * 0.20, 0.51 - Double(i % 2) * 0.045, 0.55, 0.073, 0.17, 0.075)
  }
  _ = oval(piece, gold, 0, 0, 0, 0.079, 0.11, 0.078)
} else if species == "hedgehog" {
  for i in 0..<11 {
    let v = Double(i) * 2.4
    let leaf = oval(
      obstacle, paint([0xd97842, 0xce9b42, 0xbb5b31][i % 3]), 0, 0, 0, 0.23, 0.065, 0.105)
    leaf.position = SCNVector3(cos(v) * 0.54, 0.34 + Double(i % 4) * 0.20, 0.44 + sin(v) * 0.09)
    leaf.eulerAngles.z = sin(v) * 0.55
    leaf.eulerAngles.x = 0.85 + Double(i % 3) * 0.12
    litter.append(leaf)
  }
  _ = oval(piece, gold, 0, 0, 0, 0.20, 0.045, 0.12)
} else if species == "hare" {
  let basket = box(obstacle, 1.02, 0.52, 0.72, 0.10, gold, 0, 0.31, 0)
  _ = basket
  for j in 0..<4 {
    let r = ring(obstacle, 0.51, 0.020, wood, 0, 0.15 + Double(j) * 0.11, 0)
    r.scale.z = 0.72
  }
  for x: Float in [-0.43, 0.43] {
    stroke(obstacle, V(x, 0.54, 0.16), V(-0.86 + x * 0.47, 1.70, -0.28), 0.015, wood)
  }
  _ = oval(obstacle, red, -0.86, 2.03, -0.31, 0.46, 0.51, 0.39)
  _ = oval(obstacle, gold, -0.86, 2.03, -0.005, 0.157, 0.465, 0.095)
  _ = oval(accessory, red, 0, 0, 0, 0.37, 0.43, 0.31)
} else if species == "owl" {
  // A handmade diamond kite trailed by three bows.
  let kite = box(accessory, 0.61, 0.61, 0.07, 0.034, red, 0, 0, 0)
  kite.eulerAngles.z = .pi / 4
  stroke(accessory, V(0, -0.41, 0), V(0.10, -0.81, 0), 0.016, gold)
  for i in 0..<3 {
    let k = box(accessory, 0.18, 0.055, 0.04, 0.02, mustard, 0.05, -0.51 - Double(i) * 0.11, 0)
    k.eulerAngles.z = Double(i - 1) * 0.23
  }
  for i in 0..<3 {
    let r = ring(obstacle, 0.16, 0.023, red, -0.48, 1.04 + Double(i) * 0.08, 0.11)
    r.eulerAngles.z = 0.2
  }
} else if species == "cat" {
  _ = oval(accessory, blue, 0.12, 0.24, 0, 0.88, 0.25, 0.42)
  _ = box(accessory, 0.60, 0.60, 0.60, 0.12, blue, -0.32, 0.45, 0)
  _ = box(accessory, 0.66, 0.083, 0.63, 0.04, mustard, -0.32, 0.73, 0)
  _ = oval(accessory, paint(0x655b48), 0.12, 0.105, 0, 0.86, 0.11, 0.43)
} else if species == "frog" {
  _ = oval(accessory, mint, 0, 0, 0, 0.78, 0.065, 0.58)
  for s: Float in [-1, 0, 1] {
    stroke(accessory, V(-0.20, 0.06, 0), V(0.56, 0.065, s * 0.29), 0.008, paint(0x9dc28a))
  }
  _ = oval(piece, mint, 0, 0, 0, 0.39, 0.042, 0.30)
} else if species == "penguin" {
  // A bank beneath the runners gives the sled a visible descending surface.
  let bank = oval(ground, paint(0xe1e5f1), -0.82, -0.005, -0.12, 2.48, 0.47, 0.76)
  bank.eulerAngles.z = -0.108
  _ = box(accessory, 1.55, 0.14, 0.80, 0.06, red, 0, 0.32, 0)
  for z in [-0.28, 0.28] {
    stroke(accessory, V(-0.77, 0.09, Float(z)), V(0.75, 0.09, Float(z)), 0.045, gold)
    stroke(accessory, V(0.74, 0.09, Float(z)), V(0.90, 0.21, Float(z)), 0.041, gold)
    for x in [-0.4, 0.43] { _ = box(accessory, 0.09, 0.22, 0.08, 0.017, wood, x, 0.19, z) }
  }
  _ = box(obstacle, 0.41, 0.29, 0.45, 0.07, ice, 0.76, 0.12, 0.18)
} else if species == "mouse" {
  let cheese = mesh(accessory, SCNCylinder(radius: 0.57, height: 0.29), mustard, 0, 0, 0)
  cheese.eulerAngles.x = .pi / 2
  for i in 0..<7 {
    let a = Double(i) * 2.4
    _ = oval(
      accessory, gold, cos(a) * 0.38, sin(a) * 0.39, 0.151, 0.058 + Double(i % 2) * 0.019, 0.062,
      0.012)
  }
}
var particleNodes: [SCNNode] = []
for j in 0..<11 {
  let mat =
    winter
    ? snow
    : species == "bear"
      ? gold : (["frog", "cat"].contains(species) ? wave : (j % 2 == 0 ? mustard : mint))
  let n = oval(world, mat, 0, 0, 0, 0.033, 0.046, 0.032)
  particleNodes.append(n)
}
func pose(_ t: Double) {
  let lift = pulse(t, 0.68, 1.74)
  let anticipation = pulse(t, 1.66, 2.48)
  let release = ease(t, 2.05, 2.72)
  let hop = pulse(t, 2.48, 3.56)
  let skew = chosenTrick == 0 ? 1.0 : chosenTrick == 1 ? -1.0 : 0.35
  let glance = pulse(t, 0.55, 2.72)
  let accent = pulse(t, 4.13, 4.78)
  var x = 0.12
  var y = 0.03
  let run = ease(t, 2.86, 4.95)
  let stepPhase = sin(run * Double.pi * 12)
  if species == "wolf" {
    x += 4.24 * run - 1.49 * ease(t, 5.03, 5.70)
    y += abs(stepPhase) * 0.11
  } else if species == "cub" {
    y += 0.72 * hop
    x += 0.40 * release
  } else if species == "owl" {
    y += 0.08 + 0.45 * release + sin(t * 4) * 0.10 * release
    x += 0.45 * release
  } else if species == "hare" {
    y += 0.55 * (1 - release) + 0.26 * hop
    x += 0.30 * release
  } else if species == "frog" {
    y += 0.86 * hop + 0.13 * accent
    x += 0.88 * ease(t, 2.47, 3.60)
  } else if species == "mouse" {
    x += 1.72 * ease(t, 2.51, 5.50)
    y += 0.10 + 0.92 * ease(t, 2.23, 3.43) + 0.52 * hop
  } else if species == "penguin" || species == "cat" {
    x += (species == "penguin" ? 1.48 : 1.05) * ease(t, 2.50, 4.86)
    y +=
      0.24 + sin(t * 3.6) * 0.045 * release
      + (species == "penguin" ? 0.38 * (1 - ease(t, 2.50, 4.86)) : 0)
  } else {
    x += 0.40 * release
    y += (species == "bear" ? 0.44 : 0.28) * hop
  }
  if species == "fox" && trick == "B" {
    let turn = ease(t, 2.35, 4.72) * 2 * pi
    x += 0.57 * sin(turn)
    y += 0.19 * (1 - cos(turn)) / 2
  }
  let ox = x - 0.28
  actor.position = SCNVector3(ox, y, 0)
  shadow.position.x = CGFloat(ox)
  shadow.scale.x = CGFloat(1 - 0.30 * hop)
  shadow.opacity = CGFloat(0.92 - 0.3 * hop)
  let bx = -0.16
  obstacle.position = SCNVector3(bx, 0, 0)
  accessory.position = SCNVector3(bx, 0, 0)
  if species == "wolf" {
    obstacle.scale.y = CGFloat(max(0.009, 1 - release))
    obstacle.opacity = CGFloat(1 - release)
    accessory.opacity = CGFloat(release)
    accessory.scale.x = CGFloat(0.5 + release * 0.65)
  }
  if species == "cub" {
    obstacle.scale.y = CGFloat(1 - 0.66 * release)
    piece.position = SCNVector3(
      ox, 1.98 + 0.37 * ease(t, 1.3, 1.8) + 0.75 * pulse(t, 2.47, 4.51) - 0.30 * ease(t, 4.1, 4.52),
      0.32)
    piece.eulerAngles.z = CGFloat(0.28 * sin(t * 4) * release)
    piece.scale = SCNVector3(1, 1, 1)
  }
  if species == "fox" {
    obstacle.position.y = -0.12
    obstacle.scale = SCNVector3(1 + 0.32 * release, 1 - release * 0.93, 1 + 0.32 * release)
    accessory.position = SCNVector3(
      bx - 0.47 - 0.45 * release, 1.08 + 0.49 * hop - 0.79 * release, 0.40)
    accessory.eulerAngles.z = CGFloat(release * 3.8)
  }
  if species == "bear" {
    piece.position = SCNVector3(ox - 0.03, 0.36 + 1.26 * ease(t, 2.44, 3.38) + 0.37 * hop, 0.65)
    piece.opacity = CGFloat(release)
  }
  if species == "hedgehog" {
    for (i, n) in litter.enumerated() {
      let a = Double(i) * 2.4
      n.position = SCNVector3(
        bx + cos(a) * (0.55 + release),
        0.34 + Double(i % 4) * 0.20 + Double(i % 3) * 0.26 * hop - 0.31 * release,
        0.44 + sin(a) * 0.09)
      n.eulerAngles.z = CGFloat(sin(a) * 0.55 + release * a * 0.14)
    }
    piece.position = SCNVector3(ox + 0.19, 0.69 + 1.44 * release + 0.27 * hop, 0.21)
    piece.eulerAngles.z = CGFloat(0.24 + 0.18 * sin(t * 6) * release)
  }
  if species == "hare" {
    obstacle.position = SCNVector3(ox, 0.34 * (1 - release) - 0.21 * release, -0.05)
    obstacle.opacity = CGFloat(1 - ease(t, 3.20, 4.18))
    accessory.position = SCNVector3(ox - 0.81 - 0.38 * release, 2.44 + 0.64 * release, -0.3)
    accessory.opacity = CGFloat(release)
  }
  if species == "owl" {
    obstacle.position = SCNVector3(ox, y, -0.02)
    obstacle.opacity = CGFloat(1 - release)
    accessory.position = SCNVector3(
      ox - 0.74 - 0.77 * release, 2.09 + 0.24 * sin(t * 4) + 0.30 * release, 0.05)
    accessory.eulerAngles.z = CGFloat(0.18 * sin(t * 4) + 0.35 * hop)
  }
  if species == "cat" || species == "penguin" {
    accessory.position = SCNVector3(
      ox,
      0.01 + 0.05 * sin(t * 3.6) * release
        + (species == "penguin" ? 0.38 * (1 - ease(t, 2.50, 4.86)) : 0), 0.17)
    accessory.eulerAngles.z = CGFloat(0.08 * sin(t * 3.6) * release)
    obstacle.opacity = CGFloat(1 - release)
  }
  if species == "frog" {
    accessory.position = SCNVector3(bx + 1.05 * release, 0.035, 0.1)
    piece.position = SCNVector3(ox, 2.13 + y + 0.18 * pulse(t, 4.03, 4.66), 0.08)
    piece.eulerAngles.z = CGFloat(0.29 + 0.15 * sin(t * 3))
    piece.opacity = CGFloat(ease(t, 3.5, 4.03))
  }
  if species == "mouse" {
    accessory.position = SCNVector3(ox - 0.57 + 0.56 * ease(t, 2.18, 3.40), 0.54, -0.02)
    accessory.eulerAngles.z = CGFloat(-3.40 * ease(t, 2.51, 5.50))
  }
  let spray = ease(t, 2.15, 3.22)
  for (i, n) in particleNodes.enumerated() {
    let a = Double(i) * 2.4
    n.isHidden = t < 2.15 || t > 3.22
    n.position = SCNVector3(
      bx + cos(a) * (0.45 + spray), 0.78 + sin(pi * spray) * Double(2 + i % 3) * 0.28 - 0.4 * spray,
      0.42 + sin(a) * 0.28)
    n.opacity = CGFloat(1 - spray)
  }
  if species == "wolf" || species == "cub" {
    obstacle.scale.x = 1.34
    obstacle.position.x = CGFloat(bx - 0.02)
  }
  let beats: [Double] = [0.48, 1.22, 2.08, 2.68, 3.19, 3.79, 4.63, 5.51]
  var step = 0.0
  for i in 0..<7 {
    let d = beats[i + 1] - beats[i]
    step += ease(t, beats[i] + d * 0.30, beats[i] + d * 0.75)
  }
  let index = Int((step * 6).rounded())
  if index != celIndex {
    celMat.diffuse.contents = paintedPoses[index]
    celIndex = index
  }
  let rock = 0.045 * lift - 0.045 * anticipation + 0.064 * skew * hop + 0.035 * accent
  illustrated.eulerAngles.z = CGFloat(rock + 0.017 * sin(t * 4.1))
  let wide = 1 + 0.042 * anticipation - 0.025 * hop
  illustrated.scale = SCNVector3(wide, 1 - 0.047 * anticipation + 0.035 * hop, 1)
  illustrated.position.y = CGFloat(0.013 * sin(t * 3.5) - 0.032 * anticipation)
  camera.camera!.orthographicScale = (fourPaws ? 1.49 : 1.65) - 0.14 * lift + 0.045 * hop
  camera.position.x = CGFloat(0.115 * release - 0.055 * glance)
  camera.position.y = CGFloat(2.32 - (fourPaws ? 0.12 : 0.0))
  camera.look(
    at: SCNVector3(0.055 * release, species == "mouse" ? 1.47 : fourPaws ? 1.19 : 1.38, 0))
  if species == "mouse" { camera.camera!.orthographicScale = 1.77 - 0.07 * lift }
}
let renderer = SCNRenderer(device: metal, options: nil)
renderer.scene = scene
renderer.pointOfView = camera
let W = 720
let H = 404
let fps = 24
let frames = 144
let size = CGSize(width: W, height: H)
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
let bytes = UnsafeMutableRawPointer.allocate(byteCount: W * H * 4, alignment: 64)
defer { bytes.deallocate() }
let output = CGContext(
  data: bytes, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W * 4, space: cs,
  bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
let enc = Process()
enc.executableURL = URL(fileURLWithPath: "/opt/homebrew/bin/ffmpeg")
enc.arguments = [
  "-loglevel", "error", "-y", "-f", "rawvideo", "-pixel_format", "rgb0", "-video_size", "\(W)x\(H)",
  "-framerate", String(fps), "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "17",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart", args[4],
]
let pipe = Pipe()
enc.standardInput = pipe
try enc.run()
for frame in 0..<frames {
  autoreleasepool {
    let sec = Double(frame) / Double(fps)
    pose(sec)
    SCNTransaction.flush()
    let img = renderer.snapshot(atTime: sec, with: size, antialiasingMode: .multisampling2X)
    var rect = CGRect(origin: .zero, size: size)
    guard let cg = img.cgImage(forProposedRect: &rect, context: nil, hints: nil) else {
      fatalError("Missing rendered frame")
    }
    output.draw(cg, in: rect)
    pipe.fileHandleForWriting.write(Data(bytesNoCopy: bytes, count: W * H * 4, deallocator: .none))
    if args.count >= 7 && (frame == 0 || frame == frames - 1) {
      let destination = args[frame == 0 ? 5 : 6]
      let data = NSBitmapImageRep(cgImage: cg).representation(
        using: .jpeg, properties: [.compressionFactor: 0.86])!
      try! data.write(to: URL(fileURLWithPath: destination))
    }
  }
}
try pipe.fileHandleForWriting.close()
enc.waitUntilExit()
exit(enc.terminationStatus)
