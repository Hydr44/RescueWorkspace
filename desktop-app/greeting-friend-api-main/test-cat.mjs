const KEY='592a34992amsh1059d9c0119c883p1b9ad3jsn26ac8a7d7aff';
const HOST='auto-parts-catalog.p.rapidapi.com';
const H={'x-rapidapi-host':HOST,'x-rapidapi-key':KEY};

async function main(){
  // V1 format
  const r1=await fetch('https://'+HOST+'/category/type-id/1/products-groups-variant-1/2694/lang-id/7',{headers:H});
  const d1=await r1.json();
  console.log('V1 status:',r1.status);
  console.log('V1 keys:',Object.keys(d1));
  const cats=d1.categories||d1;
  if(Array.isArray(cats))console.log('V1 first:',JSON.stringify(cats[0]).substring(0,300));
  else console.log('V1 type:',typeof cats,'sample:',JSON.stringify(cats).substring(0,300));
  
  // V2 with 206 (the failing one)
  const r2=await fetch('https://'+HOST+'/category/type-id/1/products-groups-variant-2/206/lang-id/7',{headers:H});
  console.log('\nV2/206 status:',r2.status);
  
  // V1 with 206
  const r3=await fetch('https://'+HOST+'/category/type-id/1/products-groups-variant-1/206/lang-id/7',{headers:H});
  console.log('V1/206 status:',r3.status);
  if(r3.status===200){const d3=await r3.json();console.log('V1/206 keys:',Object.keys(d3));}
}
main().then(()=>process.exit(0));
