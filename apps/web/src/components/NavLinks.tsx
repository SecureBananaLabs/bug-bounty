import React from"react";
const LINKS=[{href:"/",label:"Home"},{href:"/jobs",label:"Jobs"},{href:"/dashboard",label:"Dashboard"},{href:"/profile",label:"Profile"},{href:"/messages",label:"Messages"}];
export function NavLinks(){return<nav>{LINKS.map(l=><a key={l.href} href={l.href}>{l.label}</a>)}</nav>;}