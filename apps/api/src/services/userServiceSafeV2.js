const users=[];
const safe=u=>{if(!u)return null;const{password,passwordHash,salt,...r}=u;return{...r};};
export const userServiceSafe={create:(d)=>{const{password,...rest}=d;users.push({...rest,id:crypto.randomUUID()});return safe({...rest});},list:()=>users.map(safe),get:(id)=>safe(users.find(u=>u.id===id)||null)};