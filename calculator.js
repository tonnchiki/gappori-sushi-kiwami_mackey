'use strict';
// Exact enumeration of the same probability model as 1.0.0.
// A raw landing on an occupied pocket advances to the next empty pocket clockwise.
const SushiCalculator = (() => {
  const N = 18, ALL = (1 << N)-1;
  function weight(mask, j) {
    if(mask & (1<<j)) return 0;
    let w=1, prev=(j+N-1)%N;
    while(mask & (1<<prev)) { w++; prev=(prev+N-1)%N; }
    return w;
  }
  function prefixWays() {
    let states=new Map([[0,1]]);
    for(let ball=0;ball<3;ball++) {
      const next=new Map();
      for(const [mask,ways] of states) for(let j=0;j<N;j++) {
        const w=weight(mask,j);
        if(w) { const m=mask|(1<<j); next.set(m,(next.get(m)||0)+ways*w); }
      }
      states=next;
    }
    return states;
  }
  function popcount(x) { let n=0; while(x) { x&=x-1; n++; } return n; }
  const prefixes=prefixWays();
  function calculate({labels, buys, mode, freeRate, payout}) {
    if(!Array.isArray(labels)||labels.length!==18||labels.filter(x=>x===-1).length!==1) throw Error('18穴の配置を確認してください。');
    if(!Array.isArray(buys)||!buys.length||buys.some(x=>!Number.isInteger(x)||x<0)||buys.reduce((a,b)=>a+b,0)!==5) throw Error('購入数は0以上の整数で、合計5個にしてください。');
    if(labels.some(x=>!Number.isInteger(x)||x < -1||x>=buys.length)) throw Error('ネタの指定を確認してください。');
    if(!['oya','okami','either'].includes(mode)) throw Error('SPの種類を選んでください。');
    if(!Number.isFinite(freeRate)||freeRate<0||freeRate>1) throw Error('フリー率は0〜100％で入力してください。');
    if(!Number.isFinite(payout)||payout<0) throw Error('配当は0以上で入力してください。');
    const totals=buys.map((_,i)=>labels.filter(x=>x===i).length);
    if(buys.some((n,i)=>n>totals[i])) throw Error('購入数がそのネタの穴数を超えています。');
    const sp=labels.indexOf(-1), chosenTypes=buys.map((n,i)=>n>0?i:-1).filter(i=>i>=0);
    const unit=mode==='oya'?1:mode==='okami'?18:36;
    const denominator=N**5*unit;
    const cache=new Map();
    function countsAt(mask) {
      const counts=buys.map(()=>0);
      for(let j=0;j<N;j++) if((mask&(1<<j))&&labels[j]>=0) counts[labels[j]]++;
      return counts;
    }
    function outcomes(mask) {
      if(cache.has(mask)) return cache.get(mask);
      const counts=countsAt(mask), deficits=buys.map((n,i)=>Math.max(0,n-counts[i]));
      const remaining=deficits.reduce((a,b)=>a+b,0);
      const oya=[], okami=[], units=[];
      // Index 0 means no free; type t uses index t+1.
      for(let option=0;option<=buys.length;option++) {
        const t=option-1, after=remaining-(t>=0&&deficits[t]>0?1:0);
        const won=after===0;
        oya.push(won);
        let bits=won?ALL:0;
        if(!won&&after===1&&(mask&(1<<sp))) {
          const missing=deficits.findIndex((d,i)=>d-(i===t?1:0)>0);
          for(let j=0;j<N;j++) if(!(mask&(1<<j))&&labels[j]===missing) bits|=1<<j;
        }
        okami.push(bits);
        units.push(mode==='oya'?Number(won):mode==='okami'?popcount(bits):Number(won)*18+popcount(bits));
      }
      const unionOya=chosenTypes.some(t=>oya[t+1]);
      const unionOkami=chosenTypes.reduce((bits,t)=>bits|okami[t+1],0);
      const result={oya,okami,units,unionOya,unionOkami};
      cache.set(mask,result); return result;
    }
    let freeWays=0,noFreeWays=0,missWays=0;
    for(const [mask,prefix] of prefixes) {
      const hc=countsAt(mask), candidates=chosenTypes.filter(t=>hc[t]<buys[t]);
      const sums=Array(buys.length+1).fill(0), suffixes=[];
      for(let j=0;j<N;j++) {
        const w1=weight(mask,j); if(!w1) continue;
        const m1=mask|(1<<j);
        for(let k=0;k<N;k++) {
          const w2=weight(m1,k); if(!w2) continue;
          const w=w1*w2, result=outcomes(m1|(1<<k));
          sums[0]+=w*result.units[0];
          for(const t of candidates) sums[t+1]+=w*result.units[t+1];
          suffixes.push([w,result]);
        }
      }
      // Choose one free after ball 3, before either remaining ball and before
      // the unknown SP type is revealed. Ties use the first neta, as in 1.0.0.
      let best=candidates[0];
      for(const t of candidates) if(sums[t+1]>sums[best+1]) best=t;
      noFreeWays+=prefix*sums[0];
      freeWays+=prefix*(best===undefined?sums[0]:sums[best+1]);
      if(best!==undefined) for(const [w,result] of suffixes) {
        const oyaMiss=Number(!result.oya[best+1]&&result.unionOya);
        const okamiMiss=popcount(result.unionOkami&~result.okami[best+1]);
        const miss=mode==='oya'?oyaMiss:mode==='okami'?okamiMiss:oyaMiss*18+okamiMiss;
        missWays+=prefix*w*miss;
      }
    }
    const probability=(freeRate*freeWays+(1-freeRate)*noFreeWays)/denominator;
    return {probability,expectedValue:probability*payout/20,freeWays,noFreeWays,missWays,denominator};
  }
  function profitProbability(probability,payout,targetPercent) {
    if(!Number.isFinite(targetPercent)||targetPercent<0||targetPercent>100) throw Error('目標勝率は0〜100％で入力してください。');
    if(!Number.isFinite(payout)||payout<=0) throw Error('黒字の確率を計算するには、配当を0より大きくしてください。');
    const target=targetPercent/100, exactLimit=5000, maxTrials=100000;
    const dp=new Float64Array(exactLimit+1); dp[0]=1;
    for(let n=1;n<=exactLimit;n++) {
      for(let k=n;k>=1;k--) dp[k]=dp[k]*(1-probability)+dp[k-1]*probability;
      dp[0]*=1-probability;
      const minWins=Math.floor(20*n/payout)+1;
      let black=0; for(let k=minWins;k<=n;k++) black+=dp[k];
      if(black>target+1e-14) return {trials:n,probability:black,approximate:false};
    }
    function normalCdf(z) {
      const x=Math.abs(z), t=1/(1+.2316419*x), d=.3989422804014327*Math.exp(-x*x/2);
      const tail=d*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
      return z>=0?1-tail:tail;
    }
    for(let n=exactLimit+1;n<=maxTrials;n++) {
      const minWins=Math.floor(20*n/payout)+1;
      let black=0;
      if(probability>=1) black=payout>20?1:0;
      else if(probability>0&&minWins<=n) black=1-normalCdf((minWins-.5-n*probability)/Math.sqrt(n*probability*(1-probability)));
      if(black>target+1e-14) return {trials:n,probability:black,approximate:true};
    }
    return {trials:null,probability:null,approximate:false};
  }
  return {calculate,profitProbability,weight,prefixWays,popcount};
})();
if(typeof module!=='undefined') module.exports=SushiCalculator;
if(typeof self!=='undefined'&&typeof document==='undefined'&&typeof self.postMessage==='function') {
  self.onmessage=({data})=> {
    try {
      const result=SushiCalculator.calculate(data.input);
      if(data.target!==undefined) result.profit=SushiCalculator.profitProbability(result.probability,data.input.payout,data.target);
      self.postMessage({id:data.id,result});
    }
    catch(error) { self.postMessage({id:data.id,error:error.message}); }
  };
}
