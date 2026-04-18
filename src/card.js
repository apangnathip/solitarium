class CardSystem {
  constructor() {
    cardSystem = this;
    this.cols = 7;
    this.rows = 4;
    this.group = new Group();
    this.spriteToCard = {};
    this.groupToStack = {};
    this.pool = createCardPool();
  }

  async init() {
    const atlas = await loadXML("./assets/cardsheet_atlas.xml");
    const spritesheet = await loadImage("./assets/cardsheet.png");
    this.group.addAnis(spritesheet, parseTextureAtlas(atlas));
  }

  getRandomCardFromPool() {
    return getRandomElement(this.pool, true)[0];
  }

  layTableau() {
    const py = CARD_HEIGHT / 2 + 5;
    const px = CARD_WIDTH / 2 + 5;
    for (let i = 0; i < this.cols; i++) {
      const x = map(i, 0, this.cols - 1, BOUNDS.nw.x + px, BOUNDS.se.x - px);
      let stack = new Stack(this, x, BOUNDS.nw.y + py);
      for (let j = 0; j < this.rows; j++) {
        if (!this.pool.length) return;
        const delay = (this.rows* i + j) / 100;
        stack.newCard(j === this.rows - 1).fsm.change("init", delay);
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
    this.value = system.getRandomCardFromPool();
    this.sprite = new stack.group.Sprite("back", x, y, DYNAMIC);
    this.sprite.layer = stack.size();
    this.sprite.overlaps(allSprites);
    this.id = this.sprite.idNum;
    this.system.spriteToCard[this.sprite.idNum] = this;
    this.fsm = new StateMachine();
    this.fsm
      .add("init", new InitState(this))
      .add("idle", new IdleState(this))
      .add("drag", new DragState(this))
      .add("hover", new HoverState(this))
      .add("reset", new ResetState(this))
      .add("follow", new FollowState(this))
      .add("flip", new FlipState(this));
  }

  isDragging = () => this.sprite.mouse.dragging();
  isHovering = () => this.sprite.mouse.hovering();
  isMoving = () => this.sprite.isMoving;
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

  isOnTop() {
    return this.id === this.stack.getTopCard().id;
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
    isActive ? this.faceUp++ : this.faceDown++;
    return new Card(this.system, this, x, y, isActive);
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
    return checkStackingLegality(card.value, this.getTopCard().value);
  }
}
