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

export function prepareStalker(rawObj, name) {
  const __obj__ = wrap(rawObj, name);
  return ([cmd]) => {
    console.log(`${pico.dim(pico.gray(">"))} ${cmd}`);
    __obj__[stalking] = true;
    eval(cmd.replaceAll(name, "__obj__"));
    __obj__[stalking] = false;
    console.log(pico.gray(`  ${name} = ${JSON.stringify(__obj__)}`));
    console.log();
  }
}
