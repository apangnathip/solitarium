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
  }

  update() {
    this.state.update();
  }
}

class State {
  /** @param {StateMachine} fsm  */
  constructor(fsm) {
    this.fsm = fsm;
  }
  enter() {}
  exit() {}
  update() {}
}
