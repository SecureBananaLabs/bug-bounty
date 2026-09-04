const prismaClient = require("@prisma/client");

exports.PrismaClient = prismaClient.PrismaClient;
exports.Prisma = prismaClient.Prisma;
exports.default = prismaClient;

Object.assign(exports, prismaClient);
