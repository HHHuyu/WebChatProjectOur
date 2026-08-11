// 主入口：绑定界面、处理交互、驱动渲染
const { Game, STAT_NAMES } = require('./game');
const R = require('./render');
const DYNASTIES = require('./data/dynasties');

const game = new Game();

function render() {
  R.resetClickables();
  R.clear();
  const W = R.screen.width;
  const H = R.screen.height;

  if (game.phase === 'select') {
    renderSelect(W, H);
  } else if (game.phase === 'playing') {
    renderPlaying(W, H);
  } else if (game.phase === 'over') {
    renderOver(W, H);
  }
  // 微信小游戏每帧需主动重绘（此处由循环或事件触发）
}

function renderSelect(W, H) {
  const ctx = R.screen.ctx;
  let y = H * 0.08;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#5a3a1a';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('人生重开模拟器', W / 2, y);
  y += 50;
  ctx.fillStyle = '#7a5a3a';
  ctx.font = '16px sans-serif';
  ctx.fillText('选择你想要降生的朝代', W / 2, y);
  y += 50;

  const cardW = W - 60;
  const cardH = 70;
  const startY = y;
  DYNASTIES.forEach((d, i) => {
    const cy = startY + i * (cardH + 12);
    R.button(30, cy, cardW, cardH, '', () => {
      game.start(d.id);
      render();
    }, { bg: '#fffaf0', color: '#000' });
    // 卡片内文字（按钮绘制后覆盖）
    ctx.fillStyle = '#5a3a1a';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.name, 45, cy + 22);
    ctx.fillStyle = '#7a5a3a';
    ctx.font = '12px sans-serif';
    ctx.fillText(d.desc, 45, cy + 46);
  });
}

function renderPlaying(W, H) {
  const ctx = R.screen.ctx;
  // 顶部信息栏
  ctx.fillStyle = '#3b6ea5';
  ctx.fillRect(0, 0, W, 90);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`${game.name}  ${game.age}岁`, 16, 24);
  ctx.font = '12px sans-serif';
  ctx.fillText(`${game.dynasty.name} · ${game.family.name}`, 16, 50);

  // 属性条
  const stats = ['health', 'intelligence', 'wealth', 'happiness'];
  const colors = ['#c0392b', '#2980b9', '#d4a017', '#27ae60'];
  let sx = 16;
  stats.forEach((k, i) => {
    const v = Math.round(game.stats[k]);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(STAT_NAMES[k], sx, 72);
    // 进度条
    const bx = sx + 34;
    const bw = (W - 32 - sx - 34) / 4;
    ctx.fillStyle = '#ffffff55';
    ctx.fillRect(bx, 66, bw - 6, 10);
    ctx.fillStyle = colors[i];
    ctx.fillRect(bx, 66, ((bw - 6) * v) / 100, 10);
    sx += bw + 6;
  });

  // 事件日志（从下往上显示最近若干条）
  const logAreaY = 100;
  const logAreaH = H - logAreaY - 140;
  const recent = game.log.slice(-12);
  let ly = logAreaY + 8;
  ctx.font = '14px sans-serif';
  recent.forEach((line) => {
    const h = R.drawText(line, 20, ly, W - 40, 22, '14px sans-serif', '#3a2a1a');
    ly += h + 2;
  });

  // 底部按钮区
  const by = H - 120;
  if (game.pendingEvent && game.pendingEvent.choices) {
    game.pendingEvent.choices.forEach((c, i) => {
      R.button(30, by + i * 56, W - 60, 48, c.text, () => {
        game.choose(i);
        render();
      });
    });
  } else {
    R.button(30, by, W - 60, 50, '继续长大 ▶', () => {
      game.nextYear();
      render();
    });
  }

  // 重开按钮
  R.button(W - 90, 16, 74, 30, '重开', () => {
    game.phase = 'select';
    render();
  }, { bg: '#ffffff33', color: '#fff', font: 13 });
}

function renderOver(W, H) {
  const ctx = R.screen.ctx;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5a3a1a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('人生终章', W / 2, H * 0.12);

  let ly = H * 0.2;
  game.log.slice(-10).forEach((line) => {
    const h = R.drawText(line, 30, ly, W - 60, 24, '14px sans-serif', '#3a2a1a');
    ly += h + 2;
  });

  R.button(W / 2 - 80, H - 120, 160, 50, '再活一世 ↻', () => {
    game.phase = 'select';
    render();
  });
}

// 暴露给 game.js 入口
function start() {
  // 微信小游戏需提供 canvas
  const canvas = wx.createCanvas();
  R.init(canvas);
  render();

  // 触摸事件：先重建界面(刷新可点击区域)，再判定点击
  wx.onTouchStart((e) => {
    const t = e.touches[0];
    render();
    R.handleTap(t.clientX, t.clientY);
  });
}

module.exports = { start, render };
