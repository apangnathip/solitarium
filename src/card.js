class CardSystem {
  constructor() {
    cardSystem = this;
    this.cols = 7;
    this.rows = 8;
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
    return popRandomElement(this.pool)[0];
  }

  layTableau() {
    const layout = [1, 2, 3, 4, 5, 6, 7];
    const pad = 5;
    const pl = pad + CARD_HW;
    const pt = pad + CARD_HH;

    const stackPos = (i) => {
      return floor(
        map(i, 0, this.cols - 1, BOUNDS.nw.x + pl, BOUNDS.se.x - pl),
      );
    };

    for (let i = 0; i < layout.length; i++) {
      const cascade = new Cascade(
        this,
        stackPos(i),
        BOUNDS.nw.y + pt + CARD_H + pad,
      );
      for (let j = 0; j < layout[i]; j++) {
        if (!this.pool.length) return;
        const delay = (this.rows * i + j) / 100;
        cascade.newCard().fsm.change("init", delay);
      }
    }

    let stockPos = { x: stackPos(0), y: BOUNDS.nw.y + pt };
    const stock = new Stock(this, stockPos.x, stockPos.y, {
      x: stackPos(1),
      y: stockPos.y,
    });

    while (true) {
      const [value] = popRandomElement(this.pool);
      if (!value) break;
      stock.newCard().fsm.change("init", 0.75, { x: stackPos(1), y: stock.y });
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

  isOnTop() {
    return this.id === this.stack.getTopCard().id;
  }
}
