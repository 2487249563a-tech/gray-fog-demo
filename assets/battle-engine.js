/* 灰雾手机关卡：纯数据战斗。数值来源与试玩假设见 ../实现说明.md。 */
'use strict';
(function(root){
const CARDS={};
function card(id,name,cost,type,description,toHim,data={}){CARDS[id]={id,name,cost,type,rarity:'普通',description,toHim:toHim||'心跳 +2；不结算牌面',...data};}
card('C_001','怼回去',1,'attack','造成 6 伤害',null,{damage:6});
card('C_002','厚脸皮',1,'defend','获得 5 脸皮',null,{block:5});
card('C_003','深呼吸',1,'draw','获得 2 脸皮；抽 2 张',null,{block:2,draw:2});
card('C_GY01','搭把手',1,'defend','获得 6 脸皮；绳结 +2',null,{block:6,knots:2});
card('GW_TIE','系紧',1,'attack','造成 3 伤害；获得 3 脸皮','本回合分担 +5%；绳结 +2；心跳 +1',{damage:3,block:3,special:'tie'});
card('C_IA01','击掌',1,'interaction','造成 7 伤害；不加心跳','心跳 +2',{damage:7,rarity:'蓝'});
card('C_IA07','问他累不累',1,'interaction','造成 5 伤害；回复 3 生命值','回复 3 生命值；心跳 +2',{damage:5,heal:3,rarity:'蓝'});
card('C_IA13','戳他脸',0,'interaction','造成 4 伤害；易伤 1 回合','心跳 +2',{damage:4,vulnerable:1,rarity:'蓝'});
card('C_010','阴阳怪气',1,'attack','造成 4 伤害；易伤 2 回合',null,{damage:4,vulnerable:2});
card('C_011','灵魂反问',2,'attack','造成 13 伤害',null,{damage:13});
card('C_013','嘴替',0,'attack','造成 3 伤害',null,{damage:3});
card('C_020','你说得对',1,'defend','获得 6 脸皮；敌人虚弱 1 回合',null,{block:6,weak:1});
card('C_021','已读不回',0,'defend','获得 3 脸皮',null,{block:3});
card('C_GY02','顶回去',1,'attack','6 伤害 + 绳结数（最多 +10）',null,{damage:6,special:'counter'});
card('C_GY03','站稳了',2,'defend','获得 12 脸皮；下回合 4 脸皮',null,{block:12,nextBlock:4});
card('C_GY04','喝口热水',1,'defend','回复 3 生命值；获得 3 脸皮',null,{heal:3,block:3});
card('C_GY06','回头看他',0,'draw','抽 1 张；心跳 +1','心跳 +3；不抽牌',{draw:1,special:'look'});
card('GW_MEMORY','手还记得',1,'attack','造成 6 伤害','他获得 6 脸皮；绳结 −3；心跳 +2',{damage:6,special:'memory',rarity:'种子'});
// 仅第一轮初值，未替换正式数值或经济。招式按 v6 §2.9 倍率。
const LEVELS={
 tutorial:{day:0,name:'序幕 · 雾里的人',enemy:'雾里的人',art:'en_fog_man',bg:'b01_forest',hp:24,attack:5,kind:'tutorial',hint:'你刚醒来。这一场只操作高岩的牌：点选手牌，再点「打出」。'},
 d1:{day:1,name:'第 1 天 · 雾林',enemy:'雾里的鹿',art:'en_fog_deer',bg:'b01_forest',hp:30,attack:6,kind:'normal',hint:'你加入战斗。用厚脸皮挡住攻击，再寻找反击的机会。'},
 d2:{day:2,name:'第 2 天 · 溪边',enemy:'雾里的人',art:'en_fog_man',bg:'bg_battle_stream',hp:36,attack:7,kind:'normal',hint:'心契进度出现了。击掌已加入牌组；点选牌后，也可以「打给他」。'},
 d3:{day:3,name:'第 3 天 · 风口',enemy:'雾鸦群',art:'en_fog_crows',bg:'b01_forest',hp:39,attack:8,kind:'normal',hint:'雾鸦会连续攻击。头顶的意图会显示每段伤害和段数。'},
 d4:{day:4,name:'第 4 天 · 守路的雾',enemy:'守路的雾',art:'en_road_fog',bg:'b01_forest',hp:62,attack:10,kind:'elite',hint:'精英挡在木屋前。它蓄力时不攻击，下一回合会重击。'},
 d5:{day:5,name:'第 5 天 · 结冰的坡',enemy:'冻住的回声',art:'en_frozen_echo',bg:'b09_slope',hp:44,attack:8,kind:'normal',hint:'可以牵手了。心契到 5 时发动，本回合和下回合的攻击每段 +3。'},
 d6:{day:6,name:'第 6 天 · 山顶之前',enemy:'雾鸦群',art:'en_fog_crows',bg:'b01_forest',hp:48,attack:9,kind:'normal',hint:'先看意图，再安排勇气。战斗之后，和他上山看云。'},
 d7:{day:7,name:'第 7 天 · 第一位神使',enemy:'第一位神使',art:'npc_envoy',bg:'b11_pass_dusk',hp:90,attack:12,kind:'boss',hint:'首领会蓄力、连击。牵手和他的主动，每次使用都很关键。'}
};
const startDeck=()=>['C_001','C_001','C_001','C_001','C_002','C_002','C_002','C_002','C_003','C_GY01'];
const clone=x=>JSON.parse(JSON.stringify(x));
function random(b){b.rng=(Math.imul(b.rng,1664525)+1013904223)>>>0;return b.rng/4294967296;}
function shuffle(b,a){for(let i=a.length-1;i>0;i--){const j=Math.floor(random(b)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function emit(b,type,text,amount){b.events.push({type,text,amount:amount??null});b.events=b.events.slice(-18);}
function heart(b,n){if(!b.heartUnlocked)return;const gain=Math.min(n,6-b.heartGain,5-b.heart);b.heart+=gain;b.heartGain+=gain;}
function knots(b,n){if(b.level==='tutorial')return;b.knots=Math.max(0,Math.min(20,b.knots+n));}
function heal(b,n){const amount=Math.min(n,25-b.healed,b.maxHp-b.hp);b.hp+=amount;b.healed+=amount;if(amount)emit(b,'heal','回复 '+amount+' 生命值',amount);}
function draw(b,n,extra=false){if(extra){n=Math.min(n,5-b.extraDraw);b.extraDraw+=n;}for(let i=0;i<n&&b.hand.length<10;i++){if(!b.draw.length){b.draw=shuffle(b,b.discard.splice(0));if(!b.draw.length)break;}b.hand.push(b.draw.pop());}}
function intent(b){const l=LEVELS[b.level],strong=['elite','boss'].includes(l.kind),e=b.enemies[0];
 const normal=[{name:'扑来',kind:'attack',damage:l.attack,hits:1},{name:'连击',kind:'attack',damage:Math.round(l.attack*.55),hits:2},{name:'凝雾',kind:'guard',damage:Math.round(l.attack*.5),hits:1,block:Math.round(l.attack*.6)}];
 const big=[{name:'压近',kind:'attack',damage:l.attack,hits:1},{name:'蓄力',kind:'charge',damage:0,hits:0,block:Math.round(l.attack*.8),nextDamage:Math.round(l.attack*(l.kind==='boss'?1.8:1.7))},{name:'重击',kind:'attack',damage:Math.round(l.attack*(l.kind==='boss'?1.8:1.7)),hits:1},{name:'连击',kind:'attack',damage:Math.round(l.attack*(l.kind==='boss'?.4:.5)),hits:l.kind==='boss'?3:2}];
 if(b.level==='d7'&&b.ask)big.push({name:'循味',kind:'attack',damage:9,hits:2});
 const moves=strong?big:normal;e.intent=clone(moves[(b.turn-1)%moves.length]);e.nextIntent=clone(moves[b.turn%moves.length]);}
function create(level,options={}){if(!LEVELS[level])throw Error('未知关卡');const l=LEVELS[level],tutorial=level==='tutorial';let deck=tutorial?startDeck().filter(x=>x!=='C_GY01'):options.deck||startDeck().concat('GW_TIE');
 const b={level,day:l.day,rng:(options.seed||100+l.day)>>>0,hp:70,maxHp:70,block:3+Math.floor((options.mem||0)/2),courage:3,heart:0,knots:0,turn:1,status:'playing',hand:[],draw:[],discard:[],heartUnlocked:l.day>=2,handUnlocked:l.day>=5,handUsed:false,handUpgrade:!!options.handUpgrade,handUntil:0,heartGain:0,extraDraw:0,healed:0,light:options.light??80,ask:!!options.ask,skillId:options.activeSkill||null,skillCooldown:0,skillUsed:false,gift:options.gift||null,pull:0,shareBonus:0,friendBlock:0,nextBlock:0,protected:false,given:false,events:[],enemies:[{id:l.art,name:l.enemy,art:l.art,hp:Math.ceil(l.hp*(level==='d7'&&options.ask?1.15:1)),maxHp:Math.ceil(l.hp*(level==='d7'&&options.ask?1.15:1)),block:0,weak:0,vulnerable:0}]};
 if(b.heartUnlocked)b.heart=Math.min(4,Math.max(0,options.openingHeart||0));
 b.draw=shuffle(b,deck.filter(id=>CARDS[id]).slice());draw(b,5);intent(b);emit(b,'start',l.hint);return b;}
function canPlay(b,index,target='enemy'){const c=CARDS[b.hand[index]];if(b.status!=='playing'||!c)return false;if(c.cost>b.courage)return false;if(target==='him'&&!b.heartUnlocked)return false;return true;}
function damage(b,e,n){let d=Math.floor((n+(b.handUntil>=b.turn?(b.handUpgrade?4:3):0))*(e.vulnerable>0?1.5:1));const absorbed=Math.min(e.block,d);e.block-=absorbed;d-=absorbed;e.hp=Math.max(0,e.hp-d);emit(b,'hit','造成 '+d+' 伤害',d);if(e.hp===0){b.status='won';emit(b,'victory','雾散了。');}}
function play(b,index,target='enemy',enemyIndex=0){if(!canPlay(b,index,target))return{ok:false,error:'勇气不足或尚未解锁'};const id=b.hand[index],c=CARDS[id],e=b.enemies[enemyIndex];if(!e)return{ok:false,error:'没有目标'};b.courage-=c.cost;b.hand.splice(index,1);b.discard.push(id);emit(b,'card',(target==='him'?'打给他：':'打出：')+c.name);
 if(target==='him'){
  if(c.special==='tie'){b.shareBonus+=.05;knots(b,2);heart(b,1);}
  else if(c.special==='memory'){b.friendBlock+=6;knots(b,-3);heart(b,2);}
  else if(c.special==='look')heart(b,3);
  else{heart(b,2);if(c.type==='interaction'&&c.heal)heal(b,c.heal);}
  if(!b.given){b.given=true;if(b.skillCooldown>0){b.skillCooldown--;emit(b,'catch','他接住了：主动冷却 −1');}}
 }else{
  if(c.damage)damage(b,e,c.damage+(c.special==='counter'?Math.min(10,b.knots):0));
  b.block+=c.block||0;if(c.knots)knots(b,c.knots);if(c.heal)heal(b,c.heal);if(c.draw)draw(b,c.draw,true);if(c.nextBlock)b.nextBlock+=c.nextBlock;
  if(c.vulnerable)e.vulnerable=Math.max(e.vulnerable,c.vulnerable);if(c.weak)e.weak=Math.max(e.weak,c.weak);
  if(c.type!=='interaction')heart(b,1);
 }
 return{ok:true};}
function intimacy(b){if(b.status!=='playing'||!b.handUnlocked||b.handUsed||b.heart<5)return{ok:false,error:'心契未满或本场已牵手'};b.heart-=5;b.handUsed=true;b.handUntil=b.turn+1;emit(b,'intimacy',b.handUpgrade?'十指相扣。':'……握紧。');return{ok:true};}
function skill(b){if(b.status!=='playing'||!b.skillId||b.skillUsed||b.skillCooldown||b.courage<1)return{ok:false,error:'主动尚未就绪'};b.courage--;b.skillUsed=true;b.skillCooldown=3+(b.light<30?1:0);
 if(b.skillId==='pull'){b.pull=15;emit(b,'skill','拉一把：接下下一次攻击，最多 15 点');}else{heal(b,b.gift==='G_GY01'?8:5);emit(b,'skill','保温水壶');}return{ok:true};}
function endTurn(b){if(b.status!=='playing')return{ok:false};b.discard.push(...b.hand);b.hand=[];const e=b.enemies[0],i=e.intent;e.block=0;
 if(i.hits){let guard=false;if(b.level!=='tutorial'&&!b.protected&&b.hp<=28){guard=true;b.protected=true;knots(b,Math.min(10,i.damage*i.hits));emit(b,'protect','他挡在身前，接下了整次攻击');}
  let pulled=0;for(let j=0;j<i.hits&&!guard&&b.status==='playing';j++){
   let n=Math.floor(i.damage*(e.weak>0?.75:1));const p=Math.min(b.pull,n);b.pull-=p;n-=p;pulled+=p;
   if(b.level!=='tutorial'&&n>0){const rate=(b.light>=60?.15:b.light>=30?.1:.05)+b.shareBonus;const share=Math.min(n,Math.max(1,Math.round(n*rate)));n-=share;let blocked=Math.min(b.friendBlock,share);b.friendBlock-=blocked;knots(b,share-blocked);emit(b,'share','他分担 '+share+' 点',share);}
   const shield=Math.min(b.block,n);b.block-=shield;n-=shield;b.hp=Math.max(b.level==='tutorial'?1:0,b.hp-n);if(n)emit(b,'hurt','受到 '+n+' 伤害',n);if(!b.hp){b.status='lost';emit(b,'defeat','回到当天早上，再试一次。');}
  }knots(b,Math.min(10,pulled));if(!guard)b.pull=0;
 }
 if(i.block)e.block=i.block;e.weak=Math.max(0,e.weak-1);e.vulnerable=Math.max(0,e.vulnerable-1);
 if(b.status==='lost')return{ok:true};if(b.turn>=30){b.status='lost';emit(b,'defeat','雾太浓了，回到早上重新出发。');return{ok:true};}
 b.turn++;b.block=b.nextBlock;b.nextBlock=0;b.courage=3;b.shareBonus=0;b.heartGain=0;b.extraDraw=0;b.skillUsed=false;b.given=false;b.skillCooldown=Math.max(0,b.skillCooldown-1);draw(b,5);intent(b);emit(b,'turn','第 '+b.turn+' 回合');return{ok:true};}
function rewardChoices(id){return ({d1:['C_010','C_020','C_013'],d2:['C_IA07','C_GY02','C_021'],d3:['C_IA13','C_GY03','C_011'],d5:['C_GY02','C_IA01','C_GY06'],d6:['C_IA07','C_020','C_GY04']})[id]||[];}
root.GrayBattle={CARDS,LEVELS,startDeck,create,canPlay,play,endTurn,skill,intimacy,rewardChoices};
})(typeof window==='undefined'?globalThis:window);
