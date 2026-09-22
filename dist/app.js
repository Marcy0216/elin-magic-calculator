(()=>{
  const data=globalThis.ELIN_DATA,engine=globalThis.ElinEngine,traits=globalThis.ELIN_TRAITS,$=id=>document.getElementById(id);
  const spells=data.elements.filter(r=>['SPELL','ABILITY'].includes(r.group)&&r.category==='ability'&&r.aliasRef!=='mold'&&!r.proc.startsWith('Summon,')&&!['ActBit','ActFunnel'].includes(r.type));
  function name(r){const ref=data.elements.find(e=>e.alias===r.aliasRef);return ref?ref.name_JP+'の'+r.name_JP:r.name_JP;}
  const normal=s=>s.normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
  let selected='';
  let levelSpell='';const spellLevels={};
  function search(){const query=normal($('search').value).trim().split(/\s+/).filter(Boolean),filter=$('kind').value;const matches=spells.filter(r=>(!filter||r.group===filter)&&query.every(q=>normal([name(r),r.name,r.alias,r.id,r.aliasParent].join(' ')).includes(q)));$('spell').replaceChildren(...matches.map(r=>{const o=document.createElement('option');o.value=r.id;o.textContent=name(r)+' ['+r.id+']';return o;}));const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='魔法・アビリティを選択';$('spell').prepend(placeholder);$('searchCount').textContent=matches.length+' 件';if(matches.some(r=>r.id===selected))$('spell').value=selected;else if(query.length&&matches.length){selected=matches[0].id;$('spell').value=selected;}else{$('spell').value='';selected='';}render();}
  function addFeature(label,value){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;dd.className=['対応','適用','あり'].includes(value)?'positive':value==='未確認'?'unknown':'neutral';div.append(dt,dd);$('features').append(div);}
  const yes=v=>v===null||v===undefined?'未確認':v?'対応':'非対応';
  function render(){
    $('statusEffects').replaceChildren();$('statusPanel').hidden=true;
    $('diceRange').textContent='—';$('isAlly').disabled=$('isPC').value==='pc';if($('isAlly').disabled)$('isAlly').value='ally';
    const r=spells.find(x=>x.id===$('spell').value);if(!r){const noMatches=$('spell').options.length===1;$('output').hidden=true;$('error').hidden=!noMatches;$('emptyResult').hidden=noMatches;$('error').textContent='該当する魔法・アビリティがありません。検索語を変えてください。';$('spellMeta').textContent='';return {error:noMatches?'該当なし':'未選択'};}$('emptyResult').hidden=true;
    selected=r.id;const parent=data.elements.find(x=>x.alias===r.aliasParent),t=traits[r.type]??{},kind=t.kind;
    let calcKey=r.alias;if(!data.calc.some(x=>x.id===calcKey)&&r.aliasRef)calcKey=r.alias.split('_')[0]+'_';
    const calc=data.calc.find(x=>x.id===calcKey);$('calcSource').textContent=calc?'Calc：'+calcKey:'対応するCalc行なし';
    for(const key of ['num','sides','bonus'])$('calc-'+key).textContent=calc?(calc[key]||'空欄'):'—';
    $('spellMeta').textContent=r.alias+' / '+(parent?parent.name_JP:'対応主能力なし');$('attribute').value=$('stat-'+r.aliasParent)?.value??'0';$('attribute').disabled=!r.aliasParent;
    if(levelSpell!==r.id){if(!$('level').disabled)spellLevels[levelSpell]=$('level').value;$('level').value=spellLevels[r.id]??'10';levelSpell=r.id;}
    $('level').disabled=false;
    $('levelHint').textContent='キャラクターレベルとは別に、魔法・アビリティごとの補正後レベルを入力してください。';
    $('error').hidden=true;$('output').hidden=false;$('selectedName').textContent=name(r);$('effectDescription').textContent=r.detail_JP?.trim()||'この魔法・アビリティの効果説明は、ソースシートに登録されていません。';$('features').replaceChildren();$('targetType').textContent=({Enemy:'敵',Chara:'キャラクター',Ground:'地面',Neighbor:'自分・隣接',Self:'自分',Select:'選択',Party:'パーティー',SelfParty:'自分・パーティー'})[r.target]||'任意';
    addFeature('連続魔法',yes(t.rapid));addFeature('長押しで反復',yes(t.repeat==='tag'?r.tag.split(',').includes('repeat'):t.repeat));addFeature('魔法強化',kind?kind==='spell'||kind==='breathe'||kind==='song'?'適用':'適用なし':'未確認');addFeature('反魔法による威力低下',kind?kind==='spell'?'あり':'なし':'未確認');addFeature('対応主能力',parent?.name_JP??'なし');addFeature('歌姫',kind==='song'?'適用':'適用なし');addFeature('連続魔法の設定',t.rapid?$('rapid').value:'対象外');
    $('featureNote').textContent=t.rapid?'連続魔法フィートがある場合に追加発動の対象になります。表示ダイスは1回分です。':'適用可否は発動に必要な条件を満たした場合のものです。';
    if(!kind){$('power').textContent='未確認';$('dice').textContent='未確認';$('diceNote').textContent='この種類の計算処理はまだ確認できていません。';return {power:null,dice:null};}
    try{const input={spell:r.id,isPC:$('isPC').value==='pc',isAlly:$('isPC').value==='pc'||$('isAlly').value==='ally',characterLevel:Number($('characterLevel').value)};if(!input.isPC&&($('characterLevel').value.trim()===''||!Number.isInteger(input.characterLevel)))throw Error('キャラクターレベルを整数で入力してください。');for(const key of ['level','attribute','enhance','anti','music','diva']){if($(key).value.trim()==='')throw Error('すべての数値を入力してください。');input[key]=Number($(key).value);}input.charisma=Number($('stat-CHA').value);if($('stat-CHA').value.trim()==='')throw Error('魅力を入力してください。');const result=engine.calculate(input,data);showStatusEffects(result.statusEffects);if(result.dice&&!result.dice.empty){$('diceRange').textContent=BigInt(result.dice.min).toLocaleString('ja-JP')+' 〜 '+BigInt(result.dice.max).toLocaleString('ja-JP');}$('power').textContent=result.power.toLocaleString('ja-JP');$('dice').textContent=result.dice&&!result.dice.empty?result.dice.text:'—';$('diceNote').textContent=result.dice&&!result.dice.empty?'耐性などを適用する前のダイスです。':'この効果には表示できるダイスがありません。';return result;}catch(e){$('error').textContent=e.message;$('error').hidden=false;$('power').textContent='—';$('dice').textContent='—';$('diceNote').textContent='';return {error:e.message};}
  }
  function showStatusEffects(effects){
    $('statusPanel').hidden=!effects.length;
    for(const effect of effects){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=effect.name;dd.textContent=effect.text??((effect.value>=0?'+':'')+effect.value.toLocaleString('ja-JP')+effect.unit);div.append(dt,dd);$('statusEffects').append(div);}
  }
  const profileIds=['isPC','isAlly','characterLevel','enhance','anti','music','diva','rapid',"stat-STR","stat-END","stat-DEX","stat-PER","stat-LER","stat-WIL","stat-MAG","stat-CHA","stat-LUC","stat-SPD"];
  try{const saved=JSON.parse(localStorage.getItem('elin-character-v1')||'{}');for(const id of profileIds)if(typeof saved[id]==='string')$(id).value=saved[id];}catch{}
  $('form').addEventListener('input',()=>{try{localStorage.setItem('elin-character-v1',JSON.stringify(Object.fromEntries(profileIds.map(id=>[id,$(id).value]))));}catch{}});
  $('search').addEventListener('input',search);$('kind').addEventListener('change',search);$('form').addEventListener('input',e=>{if(!['search','kind'].includes(e.target.id))render();});$('form').addEventListener('submit',e=>e.preventDefault());search();
  if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'calculate_spell',description:'魔法またはアビリティを選び、出力と適用可否を表示します。',inputSchema:{type:'object',properties:{spell:{type:'string'},level:{type:'integer'},attribute:{type:'integer'},enhance:{type:'integer'},anti:{type:'integer'}},required:['spell','level','attribute','enhance','anti'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){const r=spells.find(x=>x.id===input.spell);if(!r||!traits[r.type]?.kind)throw Error('未対応の計算です。');engine.calculate(input,data);selected=input.spell;levelSpell=input.spell;$('search').value='';$('kind').value='';for(const key of ['level','enhance','anti'])$(key).value=input[key];if($('stat-'+r.aliasParent))$('stat-'+r.aliasParent).value=input.attribute;search();const result=render();return {power:result.power,dice:result.dice?.text??null};}})).catch(()=>{});}catch{}}
})();

