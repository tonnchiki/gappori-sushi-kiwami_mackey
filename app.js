'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const {presets,names,letter,nextNumber,buildLayout}=SushiLayouts;
  const palette=[['#157d75','#ecf7f4'],['#3977a9','#eef5fc'],['#9b6baf','#f7f0fa'],['#c77b32','#fff5ea'],['#ba5c76','#fff0f4'],['#6f8840','#f3f7e9'],['#5b6dab','#f0f2fb']];
  let current=presets[0], gap=current.groups.length-1, buys=current.groups.map(()=>0), job=0,worker=null;
  const pct=n=>(n*100).toLocaleString('ja-JP',{minimumFractionDigits:2,maximumFractionDigits:4})+'%';
  const number=n=>n.toLocaleString('ja-JP');
  function setColors(element,i) { element.style.setProperty('--color',palette[i][0]); element.style.setProperty('--tint',palette[i][1]); }
  function message(text,error=false) { $('status').textContent=text; $('status').className='status'+(error?' error':''); }
  function cancelJob() {
    job++;
    if(worker) { worker.terminate(); worker=null; }
    $('calculate').disabled=false; $('calculateProfitProbability').disabled=false;
    $('calculate').textContent='期待値を計算する';
  }
  function invalidate() {
    cancelJob();
    ['winRate','expectedValue','freeWinWays','noFreeWinWays','freeMissWays','requiredTrials','profitProbabilityResult'].forEach(id=>$(id).textContent='—');
    $('resultSummary').textContent='';
    $('profitProbabilityStatus').textContent='現在の配置・買い方・フリー率・配当で計算します。';
    $('profitProbabilityStatus').className='muted';
    message('設定を変更しました。「期待値を計算する」を押してください。');
  }
  function boundaryName(i) { return `${letter(i)}（${current.groups[i]}穴）と${letter((i+1)%current.groups.length)}（${current.groups[(i+1)%current.groups.length]}穴）の間${i===current.groups.length-1?'・末尾↔先頭':''}`; }
  function renderBoard() {
    const board=$('blockBoard'); board.replaceChildren();
    current.groups.forEach((n,i)=> {
      const unit=document.createElement('div'); unit.className='block-unit';
      const block=document.createElement('div'); block.className='neta-block'; setColors(block,i);
      block.setAttribute('aria-label',`${letter(i)}：${n}穴`);
      const label=document.createElement('div'); label.className='neta-name'; label.textContent=`${letter(i)} · ${n}穴`;
      const holes=document.createElement('div'); holes.className='holes'; holes.setAttribute('aria-hidden','true');
      for(let j=0;j<n;j++) { const hole=document.createElement('span'); hole.className='hole'; holes.append(hole); }
      block.append(label,holes);
      const button=document.createElement('button'); button.type='button'; button.className='gap-button';
      button.setAttribute('aria-label',`SPを${boundaryName(i)}に置く`); button.setAttribute('aria-pressed',String(i===gap));
      const icon=document.createElement('span'); icon.className='gap-icon'; icon.setAttribute('aria-hidden','true'); icon.textContent=i===gap?'☆':'＋';
      const text=document.createElement('span'); text.className='gap-label'; text.textContent=i===gap?'SP':i===current.groups.length-1?'↔ A':'境目';
      button.append(icon,text);
      button.addEventListener('click',()=> {
        gap=i; $('spGap').value=String(gap); invalidate(); renderBoard();
        // Keep keyboard focus on the boundary that was just selected.
        board.querySelectorAll('.gap-button')[i].focus({preventScroll:true});
      });
      unit.append(block,button); board.append(unit);
    });
    renderRing();
  }
  function renderRing() {
    const labels=buildLayout(current.groups,gap), ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg'); svg.setAttribute('viewBox','0 0 340 340'); svg.setAttribute('role','img');
    const title=document.createElementNS(ns,'title'); title.textContent='時計回りの18穴配置。'+labels.map((x,i)=>`${i+1}:${x<0?'SP':letter(x)}`).join('、'); svg.append(title);
    const track=document.createElementNS(ns,'circle'); track.setAttribute('cx','170'); track.setAttribute('cy','170'); track.setAttribute('r','133'); track.setAttribute('fill','none'); track.setAttribute('stroke','#e0e9e3'); track.setAttribute('stroke-width','2'); svg.append(track);
    labels.forEach((t,i)=> {
      const a=(i*20-90)*Math.PI/180, x=170+133*Math.cos(a),y=170+133*Math.sin(a);
      const circle=document.createElementNS(ns,'circle'); circle.setAttribute('cx',x); circle.setAttribute('cy',y); circle.setAttribute('r','16'); circle.setAttribute('fill',t<0?'#fff3c7':palette[t][1]); circle.setAttribute('stroke',t<0?'#b47b0b':palette[t][0]); circle.setAttribute('stroke-width','2');
      const text=document.createElementNS(ns,'text'); text.setAttribute('x',x);text.setAttribute('y',y+5);text.setAttribute('text-anchor','middle');text.setAttribute('font-size','13');text.setAttribute('font-weight','700');text.setAttribute('fill',t<0?'#8b5b00':palette[t][0]);text.textContent=t<0?'☆':letter(t);
      svg.append(circle,text);
    });
    const center=document.createElementNS(ns,'text');center.setAttribute('x','170');center.setAttribute('y','166');center.setAttribute('text-anchor','middle');center.setAttribute('font-size','19');center.setAttribute('fill','#173c3d');center.setAttribute('font-weight','700');center.textContent=names[$('spType').value];svg.append(center);
    const arrow=document.createElementNS(ns,'text');arrow.setAttribute('x','170');arrow.setAttribute('y','192');arrow.setAttribute('text-anchor','middle');arrow.setAttribute('font-size','13');arrow.setAttribute('fill','#5a716d');arrow.textContent='時計回り ↻';svg.append(arrow);
    $('ring').replaceChildren(svg);
  }
  function updateTotal() {
    const total=buys.reduce((a,b)=>a+(Number.isFinite(b)?b:0),0);
    $('buyTotal').textContent=`合計 ${number(total)} / 5個`;
    $('buyTotal').className='badge'+(total===5?' complete':'');
  }
  function renderBuys() {
    const cards=$('buyCards'); cards.replaceChildren();
    current.groups.forEach((n,i)=> {
      const card=document.createElement('div'); card.className='buy-card'; setColors(card,i);
      const label=document.createElement('label');label.htmlFor=`buy-${i}`;label.append(document.createTextNode(`ネタ${letter(i)}`));
      const count=document.createElement('span');count.textContent=`${n}穴`;label.append(count);
      const stepper=document.createElement('div');stepper.className='buy-stepper';
      const input=document.createElement('input');input.id=`buy-${i}`;input.type='number';input.min='0';input.max=String(Math.min(5,n));input.step='1';input.inputMode='numeric';input.value=String(buys[i]);input.setAttribute('aria-label',`ネタ${letter(i)}の購入数`);
      function change() { buys[i]=input.value===''?NaN:Number(input.value);input.setAttribute('aria-invalid',String(!Number.isInteger(buys[i])||buys[i]<0||buys[i]>Math.min(5,n)));updateTotal();invalidate(); }
      const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label',`ネタ${letter(i)}を1個減らす`);minus.addEventListener('click',()=>{input.value=String(Math.max(0,(Number(input.value)||0)-1));change();});
      const plus=document.createElement('button');plus.type='button';plus.textContent='＋';plus.setAttribute('aria-label',`ネタ${letter(i)}を1個増やす`);plus.addEventListener('click',()=>{input.value=String(Math.min(5,n,(Number(input.value)||0)+1));change();});
      input.addEventListener('input',change);stepper.append(minus,input,plus);card.append(label,stepper);cards.append(card);
    });
    updateTotal();
  }
  function selectPreset(n) {
    if(!Number.isInteger(n)||n<1||n>29) { invalidate();$('presetNumber').setAttribute('aria-invalid','true');message('配置番号は1〜29の整数を入力してください。',true);return; }
    current=presets[n-1];buys=current.groups.map(()=>0);gap=current.groups.length-1;
    $('presetNumber').value=String(n);$('presetNumber').setAttribute('aria-invalid','false');
    $('presetLabel').textContent=`配置 ${n}`;$('presetDigits').textContent=current.groups.join('・');$('spType').value=current.mode;
    $('spGap').replaceChildren(...current.groups.map((_,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=boundaryName(i);return option;}));
    $('spGap').value=String(gap);invalidate();renderBoard();renderBuys();message('SPの位置を実機に合わせ、購入数を合計5個にしてください。');
  }
  function numberValue(id,label,min,max=Infinity) {
    const raw=$(id).value.trim(),n=Number(raw);
    if(raw===''||!Number.isFinite(n)||n<min||n>max) throw Error(`${label}は${min}${max===Infinity?'以上':`〜${max}`}の数値を入力してください。`);
    return n;
  }
  function snapshot() {
    const n=numberValue('presetNumber','配置番号',1,29);
    if(!Number.isInteger(n)||n!==current.number) throw Error('配置番号は1〜29の整数を入力してください。');
    if(buys.some((n,i)=>!Number.isInteger(n)||n<0||n>current.groups[i])) throw Error('各ネタの購入数は、穴数以下の0以上の整数にしてください。');
    if(buys.reduce((a,b)=>a+b,0)!==5) throw Error('購入数の合計を5個にしてください。');
    return {labels:buildLayout(current.groups,gap),buys:[...buys],mode:$('spType').value,freeRate:numberValue('freeRate','フリー率',0,100)/100,payout:numberValue('payout','配当',0)};
  }
  function renderResult(result,input) {
    $('winRate').textContent=pct(result.probability);$('expectedValue').textContent=pct(result.expectedValue);
    for(const [id,key] of [['freeWinWays','freeWays'],['noFreeWinWays','noFreeWays'],['freeMissWays','missWays']]) $(id).textContent=`${number(result[key])} / ${number(result.denominator)}`;
    const purchased=input.buys.map((n,i)=>n?`${letter(i)}を${n}個`:null).filter(Boolean).join('・');
    $('resultSummary').textContent=`配置${current.number} / ${names[input.mode]} / ☆：${boundaryName(gap)} / ${purchased} / フリー率${input.freeRate*100}% / 配当${number(input.payout)}`;
    message('計算完了。表示中の配置とSPの位置を反映しました。');$('status').classList.add('success');
  }
  function calculate(withProfit=false) {
    let input,target;
    try { input=snapshot();if(withProfit) {target=numberValue('targetWinProbability','目標勝率',0,100);if(input.payout<=0)throw Error('黒字の確率を計算するには、配当を0より大きくしてください。');} }
    catch(error) { invalidate();message(error.message,true);if(withProfit){$('profitProbabilityStatus').textContent=error.message;$('profitProbabilityStatus').className='muted error';}return; }
    cancelJob();const id=job;
    $('calculate').disabled=true;$('calculateProfitProbability').disabled=true;$('calculate').textContent='計算中…';
    message('配置をもとに、3球後の最適なフリー選択を計算しています…');
    if(withProfit) $('profitProbabilityStatus').textContent='当選率と必要な試行回数を計算しています…';
    try {
      worker=new Worker('calculator.js?v=1.1.0');
      worker.onmessage=({data})=> {
        if(data.id!==job) return;
        cancelJob();
        if(data.error) {message(data.error,true);if(withProfit)$('profitProbabilityStatus').textContent=data.error;return;}
        renderResult(data.result,input);
        if(withProfit) {
          const p=data.result.profit;
          $('requiredTrials').textContent=p.trials===null?'見つかりません':`${number(p.trials)}回`;
          $('profitProbabilityResult').textContent=p.probability===null?'—':pct(p.probability);
          $('profitProbabilityStatus').textContent=p.trials===null?'100,000回以内では目標勝率を上回りませんでした。':`目標${target}%を初めて上回るのは${number(p.trials)}回目です。${p.approximate?'正規近似':'二項分布の厳密計算'}による結果です。`;
        }
      };
      worker.onerror=()=>{if(id!==job)return;cancelJob();message('計算の読み込みに失敗しました。ページを再読み込みしてください。',true);if(withProfit)$('profitProbabilityStatus').textContent='計算の読み込みに失敗しました。';};
      worker.postMessage({id,input,...(withProfit?{target}:{})});
    } catch(error) {cancelJob();message('計算を開始できませんでした。対応ブラウザでページを再読み込みしてください。',true);}
  }
  function changePresetNumber() {
    const raw=$('presetNumber').value.trim(), n=Number(raw);
    if(raw===''||!Number.isInteger(n)||n<1||n>29) {invalidate();$('presetNumber').setAttribute('aria-invalid','true');message('配置番号は1〜29の整数を入力してください。',true);return;}
    if(n!==current.number) selectPreset(n);
    else $('presetNumber').setAttribute('aria-invalid','false');
  }
  $('presetNumber').addEventListener('input',changePresetNumber);
  $('presetNumber').addEventListener('change',changePresetNumber);
  $('nextPreset').addEventListener('click',()=>selectPreset(nextNumber(current.number)));
  $('spGap').addEventListener('change',()=>{gap=Number($('spGap').value);invalidate();renderBoard();});
  $('spType').addEventListener('change',()=>{invalidate();renderRing();});
  ['freeRate','payout'].forEach(id=>$(id).addEventListener('input',invalidate));
  $('targetWinProbability').addEventListener('input',()=>{cancelJob();$('requiredTrials').textContent='—';$('profitProbabilityResult').textContent='—';$('profitProbabilityStatus').textContent='目標勝率を変更しました。必要な回数を再計算してください。';});
  $('calculate').addEventListener('click',()=>calculate());
  $('calculateProfitProbability').addEventListener('click',()=>calculate(true));
  selectPreset(1);
})();
