export interface StrategyStatic {
  id: string;
  option: string;
  description: string;

  new (params: { canvas: HTMLCanvasElement }): Strategy;
}

export abstract class Strategy {
  constructor(_params: { canvas: HTMLCanvasElement }) {}

  abstract start(): void;
  abstract stop(): void;
}
