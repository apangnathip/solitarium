class Foundation {
  constructor(system) {
    this.system = system;
    this.group = new Group();
    this.group.addAnis(...AssetLoader.spritesheets.card);
    this.slots = this.createSlots(4);
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
      card.stack.flipTopCard();
      slot.push(card);
      card.stack = slot;
      card.fsm.change("reset", card.stack.getTopPos());
      slot.updateCardLayers();
      return;
    }
  }
}
