function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

function vecSub(v1, v2) {
  return { x: v2.x - v1.x, y: v2.y - v1.y };
}

function getRandomCard() {
  const rs = ["2", "3", "4", "5", "6", "7", "8", "9", "0", "J", "Q", "K", "A"];
  const ss = ["H", "D", "C", "S"];
  const r = rs[Math.floor(Math.random() * rs.length)];
  const s = ss[Math.floor(Math.random() * ss.length)];
  return r + s;
}

function splitValue(value) {
  return {
    rank: value[0],
    suit: value[1],
  };
}

function isSameColor(suit1, suit2) {
  const red = new Set(["H", "D"]);
  const black = new Set(["C", "S"]);
  return (
    (red.has(suit1) && red.has(suit2)) || (black.has(suit1) && black.has(suit2))
  );
}

function rankToNumeric(rank) {
  const dict = {
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
  return dict[rank];
}

function isLowerByOne(rank1, rank2) {
  return rankToNumeric(rank2) - rankToNumeric(rank1) === 1;
}

function checkStackLegality(value1, value2) {
  const a = splitValue(value1);
  const b = splitValue(value2);
  if (isSameColor(a.suit, b.suit)) return false;
  if (!isLowerByOne(a.rank, b.rank)) return false;
  return true;
}
