export const snap=(r)=>r&&typeof r==="object"?{...r}:r;
export const snapList=(a)=>Array.isArray(a)?a.map(snap):[];