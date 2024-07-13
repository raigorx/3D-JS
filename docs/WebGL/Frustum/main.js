import {
  perspective,
  translate,
  identityMatrix,
  lookAt,
  targetTo,
  invert,
  multiplyTwo4x4Matrices,
  rotateX,
  rotateY,
  rotateZ
} from '../../matrixes.js'
import { gl, setupBuffers, drawOnScreen } from '../../webgl-helper.js'

const canvas = document.querySelector('#glCanvas')
/*
reminder
canvas.width gets the html attribute
canvas.clientWidth Gets the width of the canvas as set through CSS.

canvas.width and canvas.height
Sets the number of pixels in the canvas's drawing buffer. It controls the resolution of the canvas.
*/
// fix blurry canvas
canvas.width = canvas.clientWidth * window.devicePixelRatio
canvas.height = canvas.clientHeight * window.devicePixelRatio

const scissorHeight = canvas.height / 2
const aspectRatio = canvas.width / scissorHeight

let fieldViewDegrees = 35
document.getElementById('fovDisplay').innerText = fieldViewDegrees
let zNear = 10
document.getElementById('zNearDisplay').innerText = zNear
let zFar = 30
document.getElementById('zFarDisplay').innerText = zFar
let zPosition = -15
document.getElementById('zPositionDisplay').innerText = zPosition

function assert (condition, message) {
  if (!condition) throw new Error(message ?? 'Assertion failed')
}

const [cubeIndicesCount, cubeIndices] = (function () {
  /*
  defines how to draw the vertices to form the triangles of each face of the cube.

  Each set of three indices in the array represents one triangle.
  Number of Faces: A cube has 6 faces.
  Triangles per Face: Each face is made of 2 triangles.
  Vertices per Triangle: Each triangle is defined by 3 vertices.
  Total number of triangles = 6 faces * 2 triangles per face = 12 triangles
  Total number of indices = 12 triangles * 3 vertices per triangle = 36 indices
  */
  // prettier-ignore
  const indices = [
    // Front face
    0, 1, 2, 0, 2, 3,
    // Back face
    4, 5, 6, 4, 6, 7,
    // Top face
    8, 9, 10, 8, 10, 11,
    // Bottom face
    12, 13, 14, 12, 14, 15,
    // Right face
    16, 17, 18, 16, 18, 19,
    // Left face
    20, 21, 22, 20, 22, 23
  ]

  return [indices.length, new Uint16Array(indices)]
})()

const degToRad = deg => (deg * Math.PI) / 180
const radToDeg = radians => radians * (180 / Math.PI)

const {
  drawCube,
  updateFieldOfView,
  updateZNear,
  updateZPosition,
  updateZFar
} = (function () {
  let defaultProjection

  if (true) {
    defaultProjection = perspective(fieldViewDegrees, aspectRatio, zNear, zFar)
  } else {
    // you can draw a cube without all the logic in the perspetive matrix
    // the only requierement is the -1
    // prettier-ignore
    defaultProjection = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, -1,
        0, 0, 0, 1
      ])
  }

  const cubeVertexes = (function () {
    const vertex0 = [1.0, 1.0, 1.0] // Front top right
    const vertex1 = [-1.0, 1.0, 1.0] // Front top left
    const vertex2 = [-1.0, -1.0, 1.0] // Front bottom left
    const vertex3 = [1.0, -1.0, 1.0] // Front bottom right
    const vertex4 = [1.0, 1.0, -1.0] // Back top right
    const vertex5 = [-1.0, 1.0, -1.0] // Back top left
    const vertex6 = [-1.0, -1.0, -1.0] // Back bottom left
    const vertex7 = [1.0, -1.0, -1.0] // Back bottom right

    // prettier-ignore
    const vertices = [
        // Front face
        ...vertex0, ...vertex1, ...vertex2, ...vertex3,
        // Back face
        ...vertex4, ...vertex5, ...vertex6, ...vertex7,
        // Top face
        ...vertex0, ...vertex4, ...vertex5, ...vertex1,
        // Bottom face
        ...vertex3, ...vertex7, ...vertex6, ...vertex2,
        // Right face
        ...vertex0, ...vertex3, ...vertex7, ...vertex4,
        // Left face
        ...vertex1, ...vertex2, ...vertex6, ...vertex5
      ]

    /*
        The cube has 8 unique vertices, but since each face of the cube needs
        its own set of vertices to assign different colors,
        we define 24 vertices (4 vertices x 6 faces  = 24 vertices)
        and each vertex has 3 components (x, y, z)
      */

    assert(vertices.length === 24 * 3, 'Incorrect number of vertices')

    return new Float32Array(vertices)
  })()

  const colorBuffer = (function () {
    // Each face has a color RGBA
    const frontFaceColor = [1.0, 0.0, 0.0, 1.0] // Red
    const backFaceColor = [0.0, 1.0, 0.0, 1.0] // Green
    const topFaceColor = [0.0, 0.0, 1.0, 1.0] // Blue
    const bottomFaceColor = [1.0, 1.0, 0.0, 1.0] // Yellow
    const rightFaceColor = [1.0, 0.0, 1.0, 1.0] // Magenta
    const leftFaceColor = [0.0, 1.0, 1.0, 1.0] // Cyan

    const faceColors = [
      frontFaceColor, // Front face
      backFaceColor, // Back face
      topFaceColor, // Top face
      bottomFaceColor, // Bottom face
      rightFaceColor, // Right face
      leftFaceColor // Left face
    ]

    assert(faceColors.length === 6, 'Incorrect number of face colors')

    // const colors = [
    //   ...faceColors[0], ...faceColors[0], ...faceColors[0], ...faceColors[0],  // Front face
    //   ...faceColors[1], ...faceColors[1], ...faceColors[1], ...faceColors[1],  // Back face
    //   ...faceColors[2], ...faceColors[2], ...faceColors[2], ...faceColors[2],  // Top face
    //   ...faceColors[3], ...faceColors[3], ...faceColors[3], ...faceColors[3],  // Bottom face
    //   ...faceColors[4], ...faceColors[4], ...faceColors[4], ...faceColors[4],  // Right face
    //   ...faceColors[5], ...faceColors[5], ...faceColors[5], ...faceColors[5]   // Left face
    // ]

    /*
   Color interpolation in computer graphics refers to the process of blending colors between vertices of a primitive (such as a triangle)
   */

    // interpolation two cubes one with interpolation another without one
    // prettier-ignore
    const colors = [
     ...faceColors[0], ...faceColors[1], ...faceColors[2], ...faceColors[3],  // Front face
     ...faceColors[4], ...faceColors[5], ...faceColors[0], ...faceColors[1],  // Back face
     ...faceColors[2], ...faceColors[3], ...faceColors[4], ...faceColors[5],  // Top face
     ...faceColors[0], ...faceColors[1], ...faceColors[2], ...faceColors[3],  // Bottom face
     ...faceColors[4], ...faceColors[5], ...faceColors[0], ...faceColors[1],  // Right face
     ...faceColors[2], ...faceColors[3], ...faceColors[4], ...faceColors[5]   // Left face
   ]

    assert(colors.length === 24 * 4, 'Incorrect number of colors')

    return new Float32Array(colors)
  })()

  return {
    updateFieldOfView: adjusment => {
      fieldViewDegrees += adjusment
      defaultProjection = perspective(
        fieldViewDegrees,
        aspectRatio,
        zNear,
        zFar
      )
      document.getElementById('fovDisplay').innerText = fieldViewDegrees
    },
    updateZNear: adjusment => {
      zNear += adjusment
      defaultProjection = perspective(
        fieldViewDegrees,
        aspectRatio,
        zNear,
        zFar
      )
      document.getElementById('zNearDisplay').innerText = zNear
    },
    updateZFar: adjusment => {
      zFar += adjusment
      defaultProjection = perspective(
        fieldViewDegrees,
        aspectRatio,
        zNear,
        zFar
      )
      document.getElementById('zFarDisplay').innerText = zFar
    },
    updateZPosition: adjusment => {
      zPosition += adjusment
      document.getElementById('zPositionDisplay').innerText = zPosition
    },
    drawCube: (cubeRotation, mode, projection) => {
      let projectionMatrix = projection ?? defaultProjection

      let modelViewMatrix = identityMatrix()
      modelViewMatrix = rotateX(modelViewMatrix, cubeRotation)
      modelViewMatrix = rotateY(modelViewMatrix, cubeRotation)
      /*
      webgl map its Normalized Device Coordinates (NDC) to canvas coordinates
      automatically where 0,0,0 is the center of the canvas
      but because in 0 z axis we are inside the cube we need to zoom out it
      */
      modelViewMatrix = translate(modelViewMatrix, 0.0, 0.0, zPosition)

      setupBuffers(cubeVertexes, cubeIndices, colorBuffer)
      drawOnScreen(projectionMatrix, modelViewMatrix, cubeIndicesCount, mode)
    }
  }
})()

function createButton (updateValue, speed) {
  let intervalId = null
  function start (adjustment) {
    updateValue(adjustment)
    intervalId = setInterval(() => updateValue(adjustment), speed)
  }

  function stop () {
    clearInterval(intervalId)
  }
  return { start, stop }
}

window.FOVButton = createButton(updateFieldOfView, 90)
window.zNearButton = createButton(updateZNear, 90)
window.zFar = createButton(updateZFar, 90)
window.zPosition = createButton(updateZPosition, 90)

const {
  drawFrustum,
  updateCameraAngleX,
  updateCameraAngleY,
  updateCameraAngleZ
} = (function () {
  const vertexHalfCube = (function () {
    const vertex0 = [1.0, 1.0, -1.0] // Front top right
    const vertex1 = [1.0, 1.0, 1.0] // Front top left
    const vertex2 = [1.0, -1.0, 1.0] // Front bottom left
    const vertex3 = [1.0, -1.0, -1.0] // Front bottom right
    const vertex4 = [-1.0, 1.0, 1.0] // Back top right
    const vertex5 = [-1.0, 1.0, -1.0] // Back top left
    const vertex6 = [-1.0, -1.0, -1.0] // Back bottom left
    const vertex7 = [-1.0, -1.0, 1.0] // Back bottom right

    // prettier-ignore
    const vertices = [
        // Front face
        ...vertex0, ...vertex1, ...vertex2, ...vertex3,
        // Back face
        ...vertex4, ...vertex5, ...vertex6, ...vertex7,
        // Top face
        ...vertex4, ...vertex1, ...vertex3, ...vertex5,
        // Bottom face
        ...vertex6, ...vertex3, ...vertex2, ...vertex7,
        // Right face
        ...vertex1, ...vertex4, ...vertex7, ...vertex2,
        // Left face
        ...vertex5, ...vertex0, ...vertex3, ...vertex6
      ]

    assert(vertices.length === 24 * 3, 'Incorrect number of vertices')

    return new Float32Array(vertices)
  })()

  const halfCubeColor = new Float32Array([
    1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0,
    1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1,
    1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1
  ])

  function drawHalfCube (mode, projection, modelViewMatrix) {
    setupBuffers(vertexHalfCube, cubeIndices, halfCubeColor)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)
    drawOnScreen(projection, modelViewMatrix, cubeIndicesCount, mode)
    gl.disable(gl.CULL_FACE)
  }

  const halfCubeWiresVertex = new Float32Array([
    -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1,

    -1, 1, 1, 1, 1, 1, 1, -1, 1, -1, -1, 1
  ])
  const [halfCubeWireCount, halfCubeWireIndices] = (function () {
    const verticesArrIndeces = [
      0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7
    ]

    return [verticesArrIndeces.length, new Uint16Array(verticesArrIndeces)]
  })()

  const rayIndices = new Uint16Array([0, 4, 1, 5, 2, 6, 3, 7])
  const rayCount = rayIndices.length

  const colorBuffer = new Float32Array(new Array(32).fill(1))

  let cameraAngleX = degToRad(39)
  let cameraAngleY = degToRad(207)
  let cameraAngleZ = degToRad(4)
  document.getElementById('cameraAngleXDisplay').innerText = Math.floor(
    radToDeg(cameraAngleX)
  )
  document.getElementById('cameraAngleYDisplay').innerText = Math.floor(
    radToDeg(cameraAngleY)
  )
  document.getElementById('cameraAngleZDisplay').innerText = Math.floor(
    radToDeg(cameraAngleZ)
  )

  const zNear0 = 1
  const zFar0 = 5000

  function drawRays (viewProjection) {
    let projection = perspective(fieldViewDegrees, aspectRatio, zNear0, zFar0)
    invert(projection, projection)
    const modelViewMatrix = multiplyTwo4x4Matrices(projection, identityMatrix())
    setupBuffers(halfCubeWiresVertex, rayIndices, colorBuffer)
    drawOnScreen(viewProjection, modelViewMatrix, rayCount, gl.LINES)
  }

  function drawFrustumWire (viewProjection) {
    let projection = perspective(fieldViewDegrees, aspectRatio, zNear, zFar)
    invert(projection, projection)
    const modelViewMatrix = multiplyTwo4x4Matrices(projection, identityMatrix())
    setupBuffers(halfCubeWiresVertex, halfCubeWireIndices, colorBuffer)
    drawOnScreen(viewProjection, modelViewMatrix, halfCubeWireCount, gl.LINES)

    return modelViewMatrix
  }

  return {
    updateCameraAngleX: adjusment => {
      cameraAngleX += degToRad(adjusment)
      document.getElementById('cameraAngleXDisplay').innerText = Math.floor(
        radToDeg(cameraAngleX)
      )
    },
    updateCameraAngleY: adjusment => {
      cameraAngleY += degToRad(adjusment)
      document.getElementById('cameraAngleYDisplay').innerText = Math.floor(
        radToDeg(cameraAngleY)
      )
    },
    updateCameraAngleZ: adjusment => {
      cameraAngleZ += degToRad(adjusment)
      document.getElementById('cameraAngleZDisplay').innerText = Math.floor(
        radToDeg(cameraAngleZ)
      )
    },
    drawFrustum: cubeRotation => {
      const projectionMatrix = perspective(60, aspectRatio, zNear0, zFar0)
      let modelViewMatrix = identityMatrix()
      let cameraMatrix = identityMatrix()
      /*
      Friendly reminder order matters because translate multiply
      (matrix, translationMatrix) that mean first rotate and then
      translate
      for that reason first translate and then rotate
      */
      cameraMatrix = translate(cameraMatrix, 0.0, 0.0, -50.0)
      cameraMatrix = rotateY(cameraMatrix, cameraAngleX)
      cameraMatrix = rotateX(cameraMatrix, cameraAngleY)
      const cameraPosition = [cameraMatrix[12], cameraMatrix[13], 15]
      // if (Math.floor(cameraMatrix[12]) === 32) debugger
      // const cameraPosition = new Float32Array([32, 19, 18])
      // const target = new Float32Array([0, 0, 0])
      const target = new Float32Array([23, 16, 0])
      // same result different methods
      if (true) {
        modelViewMatrix = targetTo(
          modelViewMatrix,
          cameraPosition,
          target,
          new Float32Array([0, 1, 0])
        )
        modelViewMatrix = rotateZ(modelViewMatrix, cameraAngleZ)
        invert(modelViewMatrix, modelViewMatrix)
      } else {
        modelViewMatrix = lookAt(
          modelViewMatrix,
          cameraPosition,
          target,
          new Float32Array([0, 1, 0])
        )
        modelViewMatrix = rotateZ(modelViewMatrix, cameraAngleZ)
      }

      const viewProjection = multiplyTwo4x4Matrices(
        modelViewMatrix,
        projectionMatrix
      )

      drawRays(viewProjection)
      gl.enable(gl.DEPTH_TEST)
      modelViewMatrix = drawFrustumWire(viewProjection)
      drawHalfCube(gl.TRIANGLES, viewProjection, modelViewMatrix)
      gl.disable(gl.DEPTH_TEST)
      drawCube(cubeRotation, gl.LINES, viewProjection)
    }
  }
})()
window.cameraAngleX = createButton(updateCameraAngleX, 35)
window.cameraAngleY = createButton(updateCameraAngleY, 35)
window.cameraAngleZ = createButton(updateCameraAngleZ, 35)

function main () {
  gl.enable(gl.SCISSOR_TEST)

  function render (now) {
    now *= 0.001 // convert time to seconds
    const time = now

    // top half
    gl.scissor(0, scissorHeight, canvas.width, scissorHeight)
    gl.viewport(0, scissorHeight, canvas.width, scissorHeight)
    drawFrustum(time)

    // bottom half
    gl.scissor(0, 0, canvas.width, scissorHeight)
    gl.viewport(0, 0, canvas.width, scissorHeight)
    drawCube(time, gl.LINES)

    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
}

main()
