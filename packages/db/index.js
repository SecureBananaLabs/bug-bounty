"use strict";

let prismaClient;

function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = require("@prisma/client");
  }

  return prismaClient;
}

module.exports = new Proxy({}, {
  get(_target, property) {
    return getPrismaClient()[property];
  },
  getOwnPropertyDescriptor(_target, property) {
    const descriptor = Object.getOwnPropertyDescriptor(getPrismaClient(), property);
    if (descriptor) {
      descriptor.configurable = true;
    }

    return descriptor;
  },
  has(_target, property) {
    return property in getPrismaClient();
  },
  ownKeys() {
    return Reflect.ownKeys(getPrismaClient());
  }
});
