export const defensiveList=(arr)=>Array.isArray(arr)?arr.map(item=>item&&typeof item==="object"?{...item}:item):[];
export const defensiveRecord=(item)=>item&&typeof item==="object"?{...item}:item;