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
  background("#180009");
  game();
}

function drawBorders() {
  const borders = new Sprite();
  borders.physics = NONE;
  borders.image = "./assets/borders.png";
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

function game() {
  for (const card of cardSystem.cards) {
    if (!card.active) continue;
    if (card.sprite.mouse.dragging()) {
      card.sprite.layer = 3;
      card.sprite.moveTowards(mouse, 0.4);
    } else if (card.sprite.mouse.hovering()) {
      card.sprite.x = card.startX - clamp(card.startX - mouse.x, -1, 1);
      card.sprite.y = card.startY - clamp(card.startY - mouse.y, -1, 1);
    } else {
      card.reset();
    }
  }

  allSprites.update();
  allSprites.draw();
  world.step();
}
