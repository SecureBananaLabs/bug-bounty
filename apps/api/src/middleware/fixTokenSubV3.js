export function ensureSubMatchesId(userId,payload){return{...payload,sub:String(userId),id:String(userId)};}
