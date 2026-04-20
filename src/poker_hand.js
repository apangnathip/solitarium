class PokerHand {
  constructor(system) {
    this.system = system;
    this.group = new Group();
    this.group.addAnis(...AssetLoader.spritesheets.card);
    this.slots = this.createSlots(5);
  }

  createSlots(num) {
    const slots = [];
    for (let i = 0; i < num; i++) {
      const x = this.system.mapStack(i + 2);
      const y = BOUNDS.nw.y + this.system.pt;
      const slot = new this.system.group.Sprite("blank", x, y);
      slot.layer = 0;
      slots.push(slot);
    }
  }
}
