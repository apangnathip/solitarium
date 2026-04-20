class Button {
  constructor(x, y, image, func = () => {}) {
    this.sprite = new Sprite(image, x, y);
    this.sprite.layer = 0;
    this.func = func;
  }

  update() {
    if (this.sprite.mouse.presses()) {
      this.func();
    }
  }
}
