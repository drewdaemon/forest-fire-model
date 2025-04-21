import { StrategyStatic } from "../types";
import { DrawRectStrategy } from "./draw_rect";
import { ImageDataStrategy } from "./image_data";

export const strategies = new Map<string, StrategyStatic>();

[DrawRectStrategy, ImageDataStrategy].forEach((strategy) => {
  strategies.set(strategy.id, strategy);
});
