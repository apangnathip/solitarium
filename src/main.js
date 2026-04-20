async function setup() {
  await Canvas(350, 250);
  displayMode("center", "pixelated", 2);

  await AssetLoader.loadImage("bg", "background.png");
  await AssetLoader.loadImage("borders", "borders.png");
  await AssetLoader.loadSpritesheet("card", "cardsheet.png", "cardsheet.xml");

  allSprites.pixelPerfect = true;
  allSprites.physics = NONE;
  allSprites.autoDraw = false;
  allSprites.autoUpdate = false;
  world.autoStep = false;

  drawBorders();

  new CardSystem();
  cardSystem.layTableau();
}

function update() {
  gameUpdate();
}

function drawFrame() {
  background(AssetLoader.images.bg);
  allSprites.draw();
}

function drawBorders() {
  const borders = new Sprite(AssetLoader.images.borders);
  borders.layer = -1;
}

function gameUpdate() {
  cardSystem.update();
  allSprites.update();
  world.step();
}
