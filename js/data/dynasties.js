// 朝代配置
// 每个朝代定义：名称、寿命基准、随机事件权重修正、特有事件标签
const DYNASTIES = [
  {
    id: 'tang',
    name: '唐朝',
    desc: '盛世大唐，繁华开放，但也偶有边患。',
    baseLifespan: 62,
    wealthMod: 1.1,
    healthMod: 1.0,
    tags: ['prosperity', 'poetry'],
  },
  {
    id: 'song',
    name: '宋朝',
    desc: '重文轻武，市井繁华，文化鼎盛。',
    baseLifespan: 60,
    wealthMod: 1.15,
    healthMod: 0.95,
    tags: ['civil', 'commerce'],
  },
  {
    id: 'ming',
    name: '明朝',
    desc: '君主集权，海禁与朝堂纷争并存。',
    baseLifespan: 58,
    wealthMod: 1.0,
    healthMod: 0.95,
    tags: ['isolation', 'court'],
  },
  {
    id: 'qing',
    name: '清朝',
    desc: '末世王朝，变局将至，民生多艰。',
    baseLifespan: 55,
    wealthMod: 0.9,
    healthMod: 0.85,
    tags: ['turmoil', 'poverty'],
  },
  {
    id: 'modern',
    name: '现代',
    desc: '科技发达，医疗进步，机遇无限。',
    baseLifespan: 78,
    wealthMod: 1.2,
    healthMod: 1.25,
    tags: ['tech', 'freedom'],
  },
];

module.exports = DYNASTIES;
