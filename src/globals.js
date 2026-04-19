const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "0", "J", "Q", "K", "A"];
const SUITS = ["H", "D", "C", "S"];
const CARD_W = 34;
const CARD_H = 50;
const CARD_HW = CARD_W / 2;
const CARD_HH = CARD_H / 2;
const BOUNDS = { nw: { x: 6, y: 6 }, se: { x: 263, y: 243 } };
const RANK_TO_NUMERIC = {
  A: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  0: 10,
  J: 11,
  Q: 12,
  K: 13,
};

/** @type {CardSystem} */
let cardSystem;
