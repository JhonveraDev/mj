(() => {
  'use strict';

  const viewport = document.getElementById('mapViewport');
  const content = document.getElementById('mapContent');
  const svg = document.getElementById('connectorLayer');
  const zoomValue = document.getElementById('zoomValue');
  const zoomIn = document.getElementById('zoomIn');
  const zoomOut = document.getElementById('zoomOut');
  const fitMap = document.getElementById('fitMap');
  const expandAll = document.getElementById('expandAll');
  const collapseAll = document.getElementById('collapseAll');
  const helpButton = document.getElementById('helpButton');
  const helpPanel = document.getElementById('helpPanel');
  const helpClose = document.getElementById('helpClose');

  const state = {
    scale: 1,
    x: 0,
    y: 0,
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    dragMoved: false,
    focusedBranch: null
  };

  const isMobile = () => window.matchMedia('(max-width: 780px)').matches;

  function constrainPosition() {
    if (!viewport || !content || isMobile()) return;

    const contentWidth = content.scrollWidth * state.scale;
    const contentHeight = content.scrollHeight * state.scale;
    const keepVisibleX = Math.min(360, viewport.clientWidth * .42);
    const keepVisibleY = Math.min(240, viewport.clientHeight * .38);
    const minX = keepVisibleX - contentWidth;
    const maxX = viewport.clientWidth - keepVisibleX;
    const minY = keepVisibleY - contentHeight;
    const maxY = viewport.clientHeight - keepVisibleY;

    state.x = Math.min(maxX, Math.max(minX, state.x));
    state.y = Math.min(maxY, Math.max(minY, state.y));
  }

  const connections = [
    { from: 'root', to: 'branch-load', type: 'main load', label: 'se expresa como' },
    { from: 'root', to: 'branch-estimation', type: 'main estimation', label: 'se estima mediante' },
    { from: 'root', to: 'branch-derived', type: 'main derived', label: 'implica' },
    { from: 'root', to: 'branch-dme', type: 'main dme', label: 'puede generar' },
    { from: 'root', to: 'branch-application', type: 'main application', label: 'se aplica en' },

    { from: 'branch-load', to: 'load-definition', type: 'load', label: 'integra' },
    { from: 'branch-load', to: 'load-types', type: 'load', label: 'se clasifica en' },
    { from: 'load-types', to: 'static-load', type: 'load', label: 'puede ser' },
    { from: 'load-types', to: 'dynamic-load', type: 'load', label: 'o bien' },

    { from: 'branch-estimation', to: 'load-estimation', type: 'estimation', label: 'se realiza con' },
    { from: 'load-estimation', to: 'heart-rate', type: 'estimation', label: 'registra' },
    { from: 'load-estimation', to: 'metabolic', type: 'estimation', label: 'cuantifica' },
    { from: 'heart-rate', to: 'frimat', type: 'estimation', label: 'se interpreta con' },
    { from: 'heart-rate', to: 'chamoux', type: 'estimation', label: 'o con' },
    { from: 'load-estimation', to: 'method-complementarity', type: 'estimation', label: 'se complementa según' },

    { from: 'branch-derived', to: 'posture', type: 'derived', label: 'se manifiesta en' },
    { from: 'branch-derived', to: 'workstation', type: 'derived', label: 'se apoya en' },
    { from: 'branch-derived', to: 'forces', type: 'derived', label: 'demanda' },
    { from: 'branch-derived', to: 'movements', type: 'derived', label: 'incluye' },
    { from: 'branch-derived', to: 'visual-fatigue', type: 'derived', label: 'puede incluir' },
    { from: 'branch-derived', to: 'derived-prevention', type: 'derived', label: 'se controla con' },

    { from: 'branch-dme', to: 'dme-definition', type: 'dme', label: 'se explica como' },
    { from: 'branch-dme', to: 'dme-factors', type: 'dme', label: 'aumenta por' },
    { from: 'branch-dme', to: 'dme-types', type: 'dme', label: 'se manifiesta en' },
    { from: 'branch-dme', to: 'dme-prevention', type: 'dme', label: 'se previene al' },
    { from: 'branch-dme', to: 'dme-norms', type: 'dme', label: 'se gestiona con' },

    { from: 'branch-application', to: 'job-observation', type: 'application', label: 'comienza por' },
    { from: 'job-observation', to: 'application-demand', type: 'application', label: 'permite identificar' },
    { from: 'job-observation', to: 'application-method', type: 'application', label: 'orienta' },
    { from: 'application-demand', to: 'application-dme', type: 'application', label: 'puede asociarse a' },
    { from: 'application-method', to: 'application-control', type: 'application', label: 'sustenta' },
    { from: 'application-control', to: 'application-example', type: 'application', label: 'se ejemplifica en' },

    { from: 'branch-load', to: 'integration', type: 'cross load', label: 'aporta' },
    { from: 'branch-estimation', to: 'integration', type: 'cross estimation', label: 'aporta evidencia' },
    { from: 'branch-derived', to: 'integration', type: 'cross derived', label: 'modula' },
    { from: 'branch-dme', to: 'integration', type: 'cross dme', label: 'resume el riesgo' },
    { from: 'branch-application', to: 'integration', type: 'cross application', label: 'verifica en campo' },

    { from: 'static-load', to: 'posture', type: 'cross load', label: 'se agrava con' },
    { from: 'workstation', to: 'visual-fatigue', type: 'cross derived', label: 'condiciona' },
    { from: 'metabolic', to: 'dme-definition', type: 'cross estimation', label: 'puede contribuir a' },
    { from: 'posture', to: 'dme-definition', type: 'cross derived', label: 'puede generar' },
    { from: 'forces', to: 'dme-definition', type: 'cross derived', label: 'puede exceder' },
    { from: 'movements', to: 'dme-definition', type: 'cross derived', label: 'puede producir' },
    { from: 'application-demand', to: 'dme-factors', type: 'cross application', label: 'contrasta con' },
    { from: 'workstation', to: 'application-demand', type: 'cross application', label: 'se verifica en' }
  ];

  function applyTransform() {
    if (!content) return;
    if (isMobile()) {
      content.style.transform = 'none';
      if (zoomValue) zoomValue.textContent = '100%';
      return;
    }
    constrainPosition();
    content.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
    if (zoomValue) zoomValue.textContent = `${Math.round(state.scale * 100)}%`;
  }

  function getNodePoint(element, side = 'bottom') {
    const nodeRect = element.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const scale = state.scale || 1;
    const x = (nodeRect.left - contentRect.left + nodeRect.width / 2) / scale;
    let y;
    if (side === 'top') y = (nodeRect.top - contentRect.top) / scale;
    else if (side === 'center') y = (nodeRect.top - contentRect.top + nodeRect.height / 2) / scale;
    else y = (nodeRect.bottom - contentRect.top) / scale;
    return { x, y };
  }

  function makePath(from, to, type) {
    const start = getNodePoint(from, 'bottom');
    const end = getNodePoint(to, 'top');
    const sameRow = Math.abs(end.y - start.y) < 80;

    if (sameRow) {
      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const scale = state.scale || 1;
      const leftToRight = fromRect.left < toRect.left;
      const sx = ((leftToRight ? fromRect.right : fromRect.left) - contentRect.left) / scale;
      const sy = (fromRect.top - contentRect.top + fromRect.height / 2) / scale;
      const ex = ((leftToRight ? toRect.left : toRect.right) - contentRect.left) / scale;
      const ey = (toRect.top - contentRect.top + toRect.height / 2) / scale;
      const bend = Math.max(45, Math.abs(ex - sx) * .42);
      const c1 = sx + (leftToRight ? bend : -bend);
      const c2 = ex - (leftToRight ? bend : -bend);
      return `M ${sx} ${sy} C ${c1} ${sy}, ${c2} ${ey}, ${ex} ${ey}`;
    }

    const dy = Math.max(42, Math.abs(end.y - start.y) * .42);
    return `M ${start.x} ${start.y} C ${start.x} ${start.y + dy}, ${end.x} ${end.y - dy}, ${end.x} ${end.y}`;
  }

  function drawConnections() {
    if (!svg || isMobile()) return;
    const width = content.scrollWidth;
    const height = content.scrollHeight;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.innerHTML = '';

    connections.forEach(conn => {
      const from = document.getElementById(conn.from);
      const to = document.getElementById(conn.to);
      if (!from || !to || from.offsetParent === null || to.offsetParent === null) return;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', makePath(from, to, conn.type));
      path.setAttribute('class', `connector-path ${conn.type}`);
      path.dataset.from = conn.from;
      path.dataset.to = conn.to;
      svg.appendChild(path);
    });
  }

  function setScale(nextScale, anchorX = viewport.clientWidth / 2, anchorY = viewport.clientHeight / 2) {
    if (isMobile()) return;
    const clamped = Math.min(1.35, Math.max(.58, nextScale));
    const worldX = (anchorX - state.x) / state.scale;
    const worldY = (anchorY - state.y) / state.scale;
    state.scale = clamped;
    state.x = anchorX - worldX * state.scale;
    state.y = anchorY - worldY * state.scale;
    applyTransform();
    requestAnimationFrame(drawConnections);
  }

  function fitToWidth() {
    if (isMobile()) return;
    const padding = 44;
    const available = viewport.clientWidth - padding * 2;
    const naturalWidth = content.scrollWidth;
    state.scale = Math.min(1, Math.max(.58, available / naturalWidth));
    state.x = Math.max(padding, (viewport.clientWidth - naturalWidth * state.scale) / 2);
    state.y = 22;
    applyTransform();
    requestAnimationFrame(drawConnections);
  }

  function focusNode(id) {
    if (isMobile()) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const node = document.getElementById(id);
    if (!node) return;

    const contentRect = content.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const scaleBefore = state.scale;
    const worldX = (nodeRect.left - contentRect.left + nodeRect.width / 2) / scaleBefore;
    const worldY = (nodeRect.top - contentRect.top + nodeRect.height / 2) / scaleBefore;
    state.scale = .96;
    state.x = viewport.clientWidth / 2 - worldX * state.scale;
    state.y = viewport.clientHeight / 2 - worldY * state.scale;
    applyTransform();
  }

  function clearFocus() {
    state.focusedBranch = null;
    content.classList.remove('has-focus');
    document.querySelectorAll('.branch').forEach(branch => branch.classList.remove('is-focused'));
    svg?.querySelectorAll('.connector-path').forEach(path => path.classList.remove('active'));
  }

  function toggleFocus(branchName) {
    const branch = document.querySelector(`[data-branch="${branchName}"]`);
    if (!branch) return;

    if (state.focusedBranch === branchName) {
      clearFocus();
      fitToWidth();
      return;
    }

    state.focusedBranch = branchName;
    content.classList.add('has-focus');
    document.querySelectorAll('.branch').forEach(item => item.classList.toggle('is-focused', item === branch));

    const branchNode = branch.querySelector('.branch-node');
    focusNode(branchNode.id);

    requestAnimationFrame(() => {
      svg?.querySelectorAll('.connector-path').forEach(path => {
        const active = path.dataset.from?.includes(branchName) || path.dataset.to?.includes(branchName);
        path.classList.toggle('active', Boolean(active));
      });
    });
  }

  function setBranchExpanded(branchName, expanded) {
    const branch = document.querySelector(`[data-branch="${branchName}"]`);
    const button = document.querySelector(`[data-toggle-branch="${branchName}"]`);
    if (!branch || !button) return;
    branch.classList.toggle('collapsed', !expanded);
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute('aria-label', `${expanded ? 'Contraer' : 'Expandir'} rama ${branch.querySelector('h2')?.textContent || ''}`);
    requestAnimationFrame(() => requestAnimationFrame(drawConnections));
  }

  document.querySelectorAll('.branch-toggle').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      const name = button.dataset.toggleBranch;
      setBranchExpanded(name, button.getAttribute('aria-expanded') !== 'true');
    });
  });

  document.querySelectorAll('.branch-node').forEach(node => {
    node.addEventListener('click', event => {
      if (event.target.closest('button')) return;
      const branchName = node.closest('.branch')?.dataset.branch;
      if (branchName) toggleFocus(branchName);
    });
    node.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target.closest('button')) return;
      event.preventDefault();
      const branchName = node.closest('.branch')?.dataset.branch;
      if (branchName) toggleFocus(branchName);
    });
  });

  document.querySelectorAll('.focus-btn').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      const branchName = button.closest('.branch')?.dataset.branch;
      if (branchName) toggleFocus(branchName);
    });
  });

  document.querySelectorAll('.detail-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const detail = button.nextElementSibling;
      if (!detail?.classList.contains('node-detail')) return;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      detail.hidden = expanded;
      requestAnimationFrame(() => requestAnimationFrame(drawConnections));
    });
  });

  expandAll?.addEventListener('click', () => {
    document.querySelectorAll('.branch').forEach(branch => setBranchExpanded(branch.dataset.branch, true));
    document.querySelectorAll('.detail-toggle').forEach(button => {
      const detail = button.nextElementSibling;
      button.setAttribute('aria-expanded', 'true');
      if (detail?.classList.contains('node-detail')) detail.hidden = false;
    });
    clearFocus();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      drawConnections();
      if (!isMobile()) fitToWidth();
    }));
  });

  collapseAll?.addEventListener('click', () => {
    document.querySelectorAll('.detail-toggle').forEach(button => {
      const detail = button.nextElementSibling;
      button.setAttribute('aria-expanded', 'false');
      if (detail?.classList.contains('node-detail')) detail.hidden = true;
    });
    document.querySelectorAll('.branch').forEach(branch => setBranchExpanded(branch.dataset.branch, false));
    clearFocus();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      drawConnections();
      if (!isMobile()) fitToWidth();
    }));
  });

  zoomIn?.addEventListener('click', () => setScale(state.scale + .1));
  zoomOut?.addEventListener('click', () => setScale(state.scale - .1));
  fitMap?.addEventListener('click', () => { clearFocus(); fitToWidth(); });

  viewport?.addEventListener('wheel', event => {
    if (isMobile() || !event.ctrlKey) return;
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const anchorX = event.clientX - rect.left;
    const anchorY = event.clientY - rect.top;
    setScale(state.scale + (event.deltaY < 0 ? .08 : -.08), anchorX, anchorY);
  }, { passive: false });

  viewport?.addEventListener('pointerdown', event => {
    if (isMobile()) return;
    if (event.target.closest('button, a')) return;
    state.dragging = true;
    state.dragMoved = false;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.originX = state.x;
    state.originY = state.y;
    viewport.classList.add('is-dragging');
    viewport.setPointerCapture?.(event.pointerId);
  });

  viewport?.addEventListener('pointermove', event => {
    if (!state.dragging || isMobile()) return;
    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;
    if (Math.hypot(deltaX, deltaY) > 4) state.dragMoved = true;
    state.x = state.originX + deltaX;
    state.y = state.originY + deltaY;
    applyTransform();
  });

  const endDrag = event => {
    if (!state.dragging) return;
    state.dragging = false;
    viewport?.classList.remove('is-dragging');
    try { viewport?.releasePointerCapture?.(event.pointerId); } catch (_) {}
    if (state.dragMoved) setTimeout(() => { state.dragMoved = false; }, 0);
  };
  viewport?.addEventListener('pointerup', endDrag);
  viewport?.addEventListener('pointercancel', endDrag);
  viewport?.addEventListener('click', event => {
    if (!state.dragMoved) return;
    event.preventDefault();
    event.stopPropagation();
    state.dragMoved = false;
  }, true);

  helpButton?.addEventListener('click', () => {
    const open = helpButton.getAttribute('aria-expanded') === 'true';
    helpButton.setAttribute('aria-expanded', String(!open));
    helpPanel.hidden = open;
  });
  helpClose?.addEventListener('click', () => {
    helpPanel.hidden = true;
    helpButton?.setAttribute('aria-expanded', 'false');
  });

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!helpPanel?.hidden) {
        helpPanel.hidden = true;
        helpButton?.setAttribute('aria-expanded', 'false');
      } else if (state.focusedBranch) {
        clearFocus();
        fitToWidth();
      }
    }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      clearFocus();
      if (isMobile()) {
        state.scale = 1; state.x = 0; state.y = 0; applyTransform();
      } else {
        fitToWidth();
      }
      drawConnections();
    }, 120);
  });

  const observer = new ResizeObserver(() => {
    if (!isMobile()) requestAnimationFrame(drawConnections);
  });
  document.querySelectorAll('.branch-body, .node-detail').forEach(el => observer.observe(el));

  window.addEventListener('load', () => {
    applyTransform();
    if (!isMobile()) fitToWidth();
    requestAnimationFrame(() => requestAnimationFrame(drawConnections));
  });
})();
