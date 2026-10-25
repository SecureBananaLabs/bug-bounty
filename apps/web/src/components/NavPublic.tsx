import React from"react";
export function NavPublic({isAdmin=false}:{isAdmin?:boolean}){return(<nav><a href="/">Home</a><a href="/jobs">Jobs</a>{isAdmin&&<a href="/admin">Admin</a>}</nav>);}