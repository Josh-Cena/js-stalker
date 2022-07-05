import pico from "picocolors";

const noStalk = Symbol("noStalk");

function isPrimitive(v) {
  return !(typeof v === "object" || typeof v === "function");
}

function print(v) {
  if (!isPrimitive(v)) 
    v[noStalk] = true;
  const str = typeof v === "function"
    ? `[Function ${v.name}]`
    : typeof v === "symbol"
    ? `@@${v.description.replace(/^Symbol\./, "")}`
    : JSON.stringify(v);
  if (!isPrimitive(v)) 
    v[noStalk] = false;
  return str;
}

function isPassThrough(v) {
  return typeof v === "string" && v.startsWith("item ");
}

function wrap(obj, name, ctorNameCounter) {
  let isSetting = false;

  return new Proxy(Object(obj), {
    get(t, p, r) {
      if (typeof obj === "number" && (p === "valueOf" || p === Symbol.toPrimitive)) {
        return () => obj;
      }
      if (t[noStalk] || p === noStalk || p === "prototype") return Reflect.get(t, p, r);
      const v = Reflect.get(t, p, r);
      console.log(
        `  ${pico.bgBlue(" GET".padEnd(6))} ${pico.green(print(p))} on ${pico.cyan(name)} which is ${pico.yellow(print(v))}`
      );
      if (isPassThrough(v)) return v;
      // @@species doesn't need to be stalked because it returns constructor which is already stalked
      if (p === Symbol.species) return v;
      return wrap(v, `${name}.${print(p).replace(/^"|"$/g, "")}`, ctorNameCounter);
    },
    set(t, p, v, r) {
      if (t[noStalk] || p === noStalk) return Reflect.set(t, p, v, r);
      console.log(
        `  ${pico.bgBlue(" SET".padEnd(6))} ${pico.green(print(p))} on ${pico.cyan(name)} to ${pico.yellow(print(v))}`
      );
      // set invokes defineProperty if the property doesn't exist??
      isSetting = true;
      const res = Reflect.set(t, p, v, r);
      isSetting = false;
      return res;
    },
    has(t, p) {
      const res = Reflect.has(t, p);
      console.log(`  ${pico.bgBlue(" TEST".padEnd(6))} ${pico.green(p)} exists on ${pico.cyan(name)} (it ${res ? "does" : "doesn't"})`);
      return res;
    },
    apply(t, th, a) {
      console.log(
        `  ${pico.bgBlue(" CALL".padEnd(6))} ${pico.green(name)} with ${pico.yellow(print(th))} as this and [${pico.yellow(a.map(print).join(", "))}] as args`,
      );
      return Reflect.apply(t, th, a);
    },
    construct(t, a, n) {
      n[noStalk] = true;
      const index = ctorNameCounter.get(n.name) ?? 0;
      ctorNameCounter.set(n.name, index + 1);
      const newName = `new${n.name}${index || ''}`;
      n[noStalk] = false;
      console.log(
        `  ${pico.bgBlue(" NEW".padEnd(6))} ${pico.green(name)} with [${pico.yellow(a.map(print).join(", "))}] as args (the result is called ${pico.cyan(newName)})`
      );
      return wrap(Reflect.construct(t, a, n), newName, ctorNameCounter);
    },
    defineProperty(t, p, a) {
      if (p === noStalk || isSetting)
        return Reflect.defineProperty(t, p, a);
      console.log(
        `  ${pico.bgBlue(" DEF".padEnd(6))} ${pico.green(print(p))} on ${pico.cyan(name)} to ${pico.yellow(print(a))}`
      );
      return Reflect.defineProperty(t, p, {
        ...a,
        value: isPassThrough(a.value)
          ? a.value
          : wrap(a.value, `${name}.${print(p).replace(/^"|"$/g, "")}`, ctorNameCounter)
      });
    }
  });
}

export function prepareStalker(rawObj, name) {
  return ([cmd]) => {
    const __obj__ = wrap(rawObj, name, new Map());
    console.log(`${pico.dim(pico.gray(">"))} ${cmd}`);
    const res = eval(cmd.replace(new RegExp(`(?<!\\w)${name}(?!\\w)`, "g"), "__obj__"));
    __obj__[noStalk] = true;
    console.log(pico.gray(`  ${name} = ${JSON.stringify(__obj__)}`));
    __obj__[noStalk] = false;
    console.log();
  }
}
