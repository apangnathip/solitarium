class StateMachine {
  constructor() {
    this.id = null;
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
    this.id = id;
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
