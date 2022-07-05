import pico from "picocolors";

const stalking = Symbol("stalking");

function print(v) {
  return typeof v === "function"
    ? `[Function ${v.name}]`
    : typeof v === "symbol"
    ? `@@${v.description}`
    : JSON.stringify(v);
}

function wrap(obj, name) {
  return new Proxy(Object(obj), {
    get(t, p, r) {
      if (typeof obj === "number" && p === "valueOf") {
        console.log(
          `    Get ${pico.green(print(p))} on ${name} which is ${pico.yellow(obj)}`
        );
        return () => obj;
      }
      if (!t[stalking] || p === stalking) return Reflect.get(t, p, r);
      const v = Reflect.get(t, p, r);
      console.log(
        `    Get ${pico.green(print(p))} on ${name} which is ${pico.yellow(print(v))}`
      );
      return typeof v === "string" && v.startsWith("item") ? v : wrap(v, p);
    },
    set(t, p, v, r) {
      if (!t[stalking] || p === stalking) return Reflect.set(t, p, v, r);
      console.log(
        `    Set ${pico.green(print(p))} on ${name} to ${pico.yellow(print(v))}`
      );
      return Reflect.set(t, p, v, r);
    },
  });
}

const arr = wrap(Array.from({ length: 3 }, (v, i) => `item ${i}`), "arr");

function stalk([cmd]) {
  console.log(`${pico.dim(pico.gray(">"))} ${cmd}`);
  arr[stalking] = true;
  eval(cmd);
  arr[stalking] = false;
  console.log(pico.gray(`  arr = ${JSON.stringify(arr)}`));
  console.log();
}

stalk`arr.push("item 3", "item 4")`;
stalk`arr.pop()`;
stalk`arr.unshift("item 5", "item 6")`;
stalk`arr.shift()`;
stalk`arr.splice(2, 1, "item 7")`;
stalk`arr.copyWithin(2)`;
stalk`arr.at(-1)`;
stalk`arr.toString()`;
stalk`arr.join(",")`;
stalk`arr.filter(i => i)`;
