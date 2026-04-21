async function setup() {
  await Canvas(270, 250);
  displayMode("center", "pixelated", 3);

  trailBuffer = createGraphics(270, 250);
  trailBuffer.clear();

  await AssetLoader.loadImage("bg", "bordered_background.png");
  await AssetLoader.loadImage("borders", "borders.png");
  await AssetLoader.loadImage("redeal", "redeal.png");
  await AssetLoader.loadImage("blank", "blank.png");
  await AssetLoader.loadSpritesheet("card", "cardsheet.png", "cardsheet.xml");

  await AssetLoader.loadSound("tap", "card.mp3");
  await AssetLoader.loadSound("flip", "flip.mp3", 0.5);
  await AssetLoader.loadSound("pop", "pop.mp3", 0.5);

  allSprites.pixelPerfect = true;
  allSprites.physics = NONE;
  allSprites.autoDraw = false;
  allSprites.autoUpdate = false;
  world.autoStep = false;

  new CardSystem();
  cardSystem.layTableau();
}

function update() {
  gameUpdate();
}

function draw() {
  background(AssetLoader.images.bg);
  image(trailBuffer, 0, 0);
  allSprites.draw();
}

function gameUpdate() {
  mouse.cursor = "default";
  cardSystem.update();
  allSprites.update();
  world.step();
}
