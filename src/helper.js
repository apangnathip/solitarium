function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

function vecSub(v1, v2) {
  return { x: v2.x - v1.x, y: v2.y - v1.y };
}

function getRandomCard() {
  const r = RANKS[floor(random(RANKS.length))];
  const s = SUITS[floor(random(SUITS.length))];
  return r + s;
}

function splitValue(v) {
  return { rank: v[0], suit: v[1] };
}

function isSameColor(s1, s2) {
  const red = new Set(["H", "D"]);
  const black = new Set(["C", "S"]);
  return (red.has(s1) && red.has(s2)) || (black.has(s1) && black.has(s2));
}

function isLowerByOne(r1, r2) {
  return RANK_TO_NUMERIC[r2] - RANK_TO_NUMERIC[r1] === 1;
}

function checkStackingLegality(value1, value2) {
  const a = splitValue(value1);
  const b = splitValue(value2);
  if (isSameColor(a.suit, b.suit)) return false;
  if (!isLowerByOne(a.rank, b.rank)) return false;
  return true;
}
