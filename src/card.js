const CARD_WIDTH = 32;
const CARD_HEIGHT = 48;
const BOUNDS = { nw: { x: 6, y: 6 }, se: { x: 263, y: 243 } };

/** @type {CardSystem} */
let cardSystem;

class CardSystem {
  constructor() {
    cardSystem = this;
    this.cols = 7;
    this.rows = 4;
    this.group = new Group();
    this.group.physics = KINEMATIC;
    this.cards = [];
  }

  async init() {
    const atlas = await loadXML("./assets/cardsheet_atlas.xml");
    const spritesheet = await loadImage("./assets/cardsheet.png");
    this.group.addAnis(spritesheet, parseTextureAtlas(atlas));
  }

  layTableau() {
    const px = CARD_WIDTH / 2 + 5;
    const py = CARD_HEIGHT / 2 + 5;
    for (let i = 0; i < this.cols; i++) {
      let x = map(i, 0, this.cols - 1, BOUNDS.nw.x + px, BOUNDS.se.x - px);
      for (let j = 0; j < this.rows; j++) {
        const y = BOUNDS.nw.y + py + 6 * j;
        this.cards.push(new Card(this, x, y, j === this.rows - 1));
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
    this.sprite.moveTowards(this.startX, this.startY, 1);
    this.sprite.layer = this.layer;
  }
}

function getRandomCard() {
  const rs = ["2", "3", "4", "5", "6", "7", "8", "9", "0", "J", "Q", "K", "A"];
  const ss = ["H", "D", "C", "S"];
  const r = rs[Math.floor(Math.random() * rs.length)];
  const s = ss[Math.floor(Math.random() * ss.length)];
  return r + s;
}

