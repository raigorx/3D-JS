export const gl = document.querySelector('#glCanvas').getContext('webgl2')

const shaderProgram = createWebGLProgram()

const programInfo = {
  program: shaderProgram,
  attribLocations: {
    vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor')
  },
  uniformLocations: {
    projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
    modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')
  }
}
gl.useProgram(programInfo.program)

function compileGLShader (type, source) {
  const shader = gl.createShader(type)

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      'An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader)
    )
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function createWebGLProgram () {
  /*
  gl_Position is a built-in variable
  specifies the position of a vertex
  this vertexShader program is called for each vertex to determine its position
  */
  const vertexShaderSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying lowp vec4 vColor;
    void main(void) {
      vec4 position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      // webgl divide x,y,z by w
      gl_Position = vec4(position.xy, position.z, position.w);
      vColor = aVertexColor;
    }
  `

  /*
  gl_FragColor is a built-in variables
  specifies the color of a pixel
  this fragmentShader program is called for each pixel to determine its color
  */
  const fragmentShaderSource = `
    precision mediump float;

    varying lowp vec4 vColor;
    void main(void) {
      gl_FragColor = vColor;
    }
  `

  const shaderProgram = gl.createProgram()
  const vertexShader = compileGLShader(gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = compileGLShader(
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  )

  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      'Unable to initialize the shader program: ' +
        gl.getProgramInfoLog(shaderProgram)
    )
    return null
  }

  return shaderProgram
}

export function setupBuffers (vertexBuffer, vertexArrIndeces, colorBuffer) {
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexArrIndeces, gl.STATIC_DRAW)

  {
    const vertexComponents = 3
    const type = gl.FLOAT
    const normalize = false
    const stride = 0
    const offset = 0
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(vertexBuffer),
      gl.STATIC_DRAW
    )
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      vertexComponents,
      type,
      normalize,
      stride,
      offset
    )
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)
  }

  {
    const numComponents = 4
    const type = gl.FLOAT
    const normalize = false
    const stride = 0
    const offset = 0
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(colorBuffer),
      gl.STATIC_DRAW
    )
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset
    )
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor)
  }
}

export function drawOnScreen (
  projectionMatrix,
  modelViewMatrix,
  vertexCount,
  mode
) {
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  )
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  )

  {
    const type = gl.UNSIGNED_SHORT
    const offset = 0
    gl.drawElements(mode, vertexCount, type, offset)
  }
}
