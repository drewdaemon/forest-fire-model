import { performIntCycle } from "../simulation";
import { Strategy } from "../types";

export class WebGLWithCPUSimulationStrategy extends Strategy {
  static id = "webgl_with_cpu_simulation";
  static option = "WebGL with CPU simulation";
  static description =
    "Uses WebGL texture to paint but still runs the computation on the CPU.";

  private forest: Uint8Array;
  private temp: Uint8Array;
  private gl: WebGL2RenderingContext;
  private stopped = true;

  constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    super({ canvas });
    const gl = canvas.getContext("webgl2", {
      alpha: false,
    });

    if (!gl) {
      throw new Error("Failed to get WebGL2 context");
    }

    this.gl = gl;
    this.forest = new Uint8Array(canvas.width * canvas.height).fill(0);
    this.temp = new Uint8Array(canvas.width * canvas.height);
  }

  start() {
    this.stopped = false;

    const result = setup(this.gl, this.forest);

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    const cycle = () => {
      performIntCycle(this.forest, this.temp, this.gl.canvas.width);
      draw({ ...result, gl: this.gl, forest: this.forest });

      if (!this.stopped) {
        window.requestAnimationFrame(() => cycle());
      }
    };

    cycle();
  }

  stop() {
    // Stop the simulation
    this.stopped = true;
  }
}

function draw({
  gl,
  program,
  vertexArray,
  indices,
  forest,
}: {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vertexArray: WebGLVertexArrayObject;
  indices: Uint8Array;
  forest: Uint8Array;
}) {
  gl.useProgram(program);
  gl.bindVertexArray(vertexArray);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,
    0,
    0,
    gl.canvas.width,
    gl.canvas.height,
    gl.RED_INTEGER,
    gl.UNSIGNED_BYTE,
    forest
  );
}

function setup(gl: WebGL2RenderingContext, forest: Uint8Array) {
  const program = buildProgram(gl);

  // prettier-ignore
  const positions = new Float32Array([
  // position,    texcoord
    -1,  1,       0, 0,   // top left
    1,  1,        1, 0,   // top right
    -1, -1,       0, 1,   // bottom left
    1, -1,        1, 1    // bottom right
  ]);

  // prettier-ignore
  const indices = new Uint8Array([
    0, 2, 1, // first triangle (top left, bottom left, top right)
    1, 2, 3  // second triangle (top right, bottom left, bottom right)
  ]);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const vertexArray = gl.createVertexArray();
  gl.bindVertexArray(vertexArray);

  const stride = Float32Array.BYTES_PER_ELEMENT * 4;

  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(0);

  gl.vertexAttribPointer(
    1,
    2,
    gl.FLOAT,
    false,
    stride,
    Float32Array.BYTES_PER_ELEMENT * 2
  );
  gl.enableVertexAttribArray(1);

  const elementArrayBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementArrayBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.R8UI,
    gl.canvas.width,
    gl.canvas.height,
    0,
    gl.RED_INTEGER,
    gl.UNSIGNED_BYTE,
    forest
  );

  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    console.error("WebGL Error:", error);
  }

  return {
    texture: tex,
    program,
    vertexArray,
    indices,
  };
}

function buildProgram(gl: WebGL2RenderingContext) {
  const vertShader = gl.createShader(gl.VERTEX_SHADER)!;
  const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  const program = gl.createProgram()!;

  const vertexShaderSource = `#version 300 es
    layout (location = 0) in vec2 a_position;
    layout (location = 1) in vec2 a_texcoord;
    
    out vec2 v_texcoord;

    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texcoord = a_texcoord;  
    }`;

  const fragmentShaderSource = `#version 300 es
    precision mediump float;
    precision mediump usampler2D;

    in vec2 v_texcoord;

    out vec4 outColor;

    uniform usampler2D u_texture;

    void main() {
     uint texValue = texture(u_texture, v_texcoord).r;
     if (texValue == 0u) {
       outColor = vec4(0.0, 1.0, 0.0, 1.0);
     } else if (texValue == 1u) {
       outColor = vec4(1.0, 0.0, 0.0, 1.0);
     } else if (texValue == 2u) {
        outColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
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
