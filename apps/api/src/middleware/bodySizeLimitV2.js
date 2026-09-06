import express from"express";
export const jsonBodyLimit=express.json({limit:"100kb",strict:true});