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
  // 顶部安全区：避开刘海/摄像头，防止内容被遮挡
  const TOP_SAFE = 44;
  // 顶部信息栏（背景从屏幕顶部开始，安全区也跟随头部蓝色）
  ctx.fillStyle = '#3b6ea5';
  ctx.fillRect(0, 0, W, TOP_SAFE + 80);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // 第一行：姓名性别年龄
  const titleY = TOP_SAFE + 4;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`${game.name}（${game.gender === 'male' ? '男' : '女'}）  ${game.age}岁`, 16, titleY);

  // 朝代 · 家庭 · 婚姻状态（独立一行）
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  const marryState = game.flags.married
    ? game.flags.spouseAlive
      ? (game.gender === 'male' && game.flags.concubines > 0 ? `妻${game.flags.concubines + 1}人` : '已婚')
      : '丧偶'
    : '未婚';
  ctx.fillText(`${game.dynasty.name} · ${game.family.name} · ${marryState}`, 16, TOP_SAFE + 28);

  // 属性条（等宽四列：标签在上、进度条在下）
  const stats = ['health', 'intelligence', 'wealth', 'happiness'];
  const colors = ['#c0392b', '#2980b9', '#d4a017', '#27ae60'];
  const colW = (W - 32) / 4;
  stats.forEach((k, i) => {
    const v = Math.round(game.stats[k]);
    const cx = 16 + i * colW + colW / 2; // 列中心 x
    // 标签（居中于列）
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(STAT_NAMES[k], cx, TOP_SAFE + 42);
    // 进度条（紧贴标签下方）
    const bx = 16 + i * colW + 4;
    const bw = colW - 8;
    ctx.fillStyle = '#ffffff55';
    ctx.fillRect(bx, TOP_SAFE + 60, bw, 10);
    ctx.fillStyle = colors[i];
    ctx.fillRect(bx, TOP_SAFE + 60, (bw * v) / 100, 10);
  });

  // 事件日志（从下往上显示最近若干条）
  const logAreaY = TOP_SAFE + 78;
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
    // 选择事件：选项按钮 + 倒计时提示
    const remain = (game.autoGrow && game.choiceDeadline > 0)
      ? Math.max(0, Math.ceil((game.choiceDeadline - Date.now()) / 1000))
      : 0;
    game.pendingEvent.choices.forEach((c, i) => {
      const bx = 30, bw = W - 60, bh = 48;
      R.button(bx, by + i * 56, bw, bh, '', () => {
        if (choiceTimer) { clearTimeout(choiceTimer); choiceTimer = null; }
        game.choose(i);
        render();
        if (game.autoGrow && game.phase === 'playing') scheduleNext();
      });
      // 整体水平居中：主文字白色
      const cx = bx + bw / 2;
      const cy = by + i * 56 + bh / 2;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText(c.text, cx, cy);
      // 倒计时数字和括号暗色，紧跟在主文字右侧（仍整体居中感）
      if (remain > 0) {
        const tail = ` (${remain})`;
        const mainW = ctx.measureText(c.text).width;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#9a8a7a';
        ctx.font = '15px sans-serif';
        ctx.fillText(tail, cx + mainW / 2 + 6, cy);
      }
      ctx.restore();
    });
    // 自动成长时定时刷新倒计时显示（两个选项共用）
    if (remain > 0) setTimeout(render, 250);
  } else {
    // 自动成长复选框（左侧）
    const cbX = 24, cbY = by + 13, cbS = 24;
    R.button(cbX, cbY, cbS, cbS, '', () => {
      setAutoGrow(!game.autoGrow);
      render();
    }, { bg: '#fff', color: '#27ae60', font: 12 });
    if (game.autoGrow) {
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cbX + 5, cbY + 12);
      ctx.lineTo(cbX + 11, cbY + 18);
      ctx.lineTo(cbX + 19, cbY + 5);
      ctx.stroke();
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#3a2a1a';
    ctx.font = '12px sans-serif';
    ctx.fillText('自动成长', cbX + cbS + 8, cbY + cbS / 2);

    R.button(110, by, W - 200, 50, '继续长大 ▶', () => {
      game.nextYear();
      render();
    });
    R.button(W - 80, by, 60, 50, '重开', () => {
      stopAutoGrow();
      game.autoGrow = false;
      game.phase = 'select';
      render();
    }, { bg: '#e67e22', color: '#fff', font: 14 });
  }
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
    stopAutoGrow();
    game.autoGrow = false;
    game.phase = 'select';
    render();
  });
}

// ===== 自动成长 / 选择倒计时 =====
let autoTimer = null;
let choiceTimer = null;

function stopAutoGrow() {
  if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
  if (choiceTimer) { clearTimeout(choiceTimer); choiceTimer = null; }
  game.choiceDeadline = 0;
}

// 选择事件：启动 5 秒倒计时，超时随机选择一项
function startChoiceCountdown() {
  game.choiceDeadline = Date.now() + 5000;
  if (choiceTimer) clearTimeout(choiceTimer);
  choiceTimer = setTimeout(() => {
    choiceTimer = null;
    if (!game.autoGrow || game.phase !== 'playing') return;
    if (game.pendingEvent && game.pendingEvent.choices) {
      const n = game.pendingEvent.choices.length;
      const idx = Math.floor(Math.random() * n);
      game.choose(idx);
      render();
      if (game.autoGrow && game.phase === 'playing') scheduleNext();
    }
  }, 5000);
}

// 自动逐年推进；遇到选择事件则转交倒计时
function scheduleNext() {
  if (!game.autoGrow || game.phase !== 'playing') return;
  autoTimer = setTimeout(() => {
    autoTimer = null;
    if (!game.autoGrow || game.phase !== 'playing') return;
    if (game.pendingEvent && game.pendingEvent.choices) {
      startChoiceCountdown();
      render();
      return;
    }
    game.nextYear();
    render();
    if (game.phase === 'playing') {
      if (game.pendingEvent && game.pendingEvent.choices) {
        startChoiceCountdown();
        render();
      } else {
        scheduleNext();
      }
    }
  }, 600);
}

function setAutoGrow(on) {
  game.autoGrow = on;
  if (on) {
    if (game.pendingEvent && game.pendingEvent.choices) {
      startChoiceCountdown();
      render();
    } else {
      scheduleNext();
    }
  } else {
    stopAutoGrow();
  }
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
