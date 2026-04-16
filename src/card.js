const CARD_WIDTH = 32;
const CARD_HEIGHT = 48;
const BOUNDS = { nw: { x: 6, y: 6 }, se: { x: 263, y: 243 } };
const LAYER_BG = 1;
const LAYER_MG = 2;
const LAYER_FG = 3;

/** @type {CardSystem} */
let cardSystem;

class CardSystem {
  constructor() {
    cardSystem = this;
    this.cols = 7;
    this.rows = 4;
    this.group = new Group();
    this.cardObj = {};
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
      let stack = new this.group.Group();
      let x = map(i, 0, this.cols - 1, BOUNDS.nw.x + px, BOUNDS.se.x - px);
      for (let j = 0; j < this.rows; j++) {
        const y = BOUNDS.nw.y + py + 6 * j;
        new CardObject(this, stack, x, y, j === this.rows - 1);
      }
    }
  }

  /** @returns {CardObject} */
  getObj(card) {
    return this.cardObj[card.idNum];
  }

  update() {
    for (const sprite of this.group) {
      cardSystem.getObj(sprite).update();
    }
  }
}

class CardObject {
  constructor(system, group, x, y, active = false) {
    this.width = CARD_WIDTH;
    this.height = CARD_HEIGHT;
    this.system = system;
    this.group = group;
    this.start = { x, y };
    this.next = { x, y };
    this.state = active ? "idle" : "inactive";

    /** @type {Sprite} */
    this.sprite;

    if (active) {
      this.sprite = new this.group.Sprite(getRandomCard(), x, y);
      this.sprite.physics = KINEMATIC;
      // this.layer = 2;
    } else {
      this.sprite = new this.group.Sprite("back", x, y);
      // this.layer = 1;
    }

    // this.sprite.layer = this.layer;
    this.system.cardObj[this.sprite.idNum] = this;
    this.setLayer(LAYER_BG);
  }

  resetPos(percentage = 1) {
    this.sprite.moveTowards(this.start.x, this.start.y, percentage);
  }

  setLayer(layer) {
    this.sprite.layer = layer;
  }

  updatePos() {
    this.start = { ...this.next };
  }

  setState(state) {
    this.state = state;
  }

  update() {
    switch (this.state) {
      case "idle":
        if (this.sprite.mouse.dragging()) {
          this.setState("dragging");
          break;
        }
        if (this.sprite.mouse.hovering()) {
          this.setState("hovering");
          break;
        }
        this.resetPos();
        break;

      case "hovering":
        if (!this.sprite.mouse.hovering()) {
          this.setState("idle");
          break;
        }
        if (this.sprite.mouse.dragging()) {
          this.setState("dragging");
          break;
        }
        this.sprite.x = this.start.x - clamp(this.start.x - mouse.x, -1, 1);
        this.sprite.y = this.start.y - clamp(this.start.y - mouse.y, -1, 1);
        break;

      case "dragging":
        if (!this.sprite.mouse.dragging()) {
          this.setState("reset");
          break;
        }
        this.setLayer(LAYER_FG);
        this.sprite.moveTowards(mouse, 0.4);
        break;

      case "reset":
        if (!this.sprite.isMoving) {
          this.setLayer(LAYER_BG);
          this.setState("idle");
          break;
        }
        this.resetPos(0.6);
        this.setLayer(LAYER_MG);
        break;
    }
  }
}

function getRandomCard() {
  const rs = ["2", "3", "4", "5", "6", "7", "8", "9", "0", "J", "Q", "K", "A"];
  const ss = ["H", "D", "C", "S"];
  const r = rs[Math.floor(Math.random() * rs.length)];
  const s = ss[Math.floor(Math.random() * ss.length)];
  return r + s;
}
