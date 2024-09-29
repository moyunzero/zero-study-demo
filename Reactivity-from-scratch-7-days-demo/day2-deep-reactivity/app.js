// Global variable to track the currently active effect
let activeEffect;
// Map to store dependencies for each reactive object and its properties
const targetMap = new Map();

// Function to track dependencies
function track(target, key) {
  if (activeEffect) {
    // Get or create a map of dependencies for the target object
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    // Get or create a set of effects for the specific property
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = new Set()));
    }
    // Add the active effect to the dependency set
    dep.add(activeEffect);
  }
}

// Function to trigger effects when a reactive property changes
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (dep) {
    // Run all effects associated with the changed property
    dep.forEach((effect) => effect());
  }
}

// Function to create and run an effect
function effect(fn) {
  const effect = () => {
    activeEffect = effect;
    try {
      fn();
    } finally {
      activeEffect = null;
    }
  };
  effect(); // Run the effect immediately
  return effect;
}
function reactive(target) {
    return new Proxy(target, {
      get(target, key, receiver) {
        const res = Reflect.get(target, key, receiver);
        track(target, key);
        // Recursively make nested objects reactive
        return res && typeof res === "object" ? reactive(res) : res;
      },
      set(target, key, value, receiver) {
        const oldValue = target[key];
        const result = Reflect.set(target, key, value, receiver);
        if (result && oldValue !== value) {
          trigger(target, key);
        }
        return result;
      },
      deleteProperty(target, key) {
        const hadKey = Object.prototype.hasOwnProperty.call(target, key);
        const result = Reflect.deleteProperty(target, key);
        if (result && hadKey) {
          trigger(target, key);
        }
        return result;
      }
    });
  }

const person = reactive({
    name: "张三",
    age: 18,
    address: {
      street: "朝阳",
      city: "北京"
    }
});

effect(()=>{
    document.getElementById("person-info").innerHTML = `
        <p>姓名：${person.name}</p>
        <p>年龄：${person.age}</p>
        <p>地址：${person.address.street} ${person.address.city}</p>
    `;
});

let isOriginalName = true;
let isOriginalAddress = true;

document.getElementById("change-name").addEventListener("click",() => {
    if(isOriginalName){
        person.name = '李四'
    }else{
        person.name = '张三'
    }
    isOriginalName = !isOriginalName;
});
document.getElementById("change-age").addEventListener("click", () => {
    person.age++;
  });
  document.getElementById("change-address").addEventListener("click", () => {
    if (isOriginalAddress) {
      person.address.street = "海淀";
      person.address.city = "北京1";
    } else {
      person.address.street = "朝阳";
      person.address.city = "北京";
    }
    isOriginalAddress = !isOriginalAddress;
  });  

  // Additional test for array reactivity
const test = reactive({
    name: "John Doe",
    hobbies: ["reading", "cycling"]
  });
  
  // Effect to log hobbies when they change
  effect(() => {
    console.log(test.hobbies.join(", "));
  });
  
// Add a new hobby (this should trigger the effect)
test.hobbies.push("swimming");