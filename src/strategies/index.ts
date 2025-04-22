import { StrategyStatic } from "../types";
import { DrawRectStrategy } from "./draw_rect";
import { ImageDataStrategy } from "./image_data";
import { WebGlStrategy } from "./webgl";
import { WebGLWithCPUSimulationStrategy } from "./webgl_with_cpu_simulation";

export const strategies = new Map<string, StrategyStatic>();

[
  DrawRectStrategy,
  ImageDataStrategy,
  WebGLWithCPUSimulationStrategy,
  WebGlStrategy,
].forEach((strategy) => {
  strategies.set(strategy.id, strategy);
});
