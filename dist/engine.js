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
  function curve(a,start=400,step=100,rate=75){
    const steps=[];if(a<=start)return {value:a,steps};
    let n=BigInt(a);
    for(let i=0;i<10;i++){const threshold=BigInt(start+i*step);if(n<=threshold)break;const before=Number(n);n=threshold+(n-threshold)*BigInt(rate)/100n;steps.push({threshold:Number(threshold),before,after:Number(n)});}
    return {value:Math.trunc(Math.fround(Number(n))),steps};
  }
  function statusEffects(row,power,data,charisma,diva=0){
    const effects=[...(row.codeEffects||[])];
    const songRefs={6750:['StanceSongSleep'],6751:['StanceSongSleep'],6752:['StanceSongValor','ConSongValor'],6753:['StanceSongEnd'],6754:['StanceSongPebble','ConSongPebble']};
    const refs=(row.textExtra_JP||'').split(',').filter(s=>s.startsWith('@')).concat((songRefs[row.id]||[]).map(s=>'@'+s));
    for(const ref of refs){
      const stat=data.stats?.find(s=>s.alias===ref.slice(1));if(!stat)continue;
      if(stat.alias==='ConBuffStats'&&['8510','8710','6902'].includes(row.id)){
        const p=row.id==='8710'?Math.abs(power):power;
        if(p<0){effects.push({name:'速度',text:'このPowerでは計算できません'});continue;}
        const sqrt=Math.fround(Math.sqrt(Math.fround(p)));
        const amount=row.id==='6902'?100+Math.trunc(sqrt)*2:Math.trunc(Math.max(5,Math.fround(Math.fround(sqrt*1.5)+20)));
        effects.push({name:'速度',value:amount*(row.id==='8710'?-1:1),unit:''});
      }
      const fields=stat.elements?stat.elements.split(','):[];
      for(let i=0;i<fields.length;i+=2){
        let alias=fields[i];const formula=fields[i+1];
        if(alias==='ele')alias=row.aliasRef;
        if(alias==='res')alias=data.statElements.find(e=>e.alias===row.aliasRef)?.aliasRef;
        const element=data.statElements.find(e=>e.alias===alias);
        const name=(stat.alias.startsWith('StanceSong')?'歌唱者：':stat.alias.startsWith('ConSong')?'周囲の味方：':'')+(element?.name_JP||alias||fields[i]);
        if(stat.alias==='ConSongPebble'&&formula.includes('p2')){effects.push({name,text:'初回 +1% ／歌姫反映後 +'+(1+diva)+'%（効果の再計算時）'});continue;}
        if(formula.includes('p2')&&charisma===undefined){effects.push({name,text:'魅力に依存（現在の入力では未算出）'});continue;}
        effects.push({name,value:evaluate(formula.replaceAll('p2',String(charisma??0)),power,0),unit:element?.tag.split(',').includes('ratio')?'%':''});
      }
      if(stat.alias==='ConWeakness')effects.push({name:'DV・PV',text:'半減（50%）'});
      if(!fields.length&&stat.detail_JP&&stat.alias!=='ConBuffStats')effects.push({name:stat.name_JP||stat.alias,text:stat.detail_JP});
    }
    for(const text of (row.textExtra_JP||'').split(',').filter(s=>s&&!s.startsWith('@')&&!s.includes('#')))effects.push({name:'補足',text});
    if(songRefs[row.id]){
      effects.push({name:'効果範囲',text:'半径4マス（死亡・睡眠中の対象を除く）'},{name:'歌の発動条件',text:'地域マップ外・歌唱者が沈黙していない間、毎ターン判定'});
      const chance=rate=>Math.max(0,Math.min(100,Math.trunc(rate*Math.min(Math.trunc(power/4),100)/100)));
      if(['6750','6751'].includes(row.id))effects.push({name:'睡眠付与の判定',text:'通常の敵 '+chance(30)+'% ／強敵 '+chance(10)+'%（毎ターン）'},{name:'睡眠の付与Power',text:String(50+Math.trunc(power/2))});
      if(row.id==='6751')effects.push({name:'実装上の効果',text:'このソース版では子守唄と同じ睡眠処理を使用'});
      if(row.id==='6753')effects.push({name:'攻撃発動率',text:chance(30)+'%（敵ごと・毎ターン）'},{name:'追加攻撃',text:'電撃の手 50%・冷気の手 25%・火炎の手 25%。魅力をアビリティレベルとして発動'},{name:'平和なエリア',text:'PC陣営・配下の歌唱者は攻撃を発動しない'});
      if(['6752','6754'].includes(row.id))effects.push({name:'歌の補正の持続',text:'初回10ターン ／更新時 '+(10+diva*2)+'ターン'},{name:'効果対象',text:'PC陣営・配下は同陣営と配下。それ以外は歌唱者に敵対しない相手'});
    }
    return effects;
  }
  function calculate(input,data){
    const row=data.elements.find(x=>x.id===String(input.spell));if(!row)throw Error('魔法を選択してください。');
    const level=integer(input.level,'魔法レベル'),attribute=integer(input.attribute,'主能力'),enhance=integer(input.enhance,'魔法強化'),anti=integer(input.anti,'反魔法');
    const kind=globalThis.ELIN_TRAITS?.[row.type]?.kind??'spell';
    let base=level*8+50;
    if(input.isPC===false){const lv=integer(input.characterLevel,'キャラクターレベル');base=Math.max(base,lv*6+30);if(input.isAlly&&row.aliasParent)base=Math.max(base,attribute*4+30);}
    const curved=curve(base),factor=kind==='ability'?100:Math.max(100+enhance-(kind==='breathe'?0:anti),1);
    let power=Math.min(214748364,Number(BigInt(curved.value)*BigInt(factor)/100n));
    if(kind==='song'){
      const music=integer(input.music??0,'演奏'),diva=integer(input.diva??0,'歌姫');
      power=Math.min(214748364,Number(BigInt(curved.value)*BigInt(Math.max(100+Math.trunc(enhance/3),1))/100n*BigInt(Math.max(1,Math.min(300,50+curve(music,50,10,50).value*2)))/100n*BigInt(100+diva*20)/100n));
    }
    if(input.charisma!==undefined)integer(input.charisma,'魅力');
    let key=row.alias;if(!data.calc.some(x=>x.id===key)&&row.aliasRef)key=row.alias.split('_')[0]+'_';
    const formula=data.calc.find(x=>x.id===key);
    const e=row.aliasParent?attribute:0;
    let dice=null;
    if(formula){const num=Math.max(1,evaluate(formula.num,power,e)),sides=Math.max(1,evaluate(formula.sides,power,e)),bonus=evaluate(formula.bonus,power,e);dice={num,sides,bonus,text:num+'d'+sides+(bonus>0?'+'+bonus:bonus<0?String(bonus):''),empty:!formula.num&&!formula.sides&&!formula.bonus};}
    if(dice&&!dice.empty){dice.min=(BigInt(dice.num)+BigInt(dice.bonus)).toString();dice.max=(BigInt(dice.num)*BigInt(dice.sides)+BigInt(dice.bonus)).toString();}
    return {power,base,curved:curved.value,steps:curved.steps,factor,e,key,formula,dice,statusEffects:statusEffects(row,power,data,input.charisma,input.diva??0)};
  }
  root.ElinEngine={calculate,evaluate,curve,statusEffects};
  if(typeof module!=='undefined')module.exports=root.ElinEngine;
})(globalThis);

