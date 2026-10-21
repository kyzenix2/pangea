window.PANGEA_COINS = [
  { id: "pangea", tick: "PA", name: "Pangea", symbol: "PANGEA", chains: 5, age: "1h ago", ageMin: 60, chain: "ETH", addr: "0x6434…96ea", mcap: 1740000, chg: 11471.38, price: "$0.0₃3504", vol: 1730000, pools: 149000, bought: 90.8, color: "#111113", ink: "#f5f3ed" },
  { id: "pcat", tick: "PC", name: "Pangea Cat", symbol: "PCAT", chains: 5, age: "2h ago", ageMin: 120, chain: "ETH", addr: "0xD102…B6EA", mcap: 37900, chg: 152.09, price: "$0.0₅7588", vol: 89200, pools: 8800, bought: 36.8, color: "#F0B90B" },
  { id: "pve", tick: "PV", name: "PVE", symbol: "PVE", chains: 5, age: "41m ago", ageMin: 41, chain: "ETH", addr: "0x5fA3…F6Ea", mcap: 18400, chg: 21.19, price: "$0.0₅3670", vol: 13900, pools: 1500, bought: 9.2, color: "#35E07A" },
  { id: "earth", tick: "0x", name: "Flat Earth", symbol: "0XFEARTH", chains: 5, age: "2h ago", ageMin: 118, chain: "ETH", addr: "0x7650…86EA", mcap: 16300, chg: 8.29, price: "$0.0₅3260", vol: 12200, pools: 560, bought: 3.5, color: "#2F7CFF" },
  { id: "pchan", tick: "PC", name: "Pangea Chan", symbol: "PCHAN", chains: 5, age: "39m ago", ageMin: 39, chain: "ETH", addr: "0x9D0f…06EA", mcap: 16100, chg: 6.06, price: "$0.0₅3212", vol: 5600, pools: 413, bought: 2.6, color: "#9945FF" },
  { id: "gondwana", tick: "GO", name: "Gondwana", symbol: "GONDWANA", chains: 5, age: "29m ago", ageMin: 29, chain: "ETH", addr: "0xda8F…86EA", mcap: 15700, chg: 4.25, price: "$0.0₅3138", vol: 10800, pools: 296, bought: 1.9, color: "#8C8DFB" },
  { id: "laurasia", tick: "LA", name: "LAURASIA", symbol: "LAURASIA", chains: 5, age: "27m ago", ageMin: 27, chain: "ETH", addr: "0x7840…56eA", mcap: 15700, chg: 4.09, price: "$0.0₅3133", vol: 918, pools: 255, bought: 1.6, color: "#35E07A" },
  { id: "pinu", tick: "PI", name: "Pangea Inu", symbol: "PINU", chains: 5, age: "36m ago", ageMin: 36, chain: "ETH", addr: "0x16A0…26ea", mcap: 15600, chg: 3.22, price: "$0.0₅3126", vol: 2900, pools: 206, bought: 1.3, color: "#F0B90B" },
  { id: "flat", tick: "FL", name: "Flat Earthers", symbol: "FLAT", chains: 5, age: "37m ago", ageMin: 37, chain: "ETH", addr: "0x76cb…76eA", mcap: 15500, chg: 2.07, price: "$0.0₅3091", vol: 1800, pools: 210, bought: 1.3, color: "#2F7CFF" },
  { id: "world", tick: "WO", name: "WORLD", symbol: "WORLD", chains: 5, age: "27m ago", ageMin: 27, chain: "ETH", addr: "0x40B7…a6eA", mcap: 15400, chg: -0.3, price: "$0.0₅3071", vol: 1600, pools: 98, bought: 0.6, color: "#8C8DFB" }
];

window.pangeaMoney = function (n) {
  const trim = (value) => value.toFixed(2).replace(/\.?0+$/, "");
  if (n >= 1e6) return "$" + trim(n / 1e6) + "M";
  if (n >= 1e3) return "$" + trim(n / 1e3) + "K";
  return "$" + trim(n);
};
