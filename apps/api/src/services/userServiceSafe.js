const users=[];
const safe=u=>{if(!u)return null;const{password,passwordHash,salt,...r}=u;return{...r};};
export const userService={list:()=>users.map(safe),get:(id)=>{return safe(users.find(u=>u.id===id)||null);},create:(data)=>{const{password,...rest}=data;const u={...rest,id:crypto.randomUUID(),createdAt:new Date()};users.push({...u,password});return safe({...u});}};