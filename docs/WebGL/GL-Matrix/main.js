import { gl, setupBuffers, drawOnScreen } from '../../webgl-helper.js'

const canvas = document.querySelector('#glCanvas')

// fix blurry canvas
canvas.width = canvas.clientWidth * window.devicePixelRatio
canvas.height = canvas.clientHeight * window.devicePixelRatio
gl.viewport(0, 0, canvas.width, canvas.height)

// Define cube vertices and colors
const positions = [
  -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0,
  -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0
]

const colors = [
  [1.0, 1.0, 1.0, 1.0], // Front face
  [1.0, 0.0, 0.0, 1.0], // Back face
  [0.0, 1.0, 0.0, 1.0], // Top face
  [0.0, 0.0, 1.0, 1.0], // Bottom face
  [1.0, 1.0, 0.0, 1.0], // Right face
  [1.0, 0.0, 1.0, 1.0] // Left face
]

let unpackedColors = []
for (var i in colors) {
  const color = colors[i]
  for (var j = 0; j < 4; j++) {
    unpackedColors = unpackedColors.concat(color)
  }
}

// prettier-ignore
const indices = new Uint16Array([
  0, 1, 2, 0,
  2, 3, 4, 5,
  6, 4, 6, 7,
  5, 3, 2, 5,
  2, 6, 4, 7,
  1, 4, 1, 0,
  7, 6, 2, 7,
  2, 1, 4, 0,
  3, 4, 3, 5
])

function drawScene (cubeRotation) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clearDepth(1.0)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  const fieldOfView = (60 * Math.PI) / 180
  const aspect = canvas.width / canvas.height
  const zNear = 0.1
  const zFar = 100.0
  const projectionMatrix = mat4.create()

  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

  const modelViewMatrix = mat4.create()
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0])
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 0, 1])
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7, [0, 1, 0])

  setupBuffers(positions, indices, new Float32Array(unpackedColors))
  drawOnScreen(projectionMatrix, modelViewMatrix, indices.length, gl.TRIANGLES)
}

function render (cubeRotation) {
  cubeRotation *= 0.001
  drawScene(cubeRotation)
  requestAnimationFrame(render)
}

requestAnimationFrame(render)
