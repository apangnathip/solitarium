class CardSystem {
  constructor() {
    cardSystem = this;
    this.cols = 7;
    this.rows = 8;
    this.group = new Group();
    this.group.addAnis(...AssetLoader.spritesheets.card);
    this.spriteToCard = {};
    this.groupToStack = {};
    this.strictStacking = true;
    this.pool = createCardPool();
    this.pad = 5;
    this.pl = this.pad + CARD_HW;
    this.pt = this.pad + CARD_HH;
    this.foundation = new Foundation(this);
  }

  getRandomCardFromPool() {
    return popRandomElement(this.pool)[0];
  }

  mapStack(i) {
    return floor(
      map(i, 0, this.cols - 1, BOUNDS.nw.x + this.pl, BOUNDS.se.x - this.pl),
    );
  }

  layTableau() {
    const layout = [1, 2, 3, 4, 5, 6, 7];

    for (let i = 0; i < layout.length; i++) {
      const cascade = new Cascade(
        this,
        this.mapStack(i),
        BOUNDS.nw.y + this.pt + CARD_H + this.pad,
      );
      for (let j = 0; j < layout[i]; j++) {
        if (!this.pool.length) return;
        const delay = (layout[i] * i + j) / 100;
        cascade.newCard().fsm.change("init", delay);
      }
    }

    let stockPos = { x: this.mapStack(0), y: BOUNDS.nw.y + this.pt };
    const stock = new Stock(this, stockPos.x, stockPos.y, {
      x: this.mapStack(1),
      y: stockPos.y,
    });
    stock.autoFlip = false;

    let i = 0;
    while (this.pool.length) {
      stock
        .newCard()
        .fsm.change("init", 0.5 + i / 40, { x: this.mapStack(1), y: stock.y });
      i++;
    }
  }

  /** @returns {Card} */
  getWrapper(cardSprite) {
    return this.spriteToCard[cardSprite.idNum];
  }

  update() {
    for (const [_, card] of Object.entries(this.spriteToCard)) {
      card.update();
    }

    for (const [_, stack] of Object.entries(this.groupToStack)) {
      stack.update();
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
      .add("flip", new FlipState(this))
      .add("select", new SelectState(this));
  }

  pressed = (inp) => this.sprite.mouse.pressed(inp);
  presses = (inp) => this.sprite.mouse.presses(inp);
  pressing = (inp) => this.sprite.mouse.pressing(inp);
  hovering = () => this.sprite.mouse.hovering();
  moving = () => this.sprite.isMoving;
  moveTowards = (...args) => this.sprite.moveTowards(...args);
  dragging = () => mouse.pressing("left") && this.sprite.mouse.dragging();

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
