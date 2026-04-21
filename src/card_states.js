class CardState extends State {
  /** @param {Card} card  */
  constructor(card) {
    super(card.fsm);
    this.card = card;
    this.system = card.system;
    this.foundation = card.system.foundation;
  }
}

class InitState extends CardState {
  update() {
    this.t += deltaTime / 1000;
    if (this.t < this.delay) return;

    this.card.sprite.moveTowards(this.endPos, 0.2);

    if (!this.card.moving()) {
      this.fsm.change(
        this.card.isOnTop() && this.card.stack.autoFlip ? "flip" : "idle",
        this.flipToPos,
      );
      return;
    }
  }

  enter(delay, flipToPos, autoFlip = true) {
    this.delay = delay;
    this.flipToPos = flipToPos;
    this.autoFlip = autoFlip;
    this.t = 0;
    const x = (BOUNDS.se.x - BOUNDS.nw.x) / 2 + BOUNDS.nw.x;
    const y = canvas.h * 1.5;
    this.startPos = { x, y };
    this.endPos = this.card.getPos();
    this.card.sprite.x = this.startPos.x;
    this.card.sprite.y = this.startPos.y;
  }
}

class IdleState extends CardState {
  update() {
    if (!this.card.active) {
      if (this.card.presses("left") && this.card.stack.type === "stock") {
        this.card.stack.pull();
        this.fsm.change("flip", this.flipToPos);
      }
      return;
    }
    if (this.card.hovering()) this.fsm.change("hover");
  }

  enter(flipToPos) {
    this.flipToPos = flipToPos;
  }
}

class HoverState extends CardState {
  update() {
    if (!this.card.hovering()) return this.fsm.change("idle");
    if (this.card.dragging()) return this.fsm.change("drag");
    if (this.card.stack.type !== "slot" && mouse.presses("right")) {
      return this.fsm.change("select");
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
    super.exit();
  }

  clampedPull(from, to) {
    return from - clamp(from - to, -1, 1);
  }
}

class DragState extends CardState {
  update() {
    if (!this.card.dragging()) return this.changeStack();
    this.detectStackHover();
    this.dragCards();
  }

  dragCards() {
    for (const [i, card] of this.cards.entries()) {
      if (card === this.card) {
        card.moveTowards(vecSub(this.grabOffset, mouse), 1);
        continue;
      }
      card.fsm.change(
        "follow",
        {
          x: this.grabOffset.x,
          y: this.grabOffset.y,
        },
        i,
      );
    }
  }

  detectStackHover() {
    let closest;
    let minDist;
    for (const key in this.system.groupToStack) {
      const stack = this.system.groupToStack[key];
      const { x, y } = this.card.getPos();
      const d = dist(x, y, stack.x, stack.y);
      if (stack.overlapping(this.card.sprite) && (!minDist || d < minDist)) {
        if (stack.type === "slot" && this.cards.length > 1) continue;
        minDist = d;
        closest = stack;
      }
    }
    if (closest) this.newStack = closest;
  }

  changeStack() {
    if (this.system.strictStacking && !this.newStack.isLegalPush(this.card)) {
      this.newStack = this.oldStack;
    }

    if (this.newStack !== this.card.stack) {
      this.card.stack.popTo(this.card);
      this.newStack.push(...this.cards);
    }

    for (const [i, card] of this.cards.entries()) {
      card.stack = this.newStack;
      card.fsm.change(
        "reset",
        card.stack.getTopPos(i - this.cards.length + 1, -1),
      );
    }
  }

  enter() {
    this.newStack = this.oldStack = this.card.stack;
    this.grabOffset = vecSub(this.card.getPos(), mouse);
    this.cards = this.card.splitStack();
    for (const card of this.cards) card.putOnTop();
  }

  exit() {
    this.newStack.updateCardLayers();
    if (this.oldStack.autoFlip) this.oldStack.flipTopCard();
    super.exit();
  }
}

class ResetState extends CardState {
  update() {
    this.card.moveTowards(this.endPos, 0.5);
    if (!this.card.moving()) {
      this.fsm.change("idle");
      return;
    }
  }

  enter(endPos) {
    this.endPos = endPos;
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
    this.card.sprite.moveTo(this.flipTo, 3);

    if (this.card.sprite.scale.x < 0) {
      this.card.sprite.scale.x = 0;
      this.card.sprite.changeAni(this.up ? this.card.value : "back");
      this.speed *= -1;
    }

    if (this.card.sprite.scale.x >= 1) {
      this.card.fsm.change("idle", this.flipFrom);
    }
  }

  enter(flipTo = this.card.getPos(), flipFrom = this.card.getPos(), up = true) {
    this.up = up;
    this.speed = 15;
    this.flipTo = flipTo;
    this.flipFrom = flipFrom;
  }

  exit() {
    this.card.setPos(this.flipTo);
    this.card.sprite.scale.x = 1;
    this.card.active = this.up;
    super.exit();
  }
}

class SelectState extends CardState {
  update() {
    this.fsm.change("idle");
  }

  enter() {
    if (this.card.stack.getTopCard() === this.card) {
      this.foundation.add(this.card);
    }
  }
}
