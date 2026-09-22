(function(root){
  'use strict';
  function integer(v, name){
    if(!Number.isSafeInteger(v)||Math.abs(v)>1000000) throw Error(name+'は −1,000,000〜1,000,000 の整数で入力してください。');
    return v;
  }
  // SourceCalc EA 23.347 uses only arithmetic. Never execute source strings as JS.
  function evaluate(formula,p,e){
    if(!formula) return 0;
    const tokens=formula.match(/\d+(?:\.\d+)?|[pe()+*/-]/g)||[];
    if(tokens.join('')!==formula.replace(/\s/g,'')) throw Error('未対応の数式です。');
    let i=0;
    function atom(){const t=tokens[i++]; if(t==='+'||t==='-')return (t==='-'?-1:1)*atom(); if(t==='('){const n=sum();if(tokens[i++]!==')')throw Error('括弧が不正です。');return n;} if(t==='p')return p;if(t==='e')return e;if(t&&/^\d/.test(t))return Number(t);throw Error('数式が不正です。');}
    function product(){let n=atom();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],r=atom();n=op==='*'?n*r:n/r;}return n;}
    function sum(){let n=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],r=product();n=op==='+'?n+r:n-r;}return n;}
    const n=sum();if(i!==tokens.length||!Number.isFinite(n)||n>2147483647||n< -2147483648)throw Error('式の結果が計算可能範囲を超えました。');return Math.trunc(n);
  }
  function curve(a){
    const steps=[];if(a<=400)return {value:a,steps};
    let n=BigInt(a);
    for(let i=0;i<10;i++){const threshold=BigInt(400+i*100);if(n<=threshold)break;const before=Number(n);n=threshold+(n-threshold)*75n/100n;steps.push({threshold:Number(threshold),before,after:Number(n)});}
    return {value:Math.trunc(Math.fround(Number(n))),steps};
  }
  function calculate(input,data){
    const row=data.elements.find(x=>x.id===String(input.spell));if(!row)throw Error('魔法を選択してください。');
    const level=integer(input.level,'魔法レベル'),attribute=integer(input.attribute,'主能力'),enhance=integer(input.enhance,'魔法強化'),anti=integer(input.anti,'反魔法');
    const kind=globalThis.ELIN_TRAITS?.[row.type]?.kind??'spell';
    const base=level*8+50,curved=curve(base),factor=kind==='ability'?100:Math.max(100+enhance-(kind==='breathe'?0:anti),1);
    const power=Math.min(214748364,Number(BigInt(curved.value)*BigInt(factor)/100n));
    let key=row.alias;if(!data.calc.some(x=>x.id===key)&&row.aliasRef)key=row.alias.split('_')[0]+'_';
    const formula=data.calc.find(x=>x.id===key);
    const e=row.aliasParent?attribute:0;
    let dice=null;
    if(formula){const num=Math.max(1,evaluate(formula.num,power,e)),sides=Math.max(1,evaluate(formula.sides,power,e)),bonus=evaluate(formula.bonus,power,e);dice={num,sides,bonus,text:num+'d'+sides+(bonus>0?'+'+bonus:bonus<0?String(bonus):''),empty:!formula.num&&!formula.sides&&!formula.bonus};}
    if(dice&&!dice.empty){dice.min=(BigInt(dice.num)+BigInt(dice.bonus)).toString();dice.max=(BigInt(dice.num)*BigInt(dice.sides)+BigInt(dice.bonus)).toString();}
    return {power,base,curved:curved.value,steps:curved.steps,factor,e,key,formula,dice};
  }
  root.ElinEngine={calculate,evaluate,curve};
  if(typeof module!=='undefined')module.exports=root.ElinEngine;
})(globalThis);

