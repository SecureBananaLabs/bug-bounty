export function ensureTokenSubMatchesUserId(userId,tokenPayload){return{...tokenPayload,sub:String(userId),userId:String(userId)};}
