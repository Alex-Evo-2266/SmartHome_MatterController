// import { Environment, StorageService } from "@matter/main";
// import { NodeStore } from "@matter/main/node";

// async function testNodeStore() {
//   // 1️⃣ создаём environment
//   const environment = new Environment("test-env");

//   // 2️⃣ регистрируем StorageService
//   environment.set(StorageService, new StorageService(environment));

//   // 3️⃣ получаем сервисы
//   const storageService = environment.get(StorageService);
//   const nodeStore = environment.get(NodeStore);

//   // 4️⃣ проверяем, что они не undefined
//   console.log("StorageService:", storageService ? "OK" : "FAIL");
//   console.log("NodeStore:", nodeStore ? "OK" : "FAIL");

//   // 5️⃣ можно проверить базовые методы NodeStore
//   if (nodeStore) {
//     console.log("Keys in NodeStore:", Object.keys(nodeStore)); // просто для проверки
//   }
// }

// testNodeStore();
// import { Environment, StorageService } from "@matter/main";
// import { FileSystemStorage } from "@matter/main/storage/fs";

// const env = new Environment("test");

// const storageService = new StorageService(env, () =>
//   new FileSystemStorage("./matter-data")
// );
// env.set(StorageService, storageService);

// const store = await storageService.open("myStore");
// const context = store.createContext("data");

// await context.set("hello", "world");
// const value = await context.get("hello");
// console.log("value:", value);
