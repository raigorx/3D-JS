const EPSILON = 0.000001

export function multiplyTwo4x4Matrices (firstMatrix, secondMatrix) {
  const resultMatrix = new Float32Array(16)

  // Iterate over each cell in the result matrix.
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let cellValue = 0

      // Compute the value of the cell.
      for (let index = 0; index < 4; index++) {
        cellValue +=
          firstMatrix[row * 4 + index] * secondMatrix[index * 4 + col]
      }

      // Assign the computed value to the cell in the result matrix.
      resultMatrix[row * 4 + col] = cellValue
    }
  }

  return new Float32Array(resultMatrix)
}

export function translate (matrix, tx, ty, tz) {
  /*
  Column-major order matrix-vector multiplication:

  Matrix (M) 4x4:
  ⎡  1   0   0   0  ⎤
  ⎢  0   1   0   0  ⎥
  ⎢  0   0   1   0  ⎥
  ⎢  tx  ty  tz  1  ⎥

  Vector (v) 4x1:
  ⎡ x ⎤
  ⎢ y ⎥
  ⎢ z ⎥
  ⎢ 1 ⎥

  Resulting vector (r) 4x1:
  ⎡ r1 ⎤
  ⎢ r2 ⎥
  ⎢ r3 ⎥
  ⎢ r4 ⎥

  Where:
  r1 = 1*x + 0*y + 0*z + 1*tx = x + tx
  r2 = 0*x + 1*y + 0*z + 1*ty = y + ty
  r3 = 0*x + 0*y + 1*z + 1*tz = z + tz
  r4 = 0*1 + 0*1 + 0*1 + 1*1  = 0 + 1
  */

  // column-major order (which is used in OpenGL/WebGL)
  // prettier-ignore
  const translationMatrix = new Float32Array([
      1,  0,  0,  0,
      0,  1,  0,  0,
      0,  0,  1,  0,
      tx, ty, tz, 1
  ])

  // row-major order
  // const translationMatrix = new Float32Array([
  //     1,  0,  0,  tx,
  //     0,  1,  0,  ty,
  //     0,  0,  1,  tz,
  //     0,  0,  0,  1
  // ])

  return multiplyTwo4x4Matrices(matrix, translationMatrix)
}

export function perspective (degrees, aspectRatio, zNear, zFar) {
  const degreesToRadians = degrees => (degrees * Math.PI) / 180
  let fieldViewRadians = degreesToRadians(degrees)
  /*
    The aspect ratio is the proportional relationship between
    the width and height of a display or a screen.
  */
  const fovScalingFactor = 1.0 / Math.tan(fieldViewRadians / 2)
  const depthRangeInverse = 1 / (zNear - zFar)

  /*
    Perspective projection requires the -1 to properly divide by the depth value
    (w coordinate), creating the perspective effect.
    In a right-handed coordinate system (common in OpenGL/WebGL), objects in front of the camera
    have negative z-values, and those behind the camera have positive z-values.
    The near plane is closer to the camera and has a smaller (more negative)
    z-value than the far plane.
    When a vertex [x, y, z, 1] is multiplied by this matrix,
    the resulting w-component will be -z due to the -1 in the third row, fourth column.
  */
  // prettier-ignore
  return new Float32Array([
      fovScalingFactor / aspectRatio, 0,  0,                            0,
      0,               fovScalingFactor,  0,                            0,
      0,               0,  (zNear + zFar) * depthRangeInverse,   -1,
      0,               0,  zNear * zFar * depthRangeInverse * 2,  0
  ])
}

export function identityMatrix () {
  /*
  4x4 identity matrix
  It serves as the starting point for constructing more complex transformation matrices,
  such as translation, rotation, and scaling matrices.
  Multiplying any matrix by the identity matrix will result in the original matrix,
  making it a neutral element in matrix multiplication.
  */
  // prettier-ignore
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ])
}

export function lookAt (out, eye, center, up) {
  let x0, x1, x2, y0, y1, y2, z0, z1, z2, len
  let eyex = eye[0]
  let eyey = eye[1]
  let eyez = eye[2]
  let upx = up[0]
  let upy = up[1]
  let upz = up[2]
  let centerx = center[0]
  let centery = center[1]
  let centerz = center[2]

  if (
    Math.abs(eyex - centerx) < EPSILON &&
    Math.abs(eyey - centery) < EPSILON &&
    Math.abs(eyez - centerz) < EPSILON
  ) {
    return identityMatrix(out)
  }

  z0 = eyex - centerx
  z1 = eyey - centery
  z2 = eyez - centerz

  len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2)
  z0 *= len
  z1 *= len
  z2 *= len

  x0 = upy * z2 - upz * z1
  x1 = upz * z0 - upx * z2
  x2 = upx * z1 - upy * z0
  len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2)
  if (!len) {
    x0 = 0
    x1 = 0
    x2 = 0
  } else {
    len = 1 / len
    x0 *= len
    x1 *= len
    x2 *= len
  }

  y0 = z1 * x2 - z2 * x1
  y1 = z2 * x0 - z0 * x2
  y2 = z0 * x1 - z1 * x0

  len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2)
  if (!len) {
    y0 = 0
    y1 = 0
    y2 = 0
  } else {
    len = 1 / len
    y0 *= len
    y1 *= len
    y2 *= len
  }

  out[0] = x0
  out[1] = y0
  out[2] = z0
  out[3] = 0
  out[4] = x1
  out[5] = y1
  out[6] = z1
  out[7] = 0
  out[8] = x2
  out[9] = y2
  out[10] = z2
  out[11] = 0
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez)
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez)
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez)
  out[15] = 1

  return out
}

export function targetTo (out, eye, target, up) {
  let eyex = eye[0],
    eyey = eye[1],
    eyez = eye[2],
    upx = up[0],
    upy = up[1],
    upz = up[2]

  let z0 = eyex - target[0],
    z1 = eyey - target[1],
    z2 = eyez - target[2]

  let len = z0 * z0 + z1 * z1 + z2 * z2
  if (len > 0) {
    len = 1 / Math.sqrt(len)
    z0 *= len
    z1 *= len
    z2 *= len
  }

  let x0 = upy * z2 - upz * z1,
    x1 = upz * z0 - upx * z2,
    x2 = upx * z1 - upy * z0

  len = x0 * x0 + x1 * x1 + x2 * x2
  if (len > 0) {
    len = 1 / Math.sqrt(len)
    x0 *= len
    x1 *= len
    x2 *= len
  }

  out[0] = x0
  out[1] = x1
  out[2] = x2
  out[3] = 0
  out[4] = z1 * x2 - z2 * x1
  out[5] = z2 * x0 - z0 * x2
  out[6] = z0 * x1 - z1 * x0
  out[7] = 0
  out[8] = z0
  out[9] = z1
  out[10] = z2
  out[11] = 0
  out[12] = eyex
  out[13] = eyey
  out[14] = eyez
  out[15] = 1
  return out
}

export function invert (out, a) {
  let a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3]
  let a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7]
  let a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11]
  let a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15]

  let b00 = a00 * a11 - a01 * a10
  let b01 = a00 * a12 - a02 * a10
  let b02 = a00 * a13 - a03 * a10
  let b03 = a01 * a12 - a02 * a11
  let b04 = a01 * a13 - a03 * a11
  let b05 = a02 * a13 - a03 * a12
  let b06 = a20 * a31 - a21 * a30
  let b07 = a20 * a32 - a22 * a30
  let b08 = a20 * a33 - a23 * a30
  let b09 = a21 * a32 - a22 * a31
  let b10 = a21 * a33 - a23 * a31
  let b11 = a22 * a33 - a23 * a32

  // Calculate the determinant
  let det =
    b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06

  if (!det) {
    return null
  }
  det = 1.0 / det

  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det

  return out
}

export function rotateX (matrix, angle) {
  // prettier-ignore
  const rotationMatrix = new Float32Array([
    1, 0, 0, 0,
    0, Math.cos(angle), -Math.sin(angle), 0,
    0, Math.sin(angle), Math.cos(angle), 0,
    0, 0, 0, 1
  ]);
  return multiplyTwo4x4Matrices(matrix, rotationMatrix)
}

export function rotateY (matrix, angle) {
  // prettier-ignore
  const rotationMatrix = new Float32Array([
    Math.cos(angle), 0, Math.sin(angle), 0,
    0, 1, 0, 0,
    -Math.sin(angle), 0, Math.cos(angle), 0,
    0, 0, 0, 1
  ]);
  return multiplyTwo4x4Matrices(matrix, rotationMatrix)
}

export function rotateZ (matrix, angle) {
  // prettier-ignore
  const rotationMatrix = new Float32Array([
    Math.cos(angle), -Math.sin(angle), 0, 0,
    Math.sin(angle), Math.cos(angle), 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ])
  return multiplyTwo4x4Matrices(matrix, rotationMatrix)
}
