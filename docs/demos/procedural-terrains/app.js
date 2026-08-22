const modeData = {
  tile: {
    index: "MODE 01",
    title: "Tile · 可编辑地形板",
    description: "固定分块、逐块 LOD、画笔、样条线、多 Tile 拼装与高质量导出集中在一个可控创作画布中。",
    space: "固定 board + chunk LOD",
    task: "编辑、绘制、烘焙与导出",
    evidence: "46 FPS / Intel UHD / 44K triangles*",
    image: "./assets/terrain-tile.png",
    alt: "Tile 模式中的 Mountain range 地形编辑器"
  },
  infinite: {
    index: "MODE 02",
    title: "Infinite World · 相机周围持续流送",
    description: "世界由相机附近的 chunk 网格动态组织，配合三角形预算、身后剔除和 Walk / Plane 探索，形成无固定边界的浏览体验。",
    space: "streamed grid + camera-relative chunks",
    task: "步行探索、飞行穿越与性能预算",
    evidence: "115 FPS / 178 visible chunks / 79K triangles*",
    image: "./assets/terrain-infinite-plane.png",
    alt: "Infinite World 的 Plane 飞行探索视角"
  },
  planet: {
    index: "MODE 03",
    title: "Planet · Cube-sphere 程序化星球",
    description: "六个立方体面投影为球体分块，继续复用地形噪声、材质、云和大气语言，并用轨道相机与专用 cubemap 导出工作流组织。",
    space: "cube-sphere + orbital camera",
    task: "星球造型、风格化环境与 cubemap 烘焙",
    evidence: "76 FPS / 175 draw calls / 155K triangles*",
    image: "./assets/terrain-planet.png",
    alt: "Planet 模式中的程序化冰雪星球"
  }
};

const tabs = [...document.querySelectorAll('[role="tab"][data-mode]')];
const panel = document.querySelector('#mode-panel');
const fields = {
  index: document.querySelector('#mode-index'),
  title: document.querySelector('#mode-title'),
  description: document.querySelector('#mode-description'),
  space: document.querySelector('#mode-space'),
  task: document.querySelector('#mode-task'),
  evidence: document.querySelector('#mode-evidence'),
  image: document.querySelector('#mode-image')
};

function selectMode(tab, moveFocus = false) {
  const data = modeData[tab.dataset.mode];
  if (!data) return;

  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });

  panel.setAttribute('aria-labelledby', tab.id);
  fields.index.textContent = data.index;
  fields.title.textContent = data.title;
  fields.description.textContent = data.description;
  fields.space.textContent = data.space;
  fields.task.textContent = data.task;
  fields.evidence.textContent = data.evidence;
  fields.image.src = data.image;
  fields.image.alt = data.alt;

  if (moveFocus) tab.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectMode(tab));
  tab.addEventListener('keydown', (event) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    selectMode(tabs[nextIndex], true);
  });
});

const navLinks = [...document.querySelectorAll('.chapter-nav a')];
const sections = [...document.querySelectorAll('[data-chapter]')];

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${visible.target.id}`;
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.15, 0.5] });

sections.forEach((section) => observer.observe(section));
}

// ES modules do not run reliably from file://. During local research, route the
// prototype entry to its canonical Vite server; deployed HTTP pages keep the
// relative static-build URL.
if (window.location.protocol === 'file:') {
  document.querySelectorAll('[data-rts-prototype]').forEach((link) => {
    link.href = 'http://127.0.0.1:6072/';
    link.title = '本地运行：projects/procedural-terrains/rts-map-profile → npm run dev';
  });
}
