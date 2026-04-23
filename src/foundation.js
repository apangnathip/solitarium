class Foundation {
  constructor(system) {
    this.system = system;
    this.group = new Group();
    this.group.addAnis(...AssetLoader.spritesheets.card);
    this.slots = this.createSlots(4);
    this.cardCount = 0;
    this.inBounce = false;
  }

  reset() {
    this.cardCount = 0;
    this.inBounce = false;
    for (const slot of this.slots) {
      slot.reset();
    }
  }

  createSlots(num) {
    const slots = [];
    for (let i = 0; i < num; i++) {
      const x = this.system.mapStack(i + 3);
      const y = BOUNDS.nw.y + this.system.pt;
      slots.push(new Slot(this.system, x, y));
    }
    return slots;
  }

  add(card) {
    for (const slot of this.slots) {
      if (!slot.isLegalPush(card)) continue;
      card.stack.popTo(card);
      if (card.stack.type === "cascade") card.stack.flipTopCard();
      slot.push(card);
      card.stack = slot;
      card.fsm.change("reset", card.stack.getTopPos());
      slot.updateCardLayers();
      this.cardCount++;
      return true;
    }
    return false;
  }

  getSlottedCards() {
    const cards = [];
    for (const slot of this.slots) {
      for (const sprite of slot.group) {
        cards.push(this.system.getCardWrapper(sprite));
      }
    }
    return cards;
  }

  isInMovement() {
    for (const slot of this.slots) {
      if (slot.group.at(-1).isMoving) return true;
    }
    return false;
  }

  autoAdd(card) {
    for (const slot of this.slots) {
      if (!slot.isLegalPush(card)) continue;
      card.stack.popTo(card);
      card.stack = slot;
      slot.push(card);
      return true;
    }
    return false;
  }

  bounce(slotted, added) {
    let i = 0;

    for (const card of slotted) {
      const cardsLeft = this.system.maxPoolCount - i - 1;
      card.fsm.change("bounce", cardsLeft);
      i++;
    }

    for (const card of added) {
      const cardsLeft = this.system.maxPoolCount - i - 1;
      card.fsm
        .change("solve", card.stack.getTopPos(), i, cardsLeft)
        .onExit(() => this.cardCount++);
      i++;
    }
  }
}
