import assert from 'node:assert/strict';
// Full integrity checks only at trial boundaries. A sealed window rejects r2-state.
export async function readNativeTrialState({mode='native',expectedState,fenceHeld=false,control,readPointer,expectedPins}){
 assert.ok(['native','full','held'].includes(mode));
 const reads=await Promise.allSettled([control('/__playtt-capacity'),control('/__playtt-publishing'),control('/__playtt-backup-pins')]);
 for(const r of reads){if(r.status==='rejected')throw r.reason;}
 const [budget,pub,pins]=reads.map(r=>r.value);assert.equal(pub.state,'paused');assert.deepEqual(pins,expectedPins);
 let state,source;
 if(mode==='full'){const checked=await control('/?phase=operator-fence-status');assert.equal(checked.coherent,true);state=checked.state;source='full-integrity';}
 else if(mode==='held'){
  assert.equal(fenceHeld,true);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.pending,0);
  assert.ok(Number.isSafeInteger(expectedState?.version)&&expectedState.version>0);assert.ok(expectedState.pointer);
  assert.deepEqual(await readPointer(),expectedState.pointer);state=structuredClone(expectedState);source='retained-under-owned-fence-and-exact-r2-pointer';
 }else{
  assert.equal(budget.writeTracking.sealed,false,'Lightweight state requires an unsealed window');assert.equal(budget.writeTracking.window.closed,false,'Lightweight state requires an open window');
  state=await control('/?phase=r2-state');source='live-coordinator';
 }
 return {state,budget,publisher:pub.state,pins:pins.generation,stateSource:source};
}
