import raylib from 'raylib'

async function main() {
  raylib.SetConfigFlags(raylib.FLAG_FULLSCREEN_MODE | raylib.FLAG_WINDOW_RESIZABLE | raylib.FLAG_VSYNC_HINT);
  raylib.SetWindowSize(1600, 900);
  raylib.InitWindow(1600, 900, 'LIZ-GUI-PKM');

  const framebuffer = raylib.LoadRenderTexture(1600, 900);

  while (!raylib.WindowShouldClose()) {
    raylib.BeginTextureMode(framebuffer);
    drawEverything();
    raylib.EndTextureMode();

    raylib.BeginDrawing();
    raylib.ClearBackground(raylib.RAYWHITE);
    raylib.DrawTexture(framebuffer.texture, 0, 0, raylib.WHITE);
    raylib.EndDrawing();
  }

  raylib.UnloadRenderTexture(framebuffer);
  raylib.CloseWindow();
}

function drawEverything() {
  // Draw a red rectangle
  raylib.DrawRectangle(100, 100, 200, 150, raylib.RED);

  // Draw a blue circle
  raylib.DrawCircle(400, 200, 100, raylib.BLUE);

  // Draw a green line
  raylib.DrawLine(100, 100, 300, 250, raylib.GREEN);

  // Draw a yellow triangle
  raylib.DrawTriangle({ x: 500, y: 100 }, { x: 600, y: 100 }, { x: 550, y: 200 }, raylib.YELLOW);

  // Draw text
  raylib.DrawText('Hello, raylib!', 700, 200, 20, raylib.BLACK);

  // Draw an ellipse
  raylib.DrawEllipse(850, 300, 100, 150, raylib.VIOLET);

  // Draw a purple rectangle with rounded edges
  raylib.DrawRectangleRounded({ x: 1000, y: 100, width: 200, height: 100 }, 0.3, 10, raylib.PURPLE);

  // Draw a polygon
  raylib.DrawPoly({ x: 1200, y: 200 }, 6, 80, 0, raylib.ORANGE);
}

main();

