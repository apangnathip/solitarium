class CardState extends State {
  /** @param {Card} card  */
  constructor(card) {
    super(card.fsm);
    this.card = card;
    this.system = card.system;
  }
}

class InitState extends CardState {
  update() {
    this.t += deltaTime / 1000;
    if (this.t < this.delay) return;

    this.card.sprite.moveTowards(this.endPos, 0.2);

    if (!this.card.isMoving()) {
      this.fsm.change(this.card.isOnTop() ? "flip" : "idle");
      return;
    }
  }

  enter(delay) {
    this.delay = delay;
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
    if (!this.card.active) return;
    if (this.card.isDragging()) this.fsm.change("drag");
    if (this.card.isHovering()) this.fsm.change("hover");
  }
}

class HoverState extends CardState {
  update() {
    if (!this.card.isHovering()) {
      this.fsm.change("idle");
      return;
    }
    if (this.card.isDragging()) {
      this.fsm.change("drag");
      return;
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
  }

  clampedPull(from, to) {
    return from - clamp(from - to, -1, 1);
  }
}

class DragState extends CardState {
  update() {
    if (!this.card.isDragging()) {
      this.changeStack();
      return;
    }
    this.detectStackHover();
    this.dragCards();
  }

  dragCards() {
    this.cards.forEach((card, i) => {
      if (card === this.card) {
        card.moveTowards(vecSub(this.grabOffset, mouse), 1);
        return;
      }
      card.fsm.change(
        "follow",
        {
          x: this.grabOffset.x,
          y: this.grabOffset.y,
        },
        i,
      );
    });
  }

  detectStackHover() {
    for (const key in this.system.groupToStack) {
      const stack = this.system.groupToStack[key];
      const isClose = Math.abs(this.card.getPos().x - stack.x) < CARD_WIDTH / 2;
      if (stack.isOverlapping(this.card.sprite) && isClose) {
        this.newStack = stack;
      }
    }
  }

  changeStack() {
    // if (!this.newStack.isLegalPush(this.card)) this.newStack = this.oldStack;
    if (this.newStack !== this.card.stack) {
      this.card.stack.popTo(this.card);
      this.newStack.push(...this.cards);
    }
    this.cards.forEach((card, i) => {
      card.stack = this.newStack;
      card.fsm.change("reset", card.stack.getTopPos(i - this.cards.length + 1, -1));
    });
  }

  enter() {
    this.oldStack = this.card.stack;
    this.newStack = this.card.stack;
    this.grabOffset = vecSub(this.card.getPos(), mouse);
    this.cards = this.card.splitStack();
    for (const card of this.cards) card.putOnTop();
  }

  exit() {
    this.newStack.updateCardLayers();
    this.oldStack.flipTopCard();
  }
}

class ResetState extends CardState {
  update() {
    this.card.moveTowards(this.endPos, 0.5);

    if (!this.card.isMoving()) {
      this.card.setPos(this.endPos)
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
    this.offset.y -= (this.card.stack.gap + 5) * idx;
  }
}

class FlipState extends CardState {
  update() {
    this.card.sprite.scale.x -= this.speed * (deltaTime / 1000);

    if (this.card.sprite.scale.x < 0) {
      this.card.sprite.scale.x = 0;
      this.card.sprite.changeAni(this.card.value);
      this.speed *= -1;
    }

    if (this.card.sprite.scale.x >= 1) {
      this.card.sprite.scale.x = 1;
      this.card.fsm.change("idle");
      this.card.active = true;
    }
  }

  enter() {
    this.speed = 15;
  }
}
