// Canvas 渲染层：纯 Canvas 实现文字人生游戏的界面与交互
const DYNASTIES = require('./data/dynasties');

const screen = {
  width: 0,
  height: 0,
  ctx: null,
};

// 可点击区域（每帧重建）
let clickables = [];

function init(canvas) {
  screen.ctx = canvas.getContext('2d');
  screen.canvas = canvas;
  resize(canvas);
}

function resize(canvas) {
  const sys = wx.getSystemInfoSync();
  const dpr = sys.pixelRatio || 1;
  screen.dpr = dpr;
  screen.width = sys.windowWidth;
  screen.height = sys.windowHeight;
  // 物理像素 = 逻辑像素 * dpr，避免高清屏模糊
  canvas.width = Math.round(sys.windowWidth * dpr);
  canvas.height = Math.round(sys.windowHeight * dpr);
  // 用 scale 把绘制坐标系还原成逻辑像素，业务代码无需改动
  screen.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// 注册一个可点击按钮
function button(x, y, w, h, label, onClick, opts = {}) {
  const ctx = screen.ctx;
  ctx.fillStyle = opts.bg || '#3b6ea5';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = opts.color || '#ffffff';
  ctx.font = `${opts.font || 16}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  clickables.push({ x, y, w, h, onClick });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clear() {
  const ctx = screen.ctx;
  ctx.fillStyle = '#f4ecd8';
  ctx.fillRect(0, 0, screen.width, screen.height);
}

// 文本自动换行绘制，返回占用的高度
function drawText(text, x, y, maxWidth, lineHeight, font, color) {
  const ctx = screen.ctx;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  let line = '';
  let cy = y;
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = ch;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cy);
    cy += lineHeight;
  }
  return cy - y;
}

function handleTap(x, y) {
  for (const c of clickables) {
    if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
      c.onClick();
      return true;
    }
  }
  return false;
}

module.exports = {
  screen,
  init,
  resize,
  clear,
  button,
  drawText,
  roundRect,
  handleTap,
  resetClickables: () => (clickables = []),
  DYNASTIES,
};
