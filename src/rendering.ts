import { STATE } from "./states";

const COLORS = {
  0: "#2e913a",
  1: "#ff2b23",
  2: "#000000",
};

const COLORS_IMAGE_DATA = {
  0: [46, 145, 58, 255],
  1: [255, 43, 35, 255],
  2: [0, 0, 0, 255],
};

export function drawCanvas(
  updated: STATE[][],
  squareSize: number,
  ctx: CanvasRenderingContext2D
) {
  for (let row = 0; row < updated.length; row++) {
    for (let col = 0; col < updated[0].length; col++) {
      ctx.fillStyle = COLORS[updated[row][col]];
      ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
    }
  }
}

export function drawCanvasUsingImageData(
  updated: STATE[][],
  _squareSize: number,
  canvasWidth: number,
  canvasHeight: number,
  ctx: CanvasRenderingContext2D
) {
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  for (let row = 0; row < updated.length; row++) {
    for (let col = 0; col < updated[0].length; col++) {
      const pixelStart = (row * imageData.width + col) * 4;
      const color = COLORS_IMAGE_DATA[updated[row][col]];
      for (let i = 0; i < color.length; i++) {
        data[pixelStart + i] = color[i];
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function drawCanvasUsingTexture(
  updated: STATE[][],
  gl: WebGL2RenderingContext
) {
  const program = buildProgram(gl);

  // prettier-ignore
  const positions = new Float32Array([
    -1, 1, // top left
    1, -1, // bottom right
    -1, -1, // bottom left
    1, 1, // top right
  ]);

  // prettier-ignore
  const indices = new Uint8Array([
    0, 1, 3, // first triangle
    1, 2, 0, // second triangle
  ]);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const vertexArray = gl.createVertexArray();
  gl.bindVertexArray(vertexArray);

  gl.vertexAttribPointer(
    0,
    2,
    gl.FLOAT,
    false,
    Float32Array.BYTES_PER_ELEMENT * 2,
    0
  );
  gl.enableVertexAttribArray(0);

  const elementArrayBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementArrayBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.useProgram(program);
  gl.bindVertexArray(vertexArray);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
}

function buildProgram(gl: WebGL2RenderingContext) {
  const vertShader = gl.createShader(gl.VERTEX_SHADER)!;
  const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  const program = gl.createProgram()!;

  const vertexShaderSource = `#version 300 es
    layout (location = 0) in vec2 a_position;
    // layout (location = 1) a_texcoord;
    
    // out vec2 v_texcoord;

    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      // v_texcoord = a_texcoord;  
    }`;

  const fragmentShaderSource = `#version 300 es
    precision mediump float;
    // in vec2 v_texcoord;

    out vec4 outColor;

    // uniform sampler2D u_texture;

    void main() {
      // vec4 color = texture(u_texture, v_texcoord);
      outColor = vec4(1.0, 0.0, 0.0, 1.0);
    }`;

  gl.shaderSource(vertShader, vertexShaderSource);
  gl.shaderSource(fragShader, fragmentShaderSource);

  gl.compileShader(vertShader);
  if (gl.getShaderParameter(vertShader, gl.COMPILE_STATUS) === false) {
    console.error(
      "Error compiling vertex shader:",
      gl.getShaderInfoLog(vertShader)
    );
  }

  gl.compileShader(fragShader);
  if (gl.getShaderParameter(fragShader, gl.COMPILE_STATUS) === false) {
    console.error(
      "Error compiling vertex shader:",
      gl.getShaderInfoLog(fragShader)
    );
  }

  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);

  gl.linkProgram(program);

  if (gl.getProgramParameter(program, gl.LINK_STATUS) === false) {
    console.error("Error linking program:", gl.getProgramInfoLog(program));
  }
  gl.deleteShader(vertShader);
  gl.deleteShader(fragShader);

  return program;
}
