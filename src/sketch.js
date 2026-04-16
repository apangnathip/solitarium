let test1;
let test2;
let testGroup;

async function setup() {
  await Canvas(350, 250);
  displayMode("center", "pixelated", 2);

  allSprites.pixelPerfect = true;
  allSprites.physics = NONE;
  allSprites.autoDraw = false;
  allSprites.autoUpdate = false;
  world.autoStep = false;

  drawBorders();

  new CardSystem();
  await cardSystem.init();
  cardSystem.layTableau();
}

function update() {
  gameUpdate();
}

function drawFrame() {
  background("#180009");
  allSprites.draw();
}

function drawBorders() {
  const borders = new Sprite();
  borders.image = "./assets/borders.png";
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

function gameUpdate() {
  cardSystem.update();
  allSprites.update();
  world.step();
}
