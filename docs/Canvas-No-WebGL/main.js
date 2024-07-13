import {
  multiplyTwo4x4Matrices,
  perspective,
  rotateX,
  rotateY,
  rotateZ,
  identityMatrix
} from '../matrixes.js'

const canvas = document.getElementById('glCanvas')
// fix blurry canvas
canvas.width = canvas.clientWidth * window.devicePixelRatio
canvas.height = canvas.clientHeight * window.devicePixelRatio

const ctx = canvas.getContext('2d')

// Cube vertices
let vertices = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1], // Back face
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1] // Front face
]

// Cube edges with color
const edges = [
  [0, 1, 'red'],
  [1, 2, 'green'],
  [2, 3, 'blue'],
  [3, 0, 'yellow'], // Back face
  [4, 5, 'cyan'],
  [5, 6, 'magenta'],
  [6, 7, 'orange'],
  [7, 4, 'purple'], // Front face
  [0, 4, 'brown'],
  [1, 5, 'lime'],
  [2, 6, 'pink'],
  [3, 7, 'gray'] // Connecting edges
]

const applyMatrixToVertices = (vertices, matrix) => {
  return vertices.map(vertex => {
    const homogeneousVertex = [...vertex, 1]
    const transformedVertex = multiplyMatrixAndPoint(matrix, homogeneousVertex)
    return transformedVertex
  })
}

// Multiply a 4x4 matrix with a 4D point
const multiplyMatrixAndPoint = (matrix, point) => {
  const [x, y, z, w] = point
  const result = []
  for (let i = 0; i < 4; i++) {
    result[i] =
      matrix[i * 4] * x +
      matrix[i * 4 + 1] * y +
      matrix[i * 4 + 2] * z +
      matrix[i * 4 + 3] * w
  }
  return result
}

const drawCube = (vertices, edges, time) => {
  const projectionMatrix = perspective(60, canvas.width / canvas.height, 1, 100)
  let modelViewMatrix = identityMatrix()
  modelViewMatrix = rotateX(modelViewMatrix, time)
  modelViewMatrix = rotateY(modelViewMatrix, time + 0.01)
  modelViewMatrix = rotateZ(modelViewMatrix, time + 0.02)
  modelViewMatrix = multiplyTwo4x4Matrices(projectionMatrix, modelViewMatrix)
  const transformedVertices = applyMatrixToVertices(vertices, modelViewMatrix)

  const scale = 50
  edges.forEach(([start, end, color]) => {
    const [x1, y1] = transformedVertices[start]
    const [x2, y2] = transformedVertices[end]
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.moveTo(x1 * scale + canvas.width / 2, y1 * scale + canvas.height / 2)
    ctx.lineTo(x2 * scale + canvas.width / 2, y2 * scale + canvas.height / 2)
    ctx.stroke()
    ctx.closePath()
  })
}

const animate = now => {
  now *= 0.001 // convert time to seconds
  const time = now

  // clear screen
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  drawCube(vertices, edges, time)
  requestAnimationFrame(animate)
}
animate()
