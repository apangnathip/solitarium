class Stack {
  constructor(system, x, y) {
    this.system = system;
    this.group = new system.group.Group();
    this.x = floor(x);
    this.y = floor(y);
  }

  isOverlapping = (...args) => this.group.overlapping(...args);

  newCard() {}
  getTopPos() {}
  flipTopCard() {}

  size() {
    return this.group.length;
  }

  pop() {
    let card = this.group.pop();
    if (!card) return;
    this.faceUpCount--;
    return card;
  }

  popTo(card) {
    let cardSprite;
    while ((cardSprite = this.group.pop())) {
      this.faceUpCount--;
      if (cardSprite.idNum === card.id) return;
    }
  }

  push(...cards) {
    for (const card of cards) {
      this.group.push(card.sprite);
      this.faceUpCount++;
    }
  }

  getFaceDownCount() {
    return this.size() - this.faceUpCount;
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

  isLegalPush(card) {
    return checkStackingLegality(card.value, this.getTopCard().value);
  }
}

class Cascade extends Stack {
  constructor(system, x, y) {
    super(system, x, y);
    this.system.groupToStack[this.group.idNum] = this;
    this.faceUpCount = 0;
    this.gap = 14;
    this.backGap = 3;
  }

  newCard() {
    const { x, y } = this.getTopPos();
    return new Card(this.system, this, x, y);
  }

  getTopPos(faceUpOffset = 0, faceDownOffset = 0) {
    return {
      x: this.x,
      y:
        this.y +
        this.backGap * (this.getFaceDownCount() + faceDownOffset) +
        this.gap * (this.faceUpCount + faceUpOffset),
    };
  }

  flipTopCard() {
    if (!this.size()) return;
    const card = this.getTopCard();
    if (card.active) return;
    card.fsm.change("flip");
    this.faceUpCount++;
  }
}

class Stock extends Stack {
  constructor(system, x, y, drawnPos) {
    super(system, x, y);
    this.drawnPos = drawnPos;
  }

  newCard() {
    return new Card(this.system, this, this.x, this.y);
  }

  flipTopCard() {
    if (!this.size()) return;
    const card = this.getTopCard();
    if (card.active) return;
    card.fsm.change("flip", this.drawnPos);
    this.faceUpCount++;
  }

  getTopPos() {
    return this.drawnPos;
  }
}
