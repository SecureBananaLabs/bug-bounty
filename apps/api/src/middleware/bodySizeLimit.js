import express from"express";
export const jsonWithLimit=express.json({limit:"100kb"});