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
    this.spriteToCard = {};
    this.groupToStack = {};
  }

  async init() {
    const atlas = await loadXML("./assets/cardsheet_atlas.xml");
    const spritesheet = await loadImage("./assets/cardsheet.png");
    this.group.addAnis(spritesheet, parseTextureAtlas(atlas));
  }

  layTableau() {
    const py = CARD_HEIGHT / 2 + 5;
    const px = CARD_WIDTH / 2 + 5;
    for (let i = 0; i < this.cols; i++) {
      const x = map(i, 0, this.cols - 1, BOUNDS.nw.x + px, BOUNDS.se.x - px);
      let stack = new Stack(this, x, BOUNDS.nw.y + py);
      for (let j = 0; j < this.rows; j++) {
        stack.newCard(j === this.rows - 1);
      }
    }
  }

  /** @returns {Card} */
  getWrapper(cardSprite) {
    return this.spriteToCard[cardSprite.idNum];
  }

  update() {
    for (const sprite of this.group) {
      cardSystem.getWrapper(sprite).update();
    }
  }
}

class Card {
  constructor(system, stack, x, y, active = false) {
    this.system = system;
    this.stack = stack;
    this.active = active;
    this.value = getRandomCard();
    this.sprite = new stack.group.Sprite(
      active ? this.value : "back",
      x,
      y,
      DYNAMIC,
    );
    this.sprite.layer = stack.size();
    this.sprite.overlaps(allSprites);
    this.id = this.sprite.idNum;
    this.system.spriteToCard[this.sprite.idNum] = this;
    this.fsm = new StateMachine();
    this.fsm
      .add("idle", new IdleState(this))
      .add("drag", new DragState(this))
      .add("hover", new HoverState(this))
      .add("reset", new ResetState(this))
      .add("follow", new FollowState(this))
      .add("flip", new FlipState(this))
      .change("idle");
  }

  isDragging = () => this.sprite.mouse.dragging();
  isHovering = () => this.sprite.mouse.hovering();
  moveTowards = (...args) => this.sprite.moveTowards(...args);

  update() {
    this.fsm.update();
  }

  putOnTop(addon = 0) {
    this.sprite.layer += 1000 + addon;
  }

  layer() {
    return this.sprite.layer;
  }

  setLayer(layer) {
    this.sprite.layer = layer;
  }

  getPos() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  setPos({ x, y }) {
    this.sprite.x = x;
    this.sprite.y = y;
  }

  splitStack() {
    const sprites = this.stack.splitAt(this);
    return sprites.map((sprite) => this.system.getWrapper(sprite));
  }

  flipUp() {
    this.fsm.change("flip");
  }
}

class Stack {
  constructor(system, x, y) {
    this.system = system;
    this.group = new system.group.Group();
    this.system.groupToStack[this.group.idNum] = this;
    this.x = x;
    this.y = y;
    this.faceUp = 0;
    this.faceDown = 0;
    this.gap = 9;
    this.backGap = 4;
  }

  isOverlapping = (...args) => this.group.overlapping(...args);

  newCard(isActive) {
    const { x, y } = this.getTopPos();
    new Card(this.system, this, x, y, isActive);
    isActive ? this.faceUp++ : this.faceDown++;
  }

  size() {
    return this.faceDown + this.faceUp;
  }

  pop() {
    let card = this.group.pop();
    if (!card) return;
    this.faceUp--;
    return card;
  }

  popTo(card) {
    let cardSprite;
    while ((cardSprite = this.group.pop())) {
      this.faceUp--;
      if (cardSprite.idNum === card.id) return;
    }
  }

  push(...cards) {
    for (const card of cards) {
      this.group.push(card.sprite);
      this.faceUp++;
    }
  }

  getTopPos(ignoreTop = 0) {
    return {
      x: this.x,
      y:
        this.y +
        this.gap * (this.faceUp - ignoreTop) +
        this.backGap * this.faceDown,
    };
  }

  getTopCard() {
    return this.system.getWrapper(this.group.at(-1));
  }

  splitAt(card) {
    return this.group.slice(this.getCardIdx(card));
  }

  getCardIdx(card) {
    return this.group.findIndex(({ idNum }) => card.id === idNum);
  }

  updateCardLayers() {
    for (const [i, sprite] of this.group.entries()) {
      sprite.layer = i + 1;
    }
  }

  flipTopCard() {
    if (this.faceUp || !this.size()) return;
    this.getTopCard().flipUp();
    this.faceUp++;
    this.faceDown--;
  }

  isLegalPush(card) {
    return checkStackLegality(card.value, this.getTopCard().value);
  }
}

class CardState extends State {
  /** @param {Card} card  */
  constructor(card) {
    super(card.fsm);
    this.card = card;
    this.system = card.system;
  }
}

class IdleState extends CardState {
  update() {
    if (!this.card.active) return;
    if (this.card.isDragging()) this.fsm.change("drag");
    if (this.card.isHovering()) this.fsm.change("hover");
  }
}

class HoverState extends CardState {
  update() {
    if (!this.card.isHovering()) {
      this.fsm.change("idle");
      return;
    }
    if (this.card.isDragging()) {
      this.fsm.change("drag");
      return;
    }

    this.card.setPos({
      x: this.clampedPull(this.startPos.x, mouse.x),
      y: this.clampedPull(this.startPos.y, mouse.y),
    });
  }

  enter() {
    this.startPos = { x: this.card.sprite.x, y: this.card.sprite.y };
  }

  exit() {
    this.card.sprite.moveTo(this.startPos);
  }

  clampedPull(from, to) {
    return from - clamp(from - to, -1, 1);
  }
}

class DragState extends CardState {
  update() {
    if (!this.card.isDragging()) {
      this.changeStack();
      return;
    }
    this.detectStackHover();
    this.dragCards();
  }

  dragCards() {
    this.cards.forEach((card, i) => {
      if (card === this.card) {
        card.moveTowards(vecSub(this.grabOffset, mouse), 1);
        return;
      }
      card.fsm.change(
        "follow",
        {
          x: this.grabOffset.x,
          y: this.grabOffset.y,
        },
        i,
      );
    });
  }

  detectStackHover() {
    for (const key in this.system.groupToStack) {
      const stack = this.system.groupToStack[key];
      const isClose = Math.abs(this.card.getPos().x - stack.x) < CARD_WIDTH / 2;
      if (stack.isOverlapping(this.card.sprite) && isClose) {
        this.newStack = stack;
      }
    }
  }

  changeStack() {
    if (!this.newStack.isLegalPush(this.card)) {
      this.newStack = this.oldStack;
    }
    if (this.newStack !== this.card.stack) {
      this.card.stack.popTo(this.card);
      this.newStack.push(...this.cards);
    }
    this.cards.forEach((card, i) => {
      card.stack = this.newStack;
      card.fsm.change("reset", this.newStack.getTopPos(this.cards.length - i));
    });
  }

  enter() {
    this.oldStack = this.card.stack;
    this.newStack = this.card.stack;
    this.grabOffset = vecSub(this.card.getPos(), mouse);
    this.cards = this.card.splitStack();
    for (const card of this.cards) card.putOnTop();
  }

  exit() {
    this.newStack.updateCardLayers();
    this.oldStack.flipTopCard();
  }
}

class ResetState extends CardState {
  update() {
    this.card.moveTowards(this.startPos, 0.5);

    if (!this.card.sprite.isMoving) {
      this.fsm.change("idle");
      return;
    }
  }

  enter(startPos) {
    this.startPos = startPos;
  }
}

class FollowState extends CardState {
  update() {
    this.card.moveTowards(vecSub(this.offset, mouse), 1 / (this.idx + 1));
  }

  enter(offset, idx) {
    this.idx = idx;
    this.offset = offset;
    this.offset.y -= this.card.stack.gap * idx;
  }
}

class FlipState extends CardState {
  update() {
    this.card.sprite.scale.x -= this.speed * (deltaTime / 1000);

    if (this.card.sprite.scale.x < 0) {
      this.card.sprite.scale.x = 0;
      this.card.sprite.changeAni(this.card.value);
      this.speed *= -1;
    }

    if (this.card.sprite.scale.x >= 1) {
      this.card.sprite.scale.x = 1;
      this.card.fsm.change("idle");
      this.card.active = true;
    }
  }

  enter() {
    this.speed = 20;
  }
}
