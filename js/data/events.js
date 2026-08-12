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
    cond: (s) => s.intelligence > 55 && (s.gender === 'male' || !s.femaleRestrict),
    text: (s) => s.gender === 'male'
      ? '{name}参加科举（或考试），发挥出色，榜上有名！'
      : '{name}应试求学，成绩优异，崭露头角。',
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
    id: 'marry', minAge: 20, maxAge: 32,
    cond: (s) => !s.flags.married,
    text: (s) => s.gender === 'male'
      ? '{name}娶回了贤惠的妻子，二人相敬如宾。'
      : '{name}披上嫁衣，远嫁他人，开启新生活。',
    effects: { happiness: 15, wealth: -10, health: 2 },
    onTrigger: (g) => { g.flags.married = true; g.flags.spouseAlive = true; },
  },
  {
    id: 'remarry', minAge: 24, maxAge: 50,
    cond: (s) => s.flags.married && !s.flags.spouseAlive,
    text: (s) => s.gender === 'male'
      ? '发妻已故，{name}续弦再娶，重整家门。'
      : '前夫亡故，{name}改嫁他人，另觅依靠。',
    effects: { happiness: 8, wealth: -8, health: 1 },
    onTrigger: (g) => { g.flags.spouseAlive = true; },
  },
  {
    id: 'spouse_die', minAge: 25, maxAge: 75,
    cond: (s) => s.flags.married && s.flags.spouseAlive,
    text: (s) => s.gender === 'male'
      ? '噩耗传来，{name}的妻子染病撒手人寰，痛不欲生。'
      : '{name}的丈夫骤然离世，独守空房，冷暖自知。',
    effects: { happiness: -15, health: -3 },
    onTrigger: (g) => { g.flags.spouseAlive = false; },
  },
  {
    id: 'divorce', minAge: 24, maxAge: 50,
    cond: (s) => s.flags.married && s.flags.spouseAlive && s.gender === 'male' && s.polygamy,
    text: '{name}与妻子情分已尽，一纸休书，各奔东西。',
    effects: { happiness: -8, wealth: -6 },
    choices: [
      { text: '体面分手', effects: { happiness: -4, wealth: -4 } },
      { text: '闹得难堪', effects: { happiness: -10, wealth: -8 } },
    ],
    onTrigger: (g) => { g.flags.spouseAlive = false; },
  },
  {
    id: 'take_concubine', minAge: 26, maxAge: 55,
    cond: (s) => s.gender === 'male' && s.polygamy && s.flags.married && s.flags.spouseAlive && s.flags.concubines < 2,
    text: '{name}纳了一房妾室，家中更添几分热闹（也不无纷争）。',
    effects: { happiness: 6, wealth: -8 },
    onTrigger: (g) => { g.flags.concubines += 1; },
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
    id: 'child', minAge: 23, maxAge: 40,
    cond: (s) => s.flags.married && s.happiness > 50,
    text: (s) => s.gender === 'male'
      ? '{name}初为人父，抱起襁褓中的孩儿，满心欢喜。'
      : '{name}初为人母，怀中的婴儿咿呀学语，柔情满怀。',
    effects: { happiness: 12, wealth: -8, health: -3 },
  },

  // ---- 女性专属故事线 ----
  {
    id: 'women_learn', minAge: 6, maxAge: 18,
    cond: (s) => s.gender === 'female',
    text: (s) => s.femaleRestrict
      ? '{name}在闺中习女红、读诗书，性子温婉聪慧。'
      : '{name}自幼好学，课业之外博览群书，见识不凡。',
    effects: { intelligence: 5, happiness: 3 },
  },
  {
    id: 'women_birth', minAge: 20, maxAge: 42,
    cond: (s) => s.gender === 'female' && s.flags.married,
    text: (s) => s.femaleRestrict
      ? '{name}孕期艰辛，临盆之际险象环生，几度徘徊鬼门关中。'
      : '{name}平安诞下孩儿，母子（女）俱安，喜悦难言。',
    effects: (s) => s.femaleRestrict
      ? { happiness: 6, health: -12, wealth: -6 }
      : { happiness: 10, health: -4, wealth: -6 },
  },
  {
    id: 'women_mother', minAge: 26, maxAge: 55,
    cond: (s) => s.gender === 'female' && s.flags.married,
    text: (s) => s.femaleRestrict
      ? '{name}主持中馈、相夫教子，一门和睦，邻里称羡。'
      : '{name}兼顾事业与家庭，把孩子教得懂事上进。',
    effects: { happiness: 8, intelligence: 2 },
  },
  {
    id: 'women_career', minAge: 22, maxAge: 55,
    cond: (s) => s.gender === 'female' && !s.femaleRestrict,
    text: '{name}在职场奋力打拼，凭才干渐露头角，步步高升。',
    effects: { wealth: 18, intelligence: 4, happiness: 4, health: -2 },
  },
  {
    id: 'women_charity', minAge: 18, maxAge: 70,
    cond: (s) => s.gender === 'female',
    text: '{name}心性慈柔，常济助孤弱，闺中贤名远播。',
    effects: { happiness: 7, wealth: -4 },
  },
  {
    id: 'women_widow', minAge: 28, maxAge: 70,
    cond: (s) => s.gender === 'female' && s.flags.married && !s.flags.spouseAlive,
    text: (s) => s.femaleRestrict
      ? '{name}守寡持家，含辛茹苦将儿女拉扯成人。'
      : '{name}独自抚育子女，虽辛苦却也练就一身本事。',
    effects: { happiness: -3, health: -2, intelligence: 2 },
  },

  // ---- 男性专属补充 ----
  {
    id: 'men_farm', minAge: 14, maxAge: 60,
    cond: (s) => s.gender === 'male' && s.wealth < 35,
    text: '{name}躬耕垄亩，春种秋收，虽劳苦却也踏实。',
    effects: { health: 4, wealth: 6, happiness: -1 },
  },
  {
    id: 'men_earn', minAge: 20, maxAge: 60,
    cond: (s) => s.gender === 'male' && !s.femaleRestrict && s.wealth < 50,
    text: '{name}外出谋生、四处闯荡，肩上担起一家生计。',
    effects: { wealth: 12, health: -2, happiness: 2 },
  },
  {
    id: 'illness', minAge: 18, maxAge: 60,
    text: '{name}忽染重疾，卧床休养许久。',
    effects: { health: -10, wealth: -6, happiness: -4 },
  },

  // ---- 中年 (36-55) ----
  {
    id: 'promote', minAge: 36, maxAge: 50,
    cond: (s) => s.intelligence > 60 && (s.gender === 'male' || !s.femaleRestrict),
    text: (s) => s.gender === 'male'
      ? '{name}勤勉能干，得以升迁，前程似锦。'
      : '{name}能力出众，在职场（或坊间）独当一面，备受倚重。',
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
    deathReason: '寿终正寝',
  },

  // ---- 意外事件（命运的无常）----
  // 意外死亡类
  {
    id: 'accident', minAge: 16, maxAge: 70,
    text: '一场突如其来的意外夺走了{name}的生命，世事难料。',
    effects: { health: -999 },
    deathReason: '意外身亡',
  },
  {
    id: 'drown', minAge: 3, maxAge: 12,
    text: '{name}贪玩近水，不慎落水，再没能醒来。',
    effects: { health: -999 },
    deathReason: '溺水而亡',
  },
  {
    id: 'plague', minAge: 5, maxAge: 60,
    cond: (s) => s.tags && (s.tags.includes('turmoil') || s.tags.includes('poverty')),
    text: '时疫横行，{name}不幸染病，药石无医。',
    effects: { health: -999 },
    deathReason: '染疫身故',
  },
  {
    id: 'executed', minAge: 18, maxAge: 65,
    cond: (s) => s.tags && s.tags.includes('court'),
    text: '朝堂倾轧，{name}受牵连获罪，命丧法场。',
    effects: { health: -999 },
    deathReason: '获罪问斩',
  },
  {
    id: 'lightning', minAge: 6, maxAge: 80,
    text: '一道惊雷劈下，{name}竟遭此无妄之灾。',
    effects: { health: -999 },
    deathReason: '遭雷殛而亡',
  },

  // 大机遇（每局至多 1 次，且间隔长久，方显珍贵）
  {
    id: 'inherit', tier: 'fortune', maxTimes: 1, cooldown: 20, minAge: 18, maxAge: 75,
    text: '一位素未谋面的远亲离世，留给{name}一笔丰厚遗产。',
    effects: { wealth: 45, happiness: 8 },
  },
  {
    id: 'lottery', tier: 'fortune', maxTimes: 1, cooldown: 20, minAge: 16, maxAge: 75,
    text: '{name}随手买了一张奖券，竟中了头彩！',
    effects: { wealth: 50, happiness: 15 },
  },
  {
    id: 'treasure', tier: 'fortune', maxTimes: 1, cooldown: 20, minAge: 10, maxAge: 70,
    text: '{name}在旧宅墙缝里发现先人埋藏的金银。',
    effects: { wealth: 40, happiness: 10 },
  },
  {
    id: 'mine', tier: 'fortune', maxTimes: 1, cooldown: 20, minAge: 20, maxAge: 70,
    cond: (s) => s.tags && (s.tags.includes('isolation') || s.tags.includes('turmoil')),
    text: '{name}在山中偶得一处矿脉，自此富甲一方。',
    effects: { wealth: 48, happiness: 10 },
  },

  // 奇遇（每局至多 2 次，间隔适中）
  {
    id: 'patent', tier: 'windfall', maxTimes: 2, cooldown: 12, minAge: 25, maxAge: 65,
    cond: (s) => s.intelligence > 65,
    text: '{name}的一项奇思妙想被广为采用，由此获利颇丰。',
    effects: { wealth: 28, intelligence: 4, happiness: 8 },
  },
  {
    id: 'land_rise', tier: 'windfall', maxTimes: 2, cooldown: 12, minAge: 30, maxAge: 70,
    cond: (s) => s.wealth > 40,
    text: '地价飞涨，{name}名下田产房产价值倍增。',
    effects: { wealth: 24, happiness: 5 },
  },
  {
    id: 'antique', tier: 'windfall', maxTimes: 2, cooldown: 12, minAge: 18, maxAge: 70,
    text: '{name}在市集淘得一件古玩，转手竟卖出高价。',
    effects: { wealth: 22, happiness: 6 },
  },
  {
    id: 'benefactor', tier: 'windfall', maxTimes: 2, cooldown: 12, minAge: 16, maxAge: 70,
    text: '一位贵人赏识{name}，慷慨解囊相助。',
    effects: { wealth: 20, happiness: 8 },
  },
  {
    id: 'lucky_land', tier: 'windfall', maxTimes: 2, cooldown: 12, minAge: 20, maxAge: 72,
    text: '{name}盘下一块荒地，不想竟是膏腴之田。',
    effects: { wealth: 18, happiness: 4 },
  },

  // 小惊喜（可多次，但幅度小、间隔短）
  {
    id: 'find_coin', tier: 'small', maxTimes: 3, cooldown: 8, minAge: 6, maxAge: 75,
    text: '{name}在路上捡到一串铜钱，喜出望外。',
    effects: { wealth: 6, happiness: 3 },
  },
  {
    id: 'neighbor_gift', tier: 'small', maxTimes: 3, cooldown: 8, minAge: 5, maxAge: 75,
    text: '邻里送来吃食物件，{name}心中一暖。',
    effects: { wealth: 4, happiness: 5 },
  },
  {
    id: 'gamble_win', tier: 'small', maxTimes: 3, cooldown: 8, minAge: 18, maxAge: 70,
    text: '{name}小赌怡情，手气颇佳，赢了一笔零花。',
    effects: { wealth: 8, happiness: 4 },
  },
  {
    id: 'red_packet', tier: 'small', maxTimes: 3, cooldown: 8, minAge: 5, maxAge: 40,
    text: '年节里长辈给了{name}一个厚实的红包。',
    effects: { wealth: 7, happiness: 6 },
  },

  // 灾祸（同样设上限与冷却，避免反复遭难）
  {
    id: 'robbery', tier: 'misfortune', maxTimes: 1, cooldown: 15, minAge: 12, maxAge: 75,
    text: '{name}路遇歹人，财物被劫，惊魂未定。',
    effects: { wealth: -22, health: -4, happiness: -6 },
  },
  {
    id: 'fire', tier: 'misfortune', maxTimes: 1, cooldown: 15, minAge: 5, maxAge: 75,
    text: '一场大火烧毁了{name}的居所，多年积蓄付诸一炬。',
    effects: { wealth: -26, happiness: -8, health: -3 },
  },
  {
    id: 'scam', tier: 'misfortune', maxTimes: 1, cooldown: 15, minAge: 18, maxAge: 70,
    cond: (s) => s.wealth > 30,
    text: '{name}轻信他人，误入骗局，血本无归。',
    effects: { wealth: -24, happiness: -7, intelligence: 2 },
  },

  // 善举与声望（不限层，属性格事件）
  {
    id: 'save_life', minAge: 10, maxAge: 70,
    text: '{name}路见危难，出手相救，被救者感恩图报。',
    effects: { happiness: 10, health: 2, wealth: 8 },
  },
  {
    id: 'fame', minAge: 20, maxAge: 65,
    cond: (s) => s.intelligence > 60,
    text: '{name}的一桩义举传遍乡里，声名鹊起。',
    effects: { happiness: 12, wealth: 6 },
  },
  {
    id: 'missing', minAge: 8, maxAge: 18,
    text: '{name}外出时迷失方向，历尽艰辛才回到家。',
    effects: { health: -6, happiness: -5 },
  },

  // ---- 富人故事线（需 flags.class === 'rich' 才会触发）----
  {
    id: 'rich_mansion', minAge: 12, maxAge: 75,
    cond: (s) => s.flags && s.flags.class === 'rich',
    text: '{name}迁入雕梁画栋的新宅，仆从簇拥，起居大不相同。',
    effects: { happiness: 8, health: 2 },
  },
  {
    id: 'rich_flattered', minAge: 16, maxAge: 75,
    cond: (s) => s.flags && s.flags.class === 'rich',
    text: '往来之人无不巴结奉承，{name}初次尝到众星捧月之感。',
    effects: { happiness: 6 },
  },
  {
    id: 'rich_invest', minAge: 25, maxAge: 70,
    cond: (s) => s.flags && s.flags.class === 'rich',
    text: '{name}以闲置银钱广置产业，财源日渐丰厚。',
    choices: [
      { text: '稳健置业', effects: { wealth: 15, happiness: 3 } },
      { text: '大胆投机', effects: { wealth: 35, happiness: -2 }, risk: 0.4 },
    ],
  },
  {
    id: 'rich_marry', minAge: 20, maxAge: 38,
    cond: (s) => s.flags && !s.flags.married && s.flags.class === 'rich' && s.happiness > 40,
    text: (s) => s.gender === 'male'
      ? '门第显赫的岳家主动提亲，{name}娶回一位千金，锦上添花。'
      : '权贵之家遣媒求聘，{name}高攀一门贵亲，风光出阁。',
    effects: { happiness: 12, wealth: -8, health: 2 },
    onTrigger: (g) => { g.flags.married = true; g.flags.spouseAlive = true; },
  },
  {
    id: 'rich_luxury', minAge: 18, maxAge: 75,
    cond: (s) => s.flags && s.flags.class === 'rich',
    text: '{name}锦衣玉食，游宴无度，尽享人间富贵。',
    effects: { happiness: 10, health: -2, wealth: -3 },
  },
  {
    id: 'rich_charity', minAge: 20, maxAge: 75,
    cond: (s) => s.flags && s.flags.class === 'rich',
    text: '{name}散财济贫，善名远播，心中亦觉安稳。',
    effects: { happiness: 8, wealth: -6, health: 1 },
  },
  {
    id: 'rich_envy', minAge: 30, maxAge: 75,
    cond: (s) => s.flags && s.flags.class === 'rich',
    text: '富名招嫉，有人暗中算计{name}的家财。',
    choices: [
      { text: '低调行事', effects: { happiness: -2, wealth: -3 } },
      { text: '以势压人', effects: { happiness: -4, wealth: 5 } },
    ],
  },
  {
    id: 'rich_heir', minAge: 30, maxAge: 60,
    cond: (s) => s.flags && s.flags.class === 'rich' && s.happiness > 45,
    text: '富家子女悉心教养，{name}看着儿孙前程，满心欣慰。',
    effects: { happiness: 12, health: 2 },
  },
  {
    id: 'rich_old', minAge: 60, maxAge: 90,
    cond: (s) => s.flags && s.flags.class === 'rich',
    text: '{name}家资殷厚，晚年含饴弄孙，一派钟鸣鼎食气象。',
    effects: { happiness: 10, health: 2 },
  },
];

module.exports = EVENTS;
