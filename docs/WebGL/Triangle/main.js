const canvas = document.getElementById('glCanvas')
const gl = canvas.getContext('webgl2')
const program = gl.createProgram()

function compileGLShader (type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      'An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader)
    )
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createWebGLProgram () {
  const vertexShaderSource = `
    attribute vec4 a_position;
    void main() {
        gl_Position = a_position;
    }
  `

  const fragmentShaderSource = `
    void main() {
      // you can hardcode the color like this
      gl_FragColor = vec4(0.0, 1.0, 0.0, 0.0); // RGBA
    }
  `

  const vertexShader = compileGLShader(gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = compileGLShader(
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  )
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(
      'Unable to initialize the shader program: ' +
        gl.getProgramInfoLog(program)
    )
    return null
  }
  gl.useProgram(program)
}

function set2DVertices (vertices) {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(positionAttributeLocation)

  const vertexComponents = 2 // Each vertex has 2 components (x, y)
  const normalize = false // Do not normalize the data
  const stride = 0 // No stride (0 means tightly packed)
  const offset = 0 // No offset (start at the beginning of the buffer)

  gl.vertexAttribPointer(
    positionAttributeLocation,
    vertexComponents,
    gl.FLOAT,
    normalize,
    stride,
    offset
  )
}

;(function () {
  createWebGLProgram()

  // vertices of the triangle (x, y)
  const firstVertex = [0.0, 1.0] // Top center
  const secondVertex = [-1.0, -1.0] // Bottom left
  const thirdVertex = [1.0, -1.0] // Bottom right

  const vertices = [...firstVertex, ...secondVertex, ...thirdVertex]
  /*
  Normalized Device Coordinates (NDC)
  WebGL uses a normalized device coordinate (NDC) system for rendering.
  In this system, coordinates range from -1.0 to 1.0 in both x and y directions.
  This coordinate system is used internally by WebGL to standardize the output of the vertex shader.

  Window Coordinates
  Window coordinates range from (0, 0) to (canvas.width, canvas.height)
  (0, 0) is typically the bottom-left corner of the canvas.
  (canvas.width, canvas.height) is the top-right corner of the canvas.
  These are the actual pixel coordinates on the screen where the graphics are displayed

  The center in NDC is (0, 0)
  The corners in NDC are:
  Bottom-left: (-1.0, -1.0)
  Bottom-right: (1.0, -1.0)
  Top-left: (-1.0, 1.0)
  Top-right: (1.0, 1.0)

  (-1, 1)                  (1, 1)
   +----------------------+
   |           |          |
   |           |          |
   |           |          |
   |     (0, 1)|          |
   |      Top  |          |
   |      Center          |
   |          / \         |
   |         /   \        |
   |        /     \       |
   | (-1,-1)     (1,-1)   |
   | Bottom Left  Bottom  |
   |             Right    |
   +----------------------+
  (-1,-1)                 (1,-1)

  Suppose we have a vertex with NDC coordinates (0, 0).
  The lower-left corner (x, y) of the viewport is set to (0, 0).
  The viewport size is set to the canvas dimensions (canvas.width, canvas.height).

  Viewport Mapping:
  The gl.viewport function maps these NDC coordinates to window coordinates.
  This means the bottom-left corner of the viewport (in window coordinates) is mapped to (-1.0, -1.0) in NDC.

  Viewport: Defines the mapping from NDC to window coordinates.
  NDC: Ranges from -1 to 1, standardizing output across different resolutions.
  Window Coordinates: Actual pixel positions on the canvas.
  */
  // x = 0, y = 0 in window coordinates
  // fix blurry canvas
  canvas.width = canvas.clientWidth * window.devicePixelRatio
  canvas.height = canvas.clientHeight * window.devicePixelRatio
  gl.viewport(0, 0, canvas.width, canvas.height)

  set2DVertices(vertices)
  const startingIndex = 0
  const numberOfVertices = 3
  gl.drawArrays(gl.TRIANGLES, startingIndex, numberOfVertices) //  draw on screen
})()
