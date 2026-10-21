const fs = require("fs");
const buf = fs.readFileSync("C:/Users/Lionel/Pictures/PangeaPANGEA/geo/pangea-dots.bin");
const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const magic = view.getUint32(0, true);
const pieces = view.getUint32(4, true);
const dots = view.getUint32(8, true);
console.log({ magic: magic.toString(16), pieces, dots, bytes: buf.length, expect: 16 + pieces * 20 + dots * 8 + dots });
const chains = new Map();
let l = 16;
for (let i = 0; i < pieces; i++, l += 20) {
  const chain = view.getFloat32(l + 16, true);
  chains.set(chain, (chains.get(chain) || 0) + 1);
}
console.log([...chains.entries()]);
