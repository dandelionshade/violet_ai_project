# Live2D Model Instructions

This directory is the designated location for your Live2D model files. 

The game is configured to automatically load a Live2D model if it finds the `.model3.json` file at the following path:
`/assets/live2d/violet/violet.model3.json`

## How to use your own Live2D model:

1. Create a folder named `violet` inside this `live2d` folder.
2. Place all your exported Live2D files (the `.moc3` file, the `.model3.json` file, the textures folder, and any `.motion3.json` or `.exp3.json` files) inside the `violet` folder.
3. **CRITICAL:** Ensure your main JSON file is named exactly `violet.model3.json`. If your file has a different name (e.g., `my_model.model3.json`), you must rename it to `violet.model3.json` or update the `ASSETS.live2dModel` path in `src/main.ts`.

## Fallback Mechanism
If the game cannot find the `violet.model3.json` file, it will gracefully fall back to using the static PNG images located in the `public/assets/images/` directory.

## Supported Emotions
The game attempts to trigger the following expressions/motions based on the AI's output:
- `smile`
- `sad`
- `surprised`
- `thoughtful`
- `crying`
- `neutral`

If your Live2D model uses different names for these expressions, you can modify the mapping logic in `src/core/Live2DManager.ts`.
