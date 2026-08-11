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
  }

  // 选择朝代并开始
  start(dynastyId) {
    this.dynasty = DYNASTIES.find((d) => d.id === dynastyId) || DYNASTIES[0];
    this.family = weightedPick(FAMILIES);
    this.name = this._randomName();
    this.age = 0;
    this.alive = true;
    this.stats = { ...this.family.init };
    this.log = [];
    this.phase = 'playing';
    this.pendingEvent = null;
    this._log(`【${this.dynasty.name} · ${this.family.name}】`);
    this._log(`你降生在${this.dynasty.name}，出身于${this.family.name}。${this.family.desc}`);
    this.nextYear();
  }

  _randomName() {
    const surnames = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许';
    const givenBoy = ['轩', '明', '安', '远', '承', '景', '修', '彦'];
    const givenGirl = ['婉', '清', '柔', '嫣', '芷', '宁', '汐', '藿'];
    const boy = Math.random() < 0.5;
    const sur = surnames[randInt(0, surnames.length - 1)];
    const pool = boy ? givenBoy : givenGirl;
    return sur + pool[randInt(0, pool.length - 1)];
  }

  _log(text) {
    this.log.push(text);
    if (this.log.length > 200) this.log.shift();
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

    // 寻找本年龄可触发的事件
    const candidates = EVENTS.filter(
      (e) =>
        this.age >= e.minAge &&
        this.age <= e.maxAge &&
        (!e.cond || e.cond(this._stateForCond()))
    );
    if (candidates.length > 0 && Math.random() < 0.55) {
      const ev = candidates[randInt(0, candidates.length - 1)];
      this.pendingEvent = ev;
      this._log(`【${this.age}岁】`);
      this._log(ev.text.replace(/\{name\}/g, this.name));
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

  _stateForCond() {
    return {
      ...this.stats,
      age: this.age,
      tags: this.dynasty.tags,
    };
  }

  _applyEffects(eff) {
    for (const k of Object.keys(eff)) {
      if (this.stats[k] === undefined) continue;
      this.stats[k] = clamp(this.stats[k] + eff[k], 0, 100);
    }
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
