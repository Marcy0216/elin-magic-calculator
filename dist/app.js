(()=>{
  const data=globalThis.ELIN_DATA,engine=globalThis.ElinEngine,traits=globalThis.ELIN_TRAITS,$=id=>document.getElementById(id);
  const spells=data.elements.filter(r=>['SPELL','ABILITY'].includes(r.group)&&r.category==='ability'&&r.aliasRef!=='mold');
  function name(r){const ref=data.elements.find(e=>e.alias===r.aliasRef);return ref?ref.name_JP+'の'+r.name_JP:r.name_JP;}
  const normal=s=>s.normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
  let selected='50500';
  function search(){const query=normal($('search').value).trim().split(/\s+/).filter(Boolean),filter=$('kind').value;const matches=spells.filter(r=>(!filter||r.group===filter)&&query.every(q=>normal([name(r),r.name,r.alias,r.id,r.aliasParent].join(' ')).includes(q)));$('spell').replaceChildren(...matches.map(r=>{const o=document.createElement('option');o.value=r.id;o.textContent=name(r)+' ['+r.id+']';return o;}));$('searchCount').textContent=matches.length+' 件';if(matches.some(r=>r.id===selected))$('spell').value=selected;else if(matches.length)selected=$('spell').value;render();}
  function addFeature(label,value){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;div.append(dt,dd);$('features').append(div);}
  const yes=v=>v===null||v===undefined?'未確認':v?'対応':'非対応';
  function render(){
    const r=spells.find(x=>x.id===$('spell').value);if(!r){$('output').hidden=true;$('error').hidden=false;$('error').textContent='該当する魔法・アビリティがありません。検索語を変えてください。';$('spellMeta').textContent='';return {error:'該当なし'};}
    selected=r.id;const parent=data.elements.find(x=>x.alias===r.aliasParent),t=traits[r.type]??{},kind=t.kind;
    $('spellMeta').textContent=r.alias+' / '+(parent?parent.name_JP:'対応主能力なし');$('attributeLabel').textContent=parent?parent.name_JP+'（補正後）':'主能力（未使用）';$('attribute').disabled=!r.aliasParent;
    $('levelLabel').textContent=(r.group==='SPELL'?'魔法':'アビリティ')+'レベル（補正後）';$('enhance').disabled=kind==='ability';$('anti').disabled=kind!=='spell';
    $('error').hidden=true;$('output').hidden=false;$('selectedName').textContent=name(r);$('features').replaceChildren();
    addFeature('連続魔法',yes(t.rapid));addFeature('自動発動',yes(t.auto));addFeature('長押しで反復',yes(t.repeat==='tag'?r.tag.split(',').includes('repeat'):t.repeat));addFeature('魔法強化',kind?kind==='spell'||kind==='breathe'?'適用':'適用なし':'未確認');addFeature('反魔法による威力低下',kind?kind==='spell'?'あり':'なし':'未確認');addFeature('対応主能力',parent?.name_JP??'なし');
    $('featureNote').textContent=t.rapid?'連続魔法フィートがある場合に追加発動の対象になります。表示ダイスは1回分です。':'適用可否は発動に必要な条件を満たした場合のものです。';
    if(!kind){$('power').textContent='未確認';$('dice').textContent='未確認';$('diceNote').textContent='この種類の計算処理はまだ確認できていません。';return {power:null,dice:null};}
    try{const input={spell:r.id};for(const key of ['level','attribute','enhance','anti']){if($(key).value.trim()===''&&!$(key).disabled)throw Error('すべての数値を入力してください。');input[key]=$(key).disabled?0:Number($(key).value);}const result=engine.calculate(input,data);$('power').textContent=result.power.toLocaleString('ja-JP');$('dice').textContent=result.dice&&!result.dice.empty?result.dice.text:'—';$('diceNote').textContent=result.dice&&!result.dice.empty?'耐性などを適用する前のダイスです。':'この効果には表示できるダイスがありません。';return result;}catch(e){$('error').textContent=e.message;$('error').hidden=false;$('power').textContent='—';$('dice').textContent='—';$('diceNote').textContent='';return {error:e.message};}
  }
  $('search').addEventListener('input',search);$('kind').addEventListener('change',search);$('form').addEventListener('input',e=>{if(!['search','kind'].includes(e.target.id))render();});$('form').addEventListener('submit',e=>e.preventDefault());search();
  if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'calculate_spell',description:'魔法またはアビリティを選び、出力と適用可否を表示します。',inputSchema:{type:'object',properties:{spell:{type:'string'},level:{type:'integer'},attribute:{type:'integer'},enhance:{type:'integer'},anti:{type:'integer'}},required:['spell','level','attribute','enhance','anti'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){const r=spells.find(x=>x.id===input.spell);if(!r||!traits[r.type]?.kind)throw Error('未対応の計算です。');engine.calculate(input,data);selected=input.spell;$('search').value='';$('kind').value='';for(const key of ['level','attribute','enhance','anti'])$(key).value=input[key];search();const result=render();return {power:result.power,dice:result.dice?.text??null};}})).catch(()=>{});}catch{}}
})();

