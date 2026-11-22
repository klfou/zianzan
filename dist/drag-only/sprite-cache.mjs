// Keep only a few decoded vehicles in memory, especially on older tablets.
export function createSpriteCache(limit=4){
  if(!Number.isInteger(limit)||limit<1)throw new RangeError('Invalid vehicle cache capacity');
  const entries=new Map();
  return (id,load)=>{
    if(entries.has(id)){
      const value=entries.get(id);entries.delete(id);entries.set(id,value);return value;
    }
    const value=Promise.resolve().then(load);
    entries.set(id,value);
    if(entries.size>limit)entries.delete(entries.keys().next().value);
    value.catch(()=>{if(entries.get(id)===value)entries.delete(id);});
    return value;
  };
}
