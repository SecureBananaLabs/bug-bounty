export const safeList=(arr)=>Array.isArray(arr)?arr.map(item=>item&&typeof item==="object"?{...item}:item):[];
export const safeGet=(item)=>item&&typeof item==="object"?{...item}:item;