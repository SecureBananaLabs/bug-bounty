export function selectCoins(utxos,target){if(!Array.isArray(utxos)||utxos.length===0)return[];if(typeof target!=="number"||target<=0)return[];
const sorted=[...utxos].sort((a,b)=>b.value-a.value);
const selected=[];let total=0;
for(const u of sorted){selected.push(u);total+=u.value;if(total>=target)break;}
return total>=target?selected:[];}