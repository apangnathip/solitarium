class CardState extends State {
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

    if (this.card.presses("left")) this.startDrag = true;
    if (this.card.pressed("left")) this.startDrag = false;
    if (this.startDrag && this.card.dragging()) return this.fsm.change("drag");

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
    this.startDrag = false;
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
    if (!mouse.pressing("left") || !this.card.dragging())
      return this.changeStack();
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
    const { x, y } = this.card.getPos();
    for (const key in this.system.groupToStack) {
      const stack = this.system.groupToStack[key];
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
    AssetLoader.sounds.tap.play();
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
      if (this.system.isWinnable()) {
        this.system.solve();
      } else {
        this.fsm.change("idle");
      }
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
      this.card.faceUp = this.up;
      this.speed *= -1;
    }

    if (this.card.sprite.scale.x >= 1) {
      this.card.fsm.change("idle", this.flipFrom);
    }
  }

  enter(flipTo = this.card.getPos(), flipFrom = this.card.getPos(), up = true) {
    AssetLoader.sounds.flip.stop();
    AssetLoader.sounds.flip.play();
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
    AssetLoader.sounds.tap.play();
    if (this.card.stack.getTopCard() === this.card) {
      this.foundation.add(this.card);
    }
  }
}

class SolveState extends CardState {
  update() {
    this.t += deltaTime / 1000;
    if (this.t < this.delay) return;

    if (!this.soundPlayed) {
      this.soundPlayed = true;
      AssetLoader.sounds.flip.play();
    }

    this.card.sprite.layer = 1000 + this.delay;
    this.card.moveTowards(this.endPos, 0.5);

    if (!this.card.moving()) {
      this.fsm.change("bounce", this.bounceDelay);
      return;
    }
  }

  enter(endPos, cardsAdded, cardsLeft) {
    this.soundPlayed = false;
    this.endPos = endPos;
    this.delay = cardsAdded / 20;
    this.bounceDelay = cardsLeft;
    this.t = 0;
  }

  exit() {
    super.exit();
  }
}

class BounceState extends CardState {
  update() {
    if (this.card.system.foundation.cardCount < this.card.system.maxPoolCount) {
      return;
    }

    this.t += deltaTime / 1000;
    if (this.t < this.delay) return;

    if (!this.posSet) {
      this.posSet = true;
      AssetLoader.sounds.pop.play();
      this.card.setPos(this.initPos);
      this.card.sprite.physics = "DYNAMIC";
      this.card.sprite.direction = random(-180, 0);
      this.card.sprite.speed = 2;
    }

    if (this.card.sprite.y + CARD_HH > canvas.h) {
      this.card.sprite.y = canvas.h - CARD_HH;
      this.card.sprite.vel.y *= -1 * 0.8;
    }

    const { x, y } = this.card.getPos();
    trailBuffer.image(
      AssetLoader.images.blank,
      Math.floor(x - CARD_HW),
      Math.floor(y - CARD_HH),
    );
  }

  enter(delay) {
    this.initPos = this.card.getPos();
    this.posSet = false;
    this.delay = delay;
    this.t = 0;
  }
}

class RestartState extends CardState {
  enter() {
    this.card.setPos(this.card.getPos());
    this.card.sprite.physics = "DYNAMIC";
    this.card.sprite.life = 60;
  }
}
