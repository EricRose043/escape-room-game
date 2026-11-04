import * as THREE from 'three';

// Bake static mesh transforms within each parent, keeping the parent hierarchy.
// Wheel pivots and the rear carriage retain their original animation anchors.
export function batchTrainStatic(root){
  let before=0,after=0;
  const released=new Set();
  function visit(parent){
    for(const child of [...parent.children])if(!child.isMesh)visit(child);
    const batches=new Map();
    for(const child of parent.children){
      if(!child.isMesh||child.isInstancedMesh||child.children.length||Array.isArray(child.material)||!child.visible)continue;
      const geometry=child.geometry;
      if(!geometry?.attributes.position||!geometry.attributes.normal||!geometry.attributes.uv)continue;
      const key=child.material.uuid+'/'+child.renderOrder;
      if(!batches.has(key))batches.set(key,[]);batches.get(key).push(child);
    }
    for(const parts of batches.values()){
      before+=parts.length;
      if(parts.length===1){after++;continue;}
      const baked=parts.map(part=>{part.updateMatrix();return part.geometry.clone().applyMatrix4(part.matrix);});
      const count=baked.reduce((n,g)=>n+g.attributes.position.count,0),indexCount=baked.reduce((n,g)=>n+(g.index?.count??g.attributes.position.count),0);
      const position=new Float32Array(count*3),normal=new Float32Array(count*3),uv=new Float32Array(count*2);
      const indices=count>65535?new Uint32Array(indexCount):new Uint16Array(indexCount);
      let vertex=0,index=0;
      for(const geometry of baked){
        position.set(geometry.attributes.position.array,vertex*3);normal.set(geometry.attributes.normal.array,vertex*3);uv.set(geometry.attributes.uv.array,vertex*2);
        const source=geometry.index;
        for(let i=0,n=source?.count??geometry.attributes.position.count;i<n;i++)indices[index++]=vertex+(source?source.getX(i):i);
        vertex+=geometry.attributes.position.count;geometry.dispose();
      }
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.BufferAttribute(position,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normal,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.computeBoundingSphere();
      const combined=new THREE.Mesh(geometry,parts[0].material);combined.name='train-static-batch';combined.renderOrder=parts[0].renderOrder;parent.add(combined);
      for(const part of parts){parent.remove(part);released.add(part.geometry);}after++;
    }
  }
  visit(root);for(const geometry of released)geometry.dispose();
  root.userData.staticBatches={before,after};return root;
}
