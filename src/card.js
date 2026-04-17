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
    this.system = system;
    this.group = group;
    this.fsm = new StateMachine();
    this.fsm
      .add("idle", new IdleState(this))
      .add("drag", new DragState(this))
      .add("hover", new HoverState(this))
      .add("reset", new ResetState(this))
      .change("idle");

    /** @type {Sprite} */
    this.sprite;

    if (active) {
      this.sprite = new this.group.Sprite(getRandomCard(), x, y);
      this.sprite.physics = KINEMATIC;
    } else {
      this.sprite = new this.group.Sprite("back", x, y);
    }

    this.system.cardObj[this.sprite.idNum] = this;
    this.sprite.layer = 1;
  }

  setPos({ x, y }) {
    this.sprite.x = x;
    this.sprite.y = y;
  }

  update() {
    this.fsm.update();
  }
}

class CardState extends State {
  /** @param {CardObject} cardObj  */
  constructor(cardObj) {
    super(cardObj.fsm);
    this.card = cardObj;
  }
}

class IdleState extends CardState {
  update() {
    if (this.card.sprite.mouse.dragging()) this.fsm.change("drag");
    if (this.card.sprite.mouse.hovering()) this.fsm.change("hover");
  }
}

class HoverState extends CardState {
  update() {
    if (!this.card.sprite.mouse.hovering()) {
      this.fsm.change("idle");
      return;
    }
    if (this.card.sprite.mouse.dragging()) {
      this.fsm.change("drag");
      return;
    }

    this.card.sprite.x = this.clampedPull(this.startPos.x, mouse.x);
    this.card.sprite.y = this.clampedPull(this.startPos.y, mouse.y);
  }

  enter() {
    this.startPos = { x: this.card.sprite.x, y: this.card.sprite.y };
  }

  exit() {
    this.card.setPos(this.startPos);
  }

  clampedPull(from, to) {
    return from - clamp(from - to, -1, 1);
  }
}

class DragState extends CardState {
  update() {
    if (!this.card.sprite.mouse.dragging()) {
      this.fsm.change("reset", this.startPos);
    }
    this.card.sprite.moveTowards(mouse, 0.4);
  }

  enter() {
    this.card.sprite.layer++;
    this.startPos = { x: this.card.sprite.x, y: this.card.sprite.y };
  }

  exit() {
    this.card.sprite.layer--;
  }
}

class ResetState extends CardState {
  update() {
    this.card.sprite.moveTowards(this.startPos, 0.6);

    if (!this.card.sprite.isMoving) {
      this.fsm.change("idle");
      return;
    }
  }

  enter(startPos) {
    this.card.sprite.layer++;
    this.startPos = startPos;
  }

  exit() {
    this.card.sprite.layer--;
  }
}
