class StateMachine {
  constructor() {
    this.state = new State();
    this.stateMap = {};
  }

  add(id, state) {
    this.stateMap[id] = state;
    return this;
  }

  change(id, ...args) {
    this.state.exit();
    this.state = this.stateMap[id];
    this.state.enter(...args);
    return this;
  }

  update() {
    this.state.update();
    return this;
  }

  onExit(func) {
    this.state.onExit = func;
  }
}

class State {
  /** @param {StateMachine} fsm  */
  constructor(fsm) {
    this.fsm = fsm;
    this.onExit = () => {};
  }
  update() {}
  enter() {}
  exit() {
    this.onExit();
    this.onExit = () => {};
  }
}
