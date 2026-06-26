import{PrismaClient}from"@prisma/client";
let prisma;
export async function connectDb(){if(!prisma){prisma=new PrismaClient();await prisma.$connect();console.log("DB connected via Prisma");}return prisma;}
export{prisma};