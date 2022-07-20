import pico from "picocolors";

const noStalk = Symbol("noStalk");

function isPrimitive(v) {
  return !(typeof v === "object" || typeof v === "function");
}

function print(v) {
  return passThrough(
    v,
    (v) =>
      typeof v === "function" ? `[Function ${v.name}]` : JSON.stringify(v),
    () =>
      typeof v === "symbol"
        ? `@@${v.description.replace(/^Symbol\./, "")}`
        : typeof v === "string"
          ? JSON.stringify(v)
          : String(v)
  );
}

const ctorNameCounter = new Map();
let indent = "  ";

function passThrough(obj, action, fallback) {
  if (isPrimitive(obj)) {
    return fallback?.();
  }
  obj[noStalk] = true;
  const val = action(obj);
  obj[noStalk] = false;
  return val;
}

function getCallbackName(cb) {
  return passThrough(
    cb,
    // Ideally [anonymous] shouldn't happen; when it happens we have to decide
    // what to do
    (cb) => ("name" in cb ? cb.name : pico.red("[anonymous]")),
    () => pico.red("[anonymous]")
  );
}

function wrap(obj, name) {
  if (isPrimitive(obj)) return obj;
  let isSetting = false;

  return new Proxy(obj, {
    get(t, p, r) {
      if (t[noStalk] || p === noStalk || p === "prototype")
        return Reflect.get(t, p, r);
      const v = Reflect.get(t, p, r);
      console.log(
        `${pico.dim(indent)}${pico.bgBlue(" GET".padEnd(6))} ${pico.green(print(p))} on ${pico.cyan(name)} which is ${pico.yellow(print(v))}`
      );
      // @@species doesn't need to be stalked because it returns constructor which is already stalked
      if (p === Symbol.species) return v;
      return wrap(v, `${name}.${print(p).replace(/^"|"$/g, "")}`);
    },
    set(t, p, v, r) {
      if (t[noStalk] || p === noStalk) return Reflect.set(t, p, v, r);
      console.log(
        `${pico.dim(indent)}${pico.bgBlue(" SET".padEnd(6))} ${pico.green(print(p))} on ${pico.cyan(name)} to ${pico.yellow(print(v))}`
      );
      // set invokes defineProperty if the property doesn't exist??
      isSetting = true;
      const res = Reflect.set(t, p, v, r);
      isSetting = false;
      return res;
    },
    has(t, p) {
      if (t[noStalk] || p === noStalk) return Reflect.has(t, p);
      const res = Reflect.has(t, p);
      console.log(
        `${pico.dim(indent)}${pico.bgBlue(" TEST".padEnd(6))} ${pico.green(p)} exists on ${pico.cyan(name)} (it ${res ? "does" : "doesn't"})`
      );
      return res;
    },
    apply(t, th, a) {
      const wrappedArgs = a.map((v) => wrap(v, getCallbackName(v)));
      console.log(
        `${pico.dim(indent)}${pico.bgBlue(" CALL".padEnd(6))} ${pico.green(name)} with ${pico.yellow(print(th))} as this and [${pico.yellow(a.map(print).join(", "))}] as args`
      );
      indent += "│ ";
      const res = Reflect.apply(t, th, wrappedArgs);
      indent = indent.slice(0, -2);
      console.log(
        `${pico.dim(indent + "└──")} Result ${pico.yellow(print(res))}`
      );
      return res;
    },
    construct(t, a, n) {
      const newName = passThrough(n, (n) => {
        const index = ctorNameCounter.get(n.name) ?? 0;
        ctorNameCounter.set(n.name, index + 1);
        return `new${n.name}${index || ""}`;
      });
      console.log(
        `${pico.dim(indent)}${pico.bgBlue(" NEW".padEnd(6))} ${pico.green(name)} with [${pico.yellow(a.map(print).join(", "))}] as args (the result is called ${pico.cyan(newName)})`
      );
      return wrap(Reflect.construct(t, a, n), newName);
    },
    defineProperty(t, p, a) {
      if (p === noStalk || isSetting) return Reflect.defineProperty(t, p, a);
      console.log(
        `${pico.dim(indent)}${pico.bgBlue(" DEF".padEnd(6))} ${pico.green(print(p))} on ${pico.cyan(name)} to ${pico.yellow(print(a))}`
      );
      return Reflect.defineProperty(t, p, {
        ...a,
        value: wrap(a.value, `${name}.${print(p).replace(/^"|"$/g, "")}`),
      });
    },
  });
}

export function prepareStalker(rawObj, name) {
  return ([cmd]) => {
    ctorNameCounter.clear();
    indent = "  ";
    const __obj__ = wrap(rawObj, name);
    console.log(`${pico.dim(pico.dim(">"))} ${cmd}`);
    const res = eval(cmd.replace(new RegExp(`(?<!\\w)${name}(?!\\w)`, "g"), "__obj__"));
    passThrough(__obj__, (__obj__) =>
      console.log(pico.dim(`  ${name} = ${JSON.stringify(__obj__)}`))
    );
    console.log();
  };
}
