import { COLORS } from "../colors";
import { Strategy } from "../types";

export class WebGlStrategy extends Strategy {
  static id = "webgl";
  static option = "Pure WebGL";
  static description =
    "Uses WebGL texture to paint and runs simulation in the fragment shaders.";

  private forest: Uint8Array;
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
  }

  start() {
    this.stopped = false;

    const {
      renderingProgram,
      simulationProgram,
      indices,
      frameBuffer,
      textureA,
      textureB,
    } = setup(this.gl, this.forest);

    let [currentTexture, nextTexture] = [textureA, textureB];

    this.gl.clearColor(0, 0, 0, 1);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    const MIN_CYCLE_TIME = 0;

    let lastSecond = performance.now();
    const cycle = () => {
      const now = performance.now();
      if (now - lastSecond < MIN_CYCLE_TIME) {
        requestAnimationFrame(() => cycle());
        return;
      }
      lastSecond = now;

      // simulation
      this.gl.useProgram(simulationProgram);

      this.gl.uniform1f(
        this.gl.getUniformLocation(simulationProgram, "u_time"),
        performance.now() / 1000
      );

      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, currentTexture);
      this.gl.uniform1i(
        this.gl.getUniformLocation(simulationProgram, "u_forest"),
        0
      );

      // set up the next texture to receive the output of the simulation
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        nextTexture,
        0
      );

      const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
      if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
        console.error("Framebuffer is incomplete:", status);
      }

      // set up the simulation
      this.gl.bindTexture(this.gl.TEXTURE_2D, currentTexture);
      this.gl.uniform2f(
        this.gl.getUniformLocation(simulationProgram, "u_resolution"),
        this.gl.canvas.width,
        this.gl.canvas.height
      );
      this.gl.drawElements(
        this.gl.TRIANGLES,
        indices.length,
        this.gl.UNSIGNED_BYTE,
        0
      );

      // rendering
      this.gl.useProgram(renderingProgram);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.gl.bindTexture(this.gl.TEXTURE_2D, nextTexture);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.drawElements(
        this.gl.TRIANGLES,
        indices.length,
        this.gl.UNSIGNED_BYTE,
        0
      );

      // swap the textures
      [currentTexture, nextTexture] = [nextTexture, currentTexture];

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

function setup(gl: WebGL2RenderingContext, forest: Uint8Array) {
  const renderingProgram = buildRenderingProgram(gl);
  const simulationProgram = buildSimulationProgram(gl);

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

  // By default, textures are expected to be 4-byte aligned. We need to set it to 1 byte,
  // because we are using 1-byte textures.
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

  function createSimulationTexture() {
    const tex = gl.createTexture();
    if (!tex) {
      throw new Error("Failed to create texture");
    }
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
    return tex;
  }

  const textureA = createSimulationTexture();
  const textureB = createSimulationTexture();

  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    console.error("WebGL Error:", error);
  }

  // upload palette
  gl.useProgram(renderingProgram);
  const paletteLoc = gl.getUniformLocation(renderingProgram, "u_palette");
  const palette = new Float32Array(
    Object.values(COLORS)
      .map((color) => color.map((c) => c / 255))
      .flat()
  );
  gl.uniform4fv(paletteLoc, palette);

  const frameBuffer = gl.createFramebuffer();

  return {
    textureA,
    textureB,
    renderingProgram,
    simulationProgram,
    vertexArray,
    indices,
    frameBuffer,
  };
}

function buildSimulationProgram(gl: WebGL2RenderingContext) {
  const vertexShaderSource = `#version 300 es
    layout (location = 0) in vec2 a_position;
    layout (location = 1) in vec2 a_texcoord;

    out vec2 v_texcoord;

    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texcoord = vec2(a_texcoord.x, 1.0 - a_texcoord.y);
    }`;

  const fragmentShaderSource = `#version 300 es
    precision mediump float;
    precision mediump usampler2D;

    in vec2 v_texcoord;

    out uint outState;

    uniform usampler2D u_forest;
    uniform float u_time;
    uniform vec2 u_resolution;

    uint getState(vec2 offset) {
      vec2 coord = v_texcoord + offset / u_resolution;
      return texture(u_forest, coord).r;
    }
    
    // Hash-based pseudorandom number generator with time-based seed
    float random(vec2 st, float seed) {
        return abs(fract(sin(dot(st.xy + seed, vec2(12.9898, 78.233))) * 43758.5453123));
    }

    void main() {
      uint state = texture(u_forest, v_texcoord).r;

      // Generate a pseudorandom value based on the current fragment's coordinates and time
      float randVal = random(v_texcoord * u_resolution, u_time);

      if (state == 0u) { 
        if (
          getState(vec2(-1.0, -1.0)) == 1u ||
          getState(vec2( 0.0, -1.0)) == 1u ||
          getState(vec2( 1.0, -1.0)) == 1u ||
          getState(vec2(-1.0,  0.0)) == 1u ||
          getState(vec2( 1.0,  0.0)) == 1u ||
          getState(vec2(-1.0,  1.0)) == 1u ||
          getState(vec2( 0.0,  1.0)) == 1u ||
          getState(vec2( 1.0,  1.0)) == 1u ||
          randVal < 0.00001
        ) {
          outState = 1u; // BURNING
        } else {
          outState = 0u; // TREE
        }
      } else if (state == 1u) { // BURNING
        outState = 2u; // EMPTY
      } else if (state == 2u) { // EMPTY
        if (randVal < 0.02) {
          outState = 0u; // TREE
        } else {
          outState = 2u; // EMPTY
        }
      }
    }`;

  return buildProgram(gl, vertexShaderSource, fragmentShaderSource);
}

function buildRenderingProgram(gl: WebGL2RenderingContext) {
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
  uniform vec4 u_palette[3];

  void main() {
   uint texValue = texture(u_texture, v_texcoord).r;
   outColor = u_palette[texValue];
  }`;

  return buildProgram(gl, vertexShaderSource, fragmentShaderSource);
}

function buildProgram(
  gl: WebGL2RenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string
) {
  const vertShader = gl.createShader(gl.VERTEX_SHADER)!;
  const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  const program = gl.createProgram()!;

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
