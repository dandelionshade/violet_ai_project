import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';

// Expose PIXI to window so pixi-live2d-display can find it
(window as any).PIXI = PIXI;

export class Live2DManager {
  private app: PIXI.Application;
  private model: Live2DModel | null = null;
  private canvas: HTMLCanvasElement;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    
    // Initialize Pixi Application
    this.app = new PIXI.Application({
      view: this.canvas,
      transparent: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      resizeTo: this.canvas.parentElement as HTMLElement,
    });
  }

  /**
   * Loads a Live2D model from the given URL.
   * Returns true if successful, false otherwise.
   */
  async loadModel(modelUrl: string): Promise<boolean> {
    try {
      // Check if the URL is reachable before trying to load it with Live2DModel
      const response = await fetch(modelUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.log(`Live2D model not found at ${modelUrl}. Falling back to static sprites.`);
        return false;
      }

      this.model = await Live2DModel.from(modelUrl);
      this.app.stage.addChild(this.model);
      
      // Basic positioning - anchor to bottom center
      this.model.anchor.set(0.5, 1); 
      
      this.onResize();

      // Handle window resize
      window.addEventListener('resize', () => this.onResize());
      
      return true;
    } catch (error) {
      console.error("Failed to load Live2D model:", error);
      return false;
    }
  }

  private onResize() {
    if (!this.model) return;
    
    // Position at the bottom center of the canvas
    this.model.x = this.app.screen.width / 2;
    // Move further down to prevent head cutoff
    this.model.y = this.app.screen.height + 180;
    
    // Scale to fit height (adjusted for better framing)
    const scale = this.app.screen.height / this.model.internalModel.originalHeight;
    this.model.scale.set(scale * 1.15);
  }

  /**
   * Maps string emotions to Live2D expressions and motions.
   */
  setEmotion(emotion: string) {
    if (!this.model) return;

    // Note: The exact expression and motion names depend entirely on how the 
    // Live2D model was rigged and exported. These are mapped to the Haru test model.
    try {
      // Priority 2 (FORCE) ensures the motion plays immediately, interrupting others
      const PRIORITY_FORCE = 2;

      switch (emotion) {
        case 'smile':
          this.model.expression('f01'); // Haru smile
          this.model.motion('TapBody', 0, PRIORITY_FORCE); // Gentle/happy motion
          break;
        case 'sad':
          this.model.expression('f02'); // Haru sad
          this.model.motion('PinchIn', 0, PRIORITY_FORCE); // Withdrawn motion
          break;
        case 'surprised':
          this.model.expression('f04'); // Haru surprised
          this.model.motion('FlickHead', 0, PRIORITY_FORCE); // Startled motion
          break;
        case 'thoughtful':
          this.model.expression('f05'); // Haru thoughtful
          this.model.motion('TapHead', 0, PRIORITY_FORCE); // Thinking motion
          break;
        case 'crying':
          this.model.expression('f06'); // Haru crying
          this.model.motion('Shake', 0, PRIORITY_FORCE); // Distressed motion
          break;
        case 'neutral':
        default:
          this.model.expression('f00'); // Haru neutral
          this.model.motion('Idle', 0, PRIORITY_FORCE); // Return to idle
          break;
      }
    } catch (e) {
      console.warn(`Emotion/Motion mapping for '${emotion}' failed.`, e);
    }
  }

  destroy() {
    if (this.model) {
      this.model.destroy();
      this.model = null;
    }
    if (this.app) {
      this.app.destroy(false, { children: true, texture: true, baseTexture: true });
      (this.app as any) = null;
    }
  }
}
