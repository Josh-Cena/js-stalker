import { prepareStalker } from "#stalker";

const stalk = prepareStalker(Array.from({ length: 3 }, (v, i) => `item ${i}`), "arr");

stalk`arr.push("item 3", "item 4")`;
stalk`arr.pop()`;
stalk`arr.unshift("item 5", "item 6")`;
stalk`arr.shift()`;
stalk`arr.splice(2, 1, "item 7")`;
stalk`arr.copyWithin(2)`;
stalk`arr.at(-1)`;
stalk`arr.toString()`;
stalk`arr.join(",")`;
stalk`arr.filter(function callback(i) { return i; })`;
