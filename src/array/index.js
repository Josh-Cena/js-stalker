import { prepareStalker } from "#stalker";

const stalk = prepareStalker(Array.from({ length: 3 }, (v, i) => `item ${i}`), "arr");

stalk`arr.push("item 3", "item 4")`;
stalk`arr.pop()`;
stalk`arr.unshift("item 5", "item 6")`;
stalk`arr.shift()`;
stalk`arr.splice(2, 1, "item 7")`;
stalk`arr.reverse()`;
stalk`arr.sort(function comparator(a, b) { return a.localeCompare(b); })`;
stalk`arr.copyWithin(2)`;
stalk`arr.at(-1)`;
stalk`arr.toString()`;
stalk`arr.join(",")`;
stalk`arr.map(function callback(i) { return i.substring(5); })`;
stalk`arr.forEach(function callback(i) {})`;
stalk`arr.filter(function callback(i) { return i; })`;
stalk`arr.indexOf("item 2")`;
stalk`arr.lastIndexOf("item 2")`;
stalk`arr.find(function callback(i) { return i.endsWith("2"); })`;
stalk`arr.findIndex(function callback(i) { return i.endsWith("2"); })`;
stalk`arr.findLast(function callback(i) { return i.endsWith("2"); })`;
stalk`arr.findLastIndex(function callback(i) { return i.endsWith("2"); })`;
