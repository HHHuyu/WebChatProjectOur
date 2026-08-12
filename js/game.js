// 游戏核心逻辑：管理一局人生的状态与推进
const DYNASTIES = require('./data/dynasties');
const FAMILIES = require('./data/families');
const EVENTS = require('./data/events');

const STAT_NAMES = {
  health: '健康',
  intelligence: '智力',
  wealth: '财富',
  happiness: '快乐',
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedPick(list) {
  const total = list.reduce((s, x) => s + (x.weight || 1), 0);
  let r = Math.random() * total;
  for (const item of list) {
    r -= (item.weight || 1);
    if (r <= 0) return item;
  }
  return list[list.length - 1];
}

class Game {
  constructor() {
    this.phase = 'select'; // select | playing | over
    this.autoGrow = false; // 自动成长开关
    this.choiceDeadline = 0; // 选择事件倒计时截止时间戳
  }

  // 选择朝代并开始
  start(dynastyId) {
    this.dynasty = DYNASTIES.find((d) => d.id === dynastyId) || DYNASTIES[0];
    this.family = weightedPick(FAMILIES);
    this.gender = Math.random() < 0.5 ? 'male' : 'female';
    this.name = this._randomName();
    this.age = 0;
    this.alive = true;
    this.stats = { ...this.family.init };
    this.log = [];
    this.phase = 'playing';
    this.pendingEvent = null;
    this.autoGrow = false;
    this.choiceDeadline = 0;
    // 人生状态标签：随经历动态变化，用于驱动故事线（阶层/身份）
    this.flags = {};
    // 婚姻状态：married 是否成婚；spouseAlive 配偶是否在世；concubines 妾数
    this.flags.married = false;
    this.flags.spouseAlive = true;
    this.flags.concubines = 0;
    // 奇遇去重：记录每个事件触发次数，以及冷却到的年龄（避免反复同种奇遇）
    this.eventCounts = {};
    this.eventCooldown = {};
    this._updateClass(true); // 初始化阶层（静默，不输出转折叙事）
    this._log(`【${this.dynasty.name} · ${this.family.name}】`);
    this._log(`你降生在${this.dynasty.name}，出身于${this.family.name}。${this.family.desc}`);
    this.nextYear();
  }

  _randomName() {
    const surnames = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许';
    const givenBoy = ['轩', '明', '安', '远', '承', '景', '修', '彦'];
    const givenGirl = ['婉', '清', '柔', '嫣', '芷', '宁', '汐', '藿'];
    const sur = surnames[randInt(0, surnames.length - 1)];
    const pool = this.gender === 'male' ? givenBoy : givenGirl;
    return sur + pool[randInt(0, pool.length - 1)];
  }

  _log(text) {
    this.log.push(text);
    if (this.log.length > 200) this.log.shift();
  }

  // 渲染事件文案：函数式按当前状态（性别/阶层）生成，再替换 {name}
  _renderText(text) {
    const t = typeof text === 'function' ? text(this._stateForCond()) : text;
    return t.replace(/\{name\}/g, this.name);
  }

  // 推进到下一年（或触发需要选择的事件）
  nextYear() {
    if (!this.alive) return;
    this.age += 1;

    // 健康归零立即死亡
    if (this.stats.health <= 0) {
      this._die('因病离世');
      return;
    }
    // 健康自然小幅恢复（年轻恢复更快）
    const recover = this.age < 50 ? 2 : this.age < 70 ? 1 : 0;
    this.stats.health = Math.min(100, this.stats.health + recover);
    // 寿命判定：以朝代基准寿命为期望，健康越高越可能长寿
    const expectLifespan = Math.round(
      this.dynasty.baseLifespan * (0.7 + this.stats.health / 160)
    );
    if (this.age >= expectLifespan) {
      // 到达期望寿命后，逐年累积死亡概率
      const excess = this.age - expectLifespan;
      const deathProb = 0.05 + excess * 0.04;
      if (Math.random() < deathProb) {
        this._die('寿终正寝');
        return;
      }
    }

    // 致命意外：每年独立小概率掷骰，与常规事件解耦，让“意外”可控
    const fatalPool = EVENTS.filter(
      (e) =>
        e.effects &&
        e.effects.health <= -999 &&
        this.age >= e.minAge &&
        this.age <= e.maxAge &&
        (!e.cond || e.cond(this._stateForCond()))
    );
    if (fatalPool.length > 0 && Math.random() < 0.003) {
      const ev = fatalPool[randInt(0, fatalPool.length - 1)];
      this._log(`【${this.age}岁】`);
      this._log(ev.text.replace(/\{name\}/g, this.name));
      this._applyEffects(ev.effects); // health -999 → 立即死亡
      if (this.stats.health <= 0) {
        this._die(ev.deathReason || '意外离世');
        return;
      }
    }

    // 寻找本年龄可触发的常规事件（排除冷却中或超次数上限的奇遇）
    const candidates = EVENTS.filter(
      (e) =>
        this.age >= e.minAge &&
        this.age <= e.maxAge &&
        !(e.effects && e.effects.health <= -999) &&
        (!e.cond || e.cond(this._stateForCond())) &&
        this._eventAvailable(e)
    );
    if (candidates.length > 0 && Math.random() < 0.55) {
      const ev = candidates[randInt(0, candidates.length - 1)];
      this._registerEvent(ev);
      this.pendingEvent = ev;
      this._log(`【${this.age}岁】`);
      this._log(this._renderText(ev.text));
      if (ev.effects) this._applyEffects(ev.effects);
      if (ev.choices) {
        // 等待玩家选择，暂停推进
        return;
      }
    } else {
      this._log(`【${this.age}岁】平平淡淡又一年。`);
    }
    this.pendingEvent = this.pendingEvent || null;
  }

  // 该奇遇事件当前是否可触发（次数上限 + 冷却）
  _eventAvailable(e) {
    const cd = this.eventCooldown[e.id] || 0;
    if (this.age < cd) return false;
    if (e.maxTimes && (this.eventCounts[e.id] || 0) >= e.maxTimes) return false;
    return true;
  }

  _registerEvent(e) {
    this.eventCounts[e.id] = (this.eventCounts[e.id] || 0) + 1;
    // 大机遇/奇遇类设定较长冷却，避免短期内反复同种奇遇
    if (e.cooldown) this.eventCooldown[e.id] = this.age + e.cooldown;
    // 触发后执行事件的副作用（如设置婚姻状态）
    if (e.onTrigger) e.onTrigger(this);
  }

  _stateForCond() {
    return {
      ...this.stats,
      age: this.age,
      gender: this.gender,
      tags: this.dynasty.tags,
      polygamy: this.dynasty.polygamy,
      femaleRestrict: this.dynasty.femaleRestrict,
      flags: this.flags,
    };
  }

  // 根据财富/属性动态维护阶层标签，并在跃迁时输出叙事
  // silent=true 时仅设定初始阶层，不输出“骤然富有”等转折叙事
  _updateClass(silent) {
    const cls = this.stats.wealth >= 70 ? 'rich' : this.stats.wealth >= 35 ? 'welloff' : this.stats.wealth < 15 ? 'poor' : 'common';
    const prev = this.flags.class;
    if (cls !== prev) {
      this.flags.class = cls;
      if (silent) return; // 开局初始阶层，不叙事
      if (cls === 'rich' && (prev === 'poor' || prev === 'common')) {
        // 真正的阶层跃迁：从清贫/普通一跃致富，方称“天翻地覆”
        this._log(`命运的齿轮就此转动——${this.name}骤然富有，生活天翻地覆，往后的日子截然不同了。`);
      } else if (cls === 'rich' && prev === 'welloff') {
        // 本来已有家底，富上加富只是寻常，轻描淡写
        this._log(`${this.name}家底愈发厚实，日子更添几分从容。`);
      } else if (cls === 'poor' && prev) {
        this._log(`${this.name}家道中落，又回到了为生计发愁的日子。`);
      }
    }
  }

  _applyEffects(eff) {
    // 支持函数式 effects：根据当前状态返回属性变化对象
    const e = typeof eff === 'function' ? eff(this._stateForCond()) : eff;
    for (const k of Object.keys(e)) {
      if (this.stats[k] === undefined) continue;
      this.stats[k] = clamp(this.stats[k] + e[k], 0, 100);
    }
    this._updateClass();
  }

  // 玩家对带 choices 的事件做选择
  choose(index) {
    if (!this.pendingEvent || !this.pendingEvent.choices) return;
    const choice = this.pendingEvent.choices[index];
    if (!choice) return;
    this._log(`→ ${choice.text}`);
    if (choice.risk && Math.random() > choice.risk) {
      this._log('可惜时运不济，血本无归。');
      this._applyEffects({ wealth: -20, happiness: -5 });
    } else {
      this._applyEffects(choice.effects || {});
    }
    this.pendingEvent = null;
    if (this.stats.health <= 0) {
      this._die('积劳成疾');
      return;
    }
    // 选择后自动进入下一年
    this.nextYear();
  }

  _die(reason) {
    this.alive = false;
    this.phase = 'over';
    this.deathReason = reason;
    this._log(`【终】${this.age}岁，${reason}。`);
    this._log(this._epitaph());
  }

  _epitaph() {
    const s = this.stats;
    let rank = '平凡';
    const score = s.health + s.intelligence + s.wealth + s.happiness;
    if (score > 320) rank = '传奇';
    else if (score > 280) rank = '显赫';
    else if (score > 240) rank = '顺遂';
    else if (score < 160) rank = '坎坷';
    return `一生终了，评定为「${rank}」之人。健康${Math.round(s.health)} 智力${Math.round(
      s.intelligence
    )} 财富${Math.round(s.wealth)} 快乐${Math.round(s.happiness)}。`;
  }

  getStatName(key) {
    return STAT_NAMES[key];
  }
}

module.exports = { Game, STAT_NAMES };
