function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

function getRandomCard() {
  const rs = ["2", "3", "4", "5", "6", "7", "8", "9", "0", "J", "Q", "K", "A"];
  const ss = ["H", "D", "C", "S"];
  const r = rs[Math.floor(Math.random() * rs.length)];
  const s = ss[Math.floor(Math.random() * ss.length)];
  return r + s;
}
