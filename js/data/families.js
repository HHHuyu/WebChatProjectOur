// 家庭背景配置
// 不同家庭决定初始属性与童年事件倾向
const FAMILIES = [
  {
    id: 'poor',
    name: '贫寒农家',
    desc: '家徒四壁，食不果腹，但亲情温暖。',
    init: { health: 60, intelligence: 50, wealth: 10, happiness: 55 },
    weight: 35,
    tags: ['farm', 'hardship'],
  },
  {
    id: 'commoner',
    name: '普通百姓',
    desc: '小康之家，日子平淡安稳。',
    init: { health: 70, intelligence: 55, wealth: 35, happiness: 60 },
    weight: 35,
    tags: ['ordinary'],
  },
  {
    id: 'scholar',
    name: '耕读世家',
    desc: '书香门第，诗礼传家，重视教育。',
    init: { health: 65, intelligence: 75, wealth: 45, happiness: 58 },
    weight: 15,
    tags: ['education'],
  },
  {
    id: 'merchant',
    name: '商贾之家',
    desc: '富甲一方，锦衣玉食，却少陪伴。',
    init: { health: 68, intelligence: 60, wealth: 80, happiness: 50 },
    weight: 10,
    tags: ['rich', 'commerce'],
  },
  {
    id: 'noble',
    name: '官宦门第',
    desc: '权势显赫，荣华富贵，但暗流汹涌。',
    init: { health: 70, intelligence: 70, wealth: 85, happiness: 45 },
    weight: 5,
    tags: ['power', 'court'],
  },
];

module.exports = FAMILIES;
