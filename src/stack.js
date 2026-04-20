class Stack {
  constructor(system, x, y) {
    this.system = system;
    this.group = new system.group.Group();
    this.system.groupToStack[this.group.idNum] = this;
    this.faceUpCount = 0;
    this.autoFlip = true;
    this.x = floor(x);
    this.y = floor(y);
  }

  overlapping(...args) {
    if (!this.group.length) return true;
    return this.group.overlapping(...args);
  }

  newCard() {}
  getTopPos() {}
  flipTopCard() {}
  update() {}

  isLegalPush(card) {
    return checkStackingLegality(card.value, this.getTopCard().value);
  }

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
    const popped = [];
    let cardSprite;
    while ((cardSprite = this.group.pop())) {
      popped.push(cardSprite);
      if (cardSprite.idNum === card.id) break;
    }
    this.faceUpCount -= popped.length;
    return popped;
  }

  flipTopCard(flipToPos) {
    if (!this.size()) return;
    const card = this.getTopCard();
    if (card.active) return;
    if (flipToPos) {
      card.fsm.change("flip", flipToPos);
    } else {
      card.fsm.change("flip");
    }
    this.faceUpCount++;
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
    if (!this.group.length) return { value: "00" };
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
}

class Cascade extends Stack {
  constructor(system, x, y) {
    super(system, x, y);
    this.type = "cascade";
    this.gap = 10;
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
}

class Stock extends Stack {
  constructor(system, x, y, drawnPos) {
    super(system, x, y);
    this.type = "stock";
    this.drawnPos = drawnPos;
    this.drawnSize = 0;
    this.redealButton = new Button(
      x,
      y,
      AssetLoader.images.redeal,
      this.redeal,
    );
  }

  newCard() {
    return new Card(this.system, this, this.x, this.y);
  }

  update() {
    this.redealButton.update();
  }

  flipTopCard() {
    super.flipTopCard(this.drawnPos);
  }

  getTopPos() {
    return this.drawnPos;
  }

  popTo(card) {
    this.drawnSize -= super.popTo(card).length;
  }

  pull() {
    const idx = this.group.length - (this.drawnSize + 1);
    const [card] = this.group.splice(idx, 1);
    this.group.push(card);
    this.drawnSize++;
    this.updateCardLayers();
  }

  redeal = () => {
    for (const [i, sprite] of this.group.entries()) {
      const card = this.system.getWrapper(sprite);
      card.fsm
        .change("flip", { x: this.x, y: this.y }, this.drawnPos, false)
        .onExit(() => {
          if (i === this.group.length - 1) {
            this.drawnSize = 0;
            this.group.reverse();
            this.updateCardLayers();
          }
        });
    }
  };
}

class Slot extends Stack {
  constructor(system, x, y) {
    super(system, x, y);
    this.type = "slot";
    this.sprite = new this.system.group.Sprite("blank", x, y);
    this.sprite.layer = 0;
  }

  overlapping(...args) {
    return this.sprite.overlapping(...args);
  }

  getTopPos() {
    return { x: this.x, y: this.y };
  }

  isLegalPush(card) {
    const targetValue = this.group.length
      ? this.system.getWrapper(this.group.at(-1)).value
      : "00";
    return checkFoundationLegality(card.value, targetValue);
  }
}
