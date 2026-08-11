// 随机事件库
// 每个事件：
//   minAge/maxAge 触发年龄范围
//   cond(state)   可选，返回 bool 决定该角色是否可触发
//   text          事件描述（支持 {name} 占位）
//   effects       属性变化 {health, intelligence, wealth, happiness}
//   choices       可选分支，每个分支有 text 与 effects
//                 （无 choices 则直接应用 effects）

const EVENTS = [
  // ---- 幼年 (0-6) ----
  {
    id: 'crawl', minAge: 1, maxAge: 2,
    text: '{name}蹒跚学步，第一次跌跌撞撞地迈出脚步。',
    effects: { health: 1, happiness: 3 },
  },
  {
    id: 'sick_child', minAge: 1, maxAge: 6,
    text: '{name}染了风寒，高烧不退，全家忧心忡忡。',
    effects: { health: -5, happiness: -2 },
  },
  {
    id: 'toy', minAge: 2, maxAge: 5,
    cond: (s) => s.wealth > 30,
    text: '家里给{name}买了新玩具，{name}玩得不亦乐乎。',
    effects: { happiness: 6, wealth: -3 },
  },
  {
    id: 'read_early', minAge: 3, maxAge: 6,
    cond: (s) => s.intelligence > 60,
    text: '{name}好奇心旺盛，翻着书册咿呀认字。',
    effects: { intelligence: 5, happiness: 2 },
  },
  {
    id: 'sibling', minAge: 2, maxAge: 8,
    text: '家里添了新成员，{name}初尝手足之情。',
    effects: { happiness: 4, wealth: -5 },
  },

  // ---- 少年/求学 (7-17) ----
  {
    id: 'school', minAge: 7, maxAge: 9,
    text: '{name}到了启蒙年龄，被送去私塾（或学校）念书。',
    effects: { intelligence: 6, happiness: -1 },
  },
  {
    id: 'bully', minAge: 8, maxAge: 14,
    text: '{name}在学校被高年级的孩子欺负，闷闷不乐。',
    choices: [
      { text: '忍气吞声', effects: { happiness: -5, intelligence: 2 } },
      { text: '奋起反抗', effects: { health: -4, happiness: 2 } },
    ],
  },
  {
    id: 'exam', minAge: 12, maxAge: 17,
    cond: (s) => s.intelligence > 55,
    text: '{name}参加科举（或考试），发挥出色，榜上有名！',
    effects: { intelligence: 4, happiness: 10, wealth: 8 },
  },
  {
    id: 'friend', minAge: 8, maxAge: 16,
    text: '{name}结识了一位挚友，一起度过了无忧的少年时光。',
    effects: { happiness: 8, intelligence: 2 },
  },
  {
    id: 'firstlove', minAge: 14, maxAge: 18,
    text: '{name}情窦初开，悄悄喜欢上了邻家的少年/少女。',
    effects: { happiness: 7, intelligence: -2 },
  },

  // ---- 青年/立业 (18-35) ----
  {
    id: 'work', minAge: 18, maxAge: 25,
    text: '{name}踏入社会，寻得一份差事，开始自食其力。',
    effects: { wealth: 12, happiness: 2, health: -2 },
  },
  {
    id: 'marry', minAge: 20, maxAge: 30,
    text: '{name}遇到了命中注定之人，喜结连理。',
    effects: { happiness: 15, wealth: -10, health: 2 },
  },
  {
    id: 'business', minAge: 22, maxAge: 35,
    cond: (s) => s.wealth > 50,
    text: '{name}看准商机，做起小本买卖。',
    choices: [
      { text: '稳妥经营', effects: { wealth: 15, happiness: 3 } },
      { text: '放手一搏', effects: { wealth: 30, health: -3 }, risk: 0.5 },
    ],
  },
  {
    id: 'child', minAge: 23, maxAge: 38,
    cond: (s) => s.happiness > 50,
    text: '{name}初为人父/人母，抱起襁褓中的婴儿，满心欢喜。',
    effects: { happiness: 12, wealth: -8, health: -3 },
  },
  {
    id: 'illness', minAge: 18, maxAge: 60,
    text: '{name}忽染重疾，卧床休养许久。',
    effects: { health: -10, wealth: -6, happiness: -4 },
  },

  // ---- 中年 (36-55) ----
  {
    id: 'promote', minAge: 36, maxAge: 50,
    cond: (s) => s.intelligence > 60,
    text: '{name}勤勉能干，得以升迁，前程似锦。',
    effects: { wealth: 20, happiness: 8, health: -3 },
  },
  {
    id: 'mid_crisis', minAge: 40, maxAge: 50,
    text: '{name}回望半生，忽感迷茫，不知余生何往。',
    choices: [
      { text: '重新出发', effects: { happiness: 8, intelligence: 3 } },
      { text: '安于现状', effects: { happiness: -4 } },
    ],
  },
  {
    id: 'war', minAge: 18, maxAge: 65,
    cond: (s) => s.tags && s.tags.includes('turmoil'),
    text: '战火蔓延至乡里，{name}被迫颠沛流离。',
    effects: { health: -8, wealth: -12, happiness: -6 },
  },

  // ---- 晚年 (56+) ----
  {
    id: 'grandchild', minAge: 56, maxAge: 80,
    cond: (s) => s.happiness > 40,
    text: '膝下孙儿绕膝，{name}享起了天伦之乐。',
    effects: { happiness: 12, health: 1 },
  },
  {
    id: 'retire', minAge: 58, maxAge: 70,
    text: '{name}卸下重担，归隐闲居，含饴弄孙。',
    effects: { happiness: 10, health: 3 },
  },
  {
    id: 'lonely', minAge: 60, maxAge: 85,
    cond: (s) => s.happiness < 45,
    text: '故人渐稀，{name}独坐庭院，颇觉孤寂。',
    effects: { happiness: -6, health: -2 },
  },
  {
    id: 'exercise', minAge: 10, maxAge: 55,
    text: '{name}坚持习武（或锻炼），身板愈发硬朗。',
    effects: { health: 6, happiness: 2 },
  },
  {
    id: 'good_meal', minAge: 5, maxAge: 80,
    cond: (s) => s.wealth > 40,
    text: '家里备了一桌好菜，{name}吃得心满意足。',
    effects: { health: 3, happiness: 4, wealth: -2 },
  },
  {
    id: 'festival', minAge: 3, maxAge: 80,
    text: '逢年过节，{name}与家人团聚，其乐融融。',
    effects: { happiness: 6, health: 1 },
  },
  {
    id: 'peaceful_end', minAge: 70, maxAge: 100,
    text: '{name}在睡梦中安然辞世，一生平和。',
    effects: { health: -999 },
  },
];

module.exports = EVENTS;
