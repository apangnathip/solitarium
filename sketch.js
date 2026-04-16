let cardXML;
let cardImg;
let borderXML;
let borderImg;

/** @type {CardSystem} */
let cardSystem;

const CARD_WIDTH = 32;
const CARD_HEIGHT = 48;

function preload() {
  new Canvas(350, 250);
  displayMode("center", "pixelated", 2);
  allSprites.pixelPerfect = true;

  cardXML = loadXML("./assets/cardsheet_atlas.xml");
  cardImg = loadImage("./assets/cardsheet.png");
}

function setup() {
  drawBorders();

  cardSystem = new CardSystem(cardImg, cardXML);
  cardSystem.layTableau();
}

function update() {
  background("#180009");

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
}

function drawBorders() {
  const borders = new Sprite();
  borders.physics = NONE;
  borders.image = "./assets/borders.png";
}

class CardSystem {
  constructor(spritesheet, atlasXML) {
    this.gap = { x: 4, y: 6 };
    this.padding = { left: CARD_WIDTH / 2 + 11, top: CARD_HEIGHT / 2 + 11 };
    this.colCount = 7;
    this.rowCount = 4;
    this.group = new Group();
    this.group.addAnis(spritesheet, parseTextureAtlas(atlasXML));
    this.group.physics = KINEMATIC;
    this.cards = [];
  }

  layTableau() {
    for (let i = 0; i < this.colCount; i++) {
      for (let j = 0; j < this.rowCount; j++) {
        const x = this.padding.left + (CARD_WIDTH + this.gap.x) * i;
        const y = this.padding.top + this.gap.y * j;
        this.cards.push(new Card(this, x, y, j === this.rowCount - 1));
      }
    }
  }
}

class Card {
  constructor(system, x, y, active = false) {
    this.width = CARD_WIDTH;
    this.height = CARD_HEIGHT;
    this.system = system;
    this.active = active;
    this.startX = x;
    this.startY = y;

    if (active) {
      this.sprite = new system.group.Sprite(getRandomCard(), x, y);
      this.layer = 2;
    } else {
      this.sprite = new system.group.Sprite(x, y);
      this.layer = 1;
    }

    this.sprite.layer = this.layer;
  }

  reset() {
    this.sprite.layer = this.layer;
    this.sprite.moveTowards(this.startX, this.startY, 1);
  }
}

function getRandomCard() {
  const rs = ["2", "3", "4", "5", "6", "7", "8", "9", "0", "J", "Q", "K", "A"];
  const ss = ["H", "D", "C", "S"];
  const r = rs[Math.floor(Math.random() * rs.length)];
  const s = ss[Math.floor(Math.random() * ss.length)];
  return r + s;
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}
