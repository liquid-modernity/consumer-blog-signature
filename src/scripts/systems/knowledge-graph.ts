import { registerSiteCommand } from './site-commands';
type GraphNodeKind = 'article' | 'topic' | 'author';
type GraphRelation = 'author' | 'contributor' | 'related' | 'entity' | 'main-entity' | 'source';

type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  label: string;
  href: string;
  summary?: string;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  relation: GraphRelation;
};

type GraphData = {
  version: 1;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type LayoutNode = GraphNode & {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEWBOX_WIDTH = 1200;
const VIEWBOX_HEIGHT = 760;
const FORCE_NODE_LIMIT = 220;
const MIN_ZOOM = 0.55;
const MAX_ZOOM = 2.8;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function initialPosition(node: GraphNode, index: number, total: number) {
  const hash = hashString(node.id);
  const angle = ((hash % 3600) / 3600) * Math.PI * 2 + (index / Math.max(total, 1)) * 0.45;
  const kindOffset = node.kind === 'author' ? -120 : node.kind === 'topic' ? 90 : 0;
  const radius = 170 + (hash % 260) + kindOffset;
  return {
    x: VIEWBOX_WIDTH / 2 + Math.cos(angle) * radius,
    y: VIEWBOX_HEIGHT / 2 + Math.sin(angle) * Math.max(120, radius * 0.62)
  };
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(name: K) {
  return document.createElementNS(SVG_NS, name);
}

function initKnowledgeGraph() {
  const root = document.querySelector<HTMLElement>('[data-gaga-knowledge-graph]');
  if (!root || root.dataset.gagaGraphReady === 'true') return;

  const dataNode = root.querySelector<HTMLScriptElement>('[data-gaga-graph-data]');
  const svg = root.querySelector<SVGSVGElement>('[data-gaga-graph-svg]');
  const viewport = root.querySelector<SVGGElement>('[data-gaga-graph-viewport]');
  const edgesLayer = root.querySelector<SVGGElement>('[data-gaga-graph-edges]');
  const nodesLayer = root.querySelector<SVGGElement>('[data-gaga-graph-nodes]');
  const canvas = root.querySelector<HTMLElement>('[data-gaga-graph-canvas]');
  const searchForm = root.querySelector<HTMLFormElement>('[data-gaga-graph-search]');
  const searchInput = root.querySelector<HTMLInputElement>('[data-gaga-graph-search-input]');
  const status = root.querySelector<HTMLElement>('[data-gaga-graph-status]');
  const depthSelect = root.querySelector<HTMLSelectElement>('[data-gaga-graph-depth]');
  const labelToggle = root.querySelector<HTMLInputElement>('[data-gaga-graph-label-toggle]');
  const zoomIn = root.querySelector<HTMLButtonElement>('[data-gaga-graph-zoom-in]');
  const zoomOut = root.querySelector<HTMLButtonElement>('[data-gaga-graph-zoom-out]');
  const resetButton = root.querySelector<HTMLButtonElement>('[data-gaga-graph-reset]');
  const makeLocal = root.querySelector<HTMLButtonElement>('[data-gaga-graph-make-local]');
  const openLink = root.querySelector<HTMLAnchorElement>('[data-gaga-graph-open]');
  const inspectorKind = root.querySelector<HTMLElement>('[data-gaga-graph-inspector-kind]');
  const inspectorTitle = root.querySelector<HTMLElement>('[data-gaga-graph-inspector-title]');
  const inspectorSummary = root.querySelector<HTMLElement>('[data-gaga-graph-inspector-summary]');
  const inspectorMeta = root.querySelector<HTMLElement>('[data-gaga-graph-inspector-meta]');
  const inspectorRelations = root.querySelector<HTMLUListElement>('[data-gaga-graph-inspector-relations]');
  const relationTemplate = root.querySelector<HTMLTemplateElement>('[data-gaga-graph-relation-template]');

  if (!dataNode || !svg || !viewport || !edgesLayer || !nodesLayer || !canvas || !status) return;

  // Preserve the post-guard non-null DOM contract inside nested callbacks.
  const rootElement = root;
  const svgElement = svg;
  const viewportElement = viewport;
  const edgesLayerElement = edgesLayer;
  const nodesLayerElement = nodesLayer;
  const statusElement = status;

  let data: GraphData;
  try {
    data = JSON.parse(dataNode.textContent ?? '') as GraphData;
  } catch {
    statusElement.textContent = 'Graph tidak dapat dimuat karena dataset tidak valid.';
    return;
  }

  if (data.version !== 1 || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    statusElement.textContent = 'Versi dataset graph tidak didukung.';
    return;
  }

  rootElement.dataset.gagaGraphReady = 'true';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const nodesById = new Map(data.nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, Set<string>>();
  const edgeByPair = new Map<string, GraphEdge[]>();
  const degrees = new Map<string, number>();

  function addNeighbor(source: string, target: string) {
    const neighbors = adjacency.get(source) ?? new Set<string>();
    neighbors.add(target);
    adjacency.set(source, neighbors);
  }

  for (const edge of data.edges) {
    if (!nodesById.has(edge.source) || !nodesById.has(edge.target)) continue;
    addNeighbor(edge.source, edge.target);
    addNeighbor(edge.target, edge.source);
    degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
    const pairKey = [edge.source, edge.target].sort().join('\u0000');
    const pairEdges = edgeByPair.get(pairKey) ?? [];
    pairEdges.push(edge);
    edgeByPair.set(pairKey, pairEdges);
  }

  const layout = new Map<string, LayoutNode>();
  data.nodes.forEach((node, index) => {
    const position = initialPosition(node, index, data.nodes.length);
    layout.set(node.id, { ...node, ...position, vx: 0, vy: 0 });
  });

  let selectedId: string | null = null;
  let hoveredId: string | null = null;
  let mode: 'global' | 'local' = 'global';
  let depth = 1;
  let query = '';
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let simulationFrame = 0;
  let simulationTicks = 0;
  let renderedNodeIds = new Set<string>();
  let currentVisibleEdges: GraphEdge[] = [];
  let canvasPointerId: number | null = null;
  let lastCanvasPointer = { x: 0, y: 0 };
  let draggedNodeId: string | null = null;

  function setStatus(message: string) {
    statusElement.textContent = message;
  }

  function currentKinds() {
    const kinds = new Set<GraphNodeKind>();
    for (const input of rootElement.querySelectorAll<HTMLInputElement>('[data-gaga-graph-kind]')) {
      if (input.checked && (input.value === 'article' || input.value === 'topic' || input.value === 'author')) {
        kinds.add(input.value);
      }
    }
    return kinds;
  }

  function localNodeIds(centerId: string, maxDepth: number) {
    const visited = new Set<string>([centerId]);
    let frontier = new Set<string>([centerId]);
    for (let level = 0; level < maxDepth; level += 1) {
      const next = new Set<string>();
      for (const id of frontier) {
        for (const neighbor of adjacency.get(id) ?? []) {
          if (visited.has(neighbor)) continue;
          visited.add(neighbor);
          next.add(neighbor);
        }
      }
      frontier = next;
      if (!frontier.size) break;
    }
    return visited;
  }

  function queryNodeIds(value: string) {
    const normalized = value.trim().toLocaleLowerCase('id-ID');
    if (normalized.length < 2) return null;
    const matches = data.nodes.filter((node) => (
      node.label.toLocaleLowerCase('id-ID').includes(normalized)
      || node.id.toLocaleLowerCase('id-ID').includes(normalized)
      || node.kind.includes(normalized)
    ));
    if (!matches.length) return new Set<string>();
    const ids = new Set(matches.map((node) => node.id));
    for (const node of matches) {
      for (const neighbor of adjacency.get(node.id) ?? []) ids.add(neighbor);
    }
    return ids;
  }

  function visibleNodeIds() {
    const kinds = currentKinds();
    let visible = new Set(data.nodes.filter((node) => kinds.has(node.kind)).map((node) => node.id));

    if (mode === 'local' && selectedId) {
      const local = localNodeIds(selectedId, depth);
      visible = new Set([...visible].filter((id) => local.has(id)));
      if (nodesById.has(selectedId)) visible.add(selectedId);
    }

    const queried = queryNodeIds(query);
    if (queried) visible = new Set([...visible].filter((id) => queried.has(id)));

    return visible;
  }

  function relationLabel(relation: GraphRelation) {
    if (relation === 'author') return 'author';
    if (relation === 'contributor') return 'contributor';
    if (relation === 'related') return 'related';
    if (relation === 'main-entity') return 'main entity';
    if (relation === 'entity') return 'entity';
    return 'source';
  }

  function connectedRelation(source: string, target: string) {
    const pairKey = [source, target].sort().join('\u0000');
    const relations = edgeByPair.get(pairKey) ?? [];
    return [...new Set(relations.map((edge) => relationLabel(edge.relation)))].join(', ');
  }

  function updateInspector() {
    if (!inspectorKind || !inspectorTitle || !inspectorSummary || !inspectorMeta || !inspectorRelations || !relationTemplate || !makeLocal || !openLink) return;
    inspectorRelations.replaceChildren();

    if (!selectedId) {
      inspectorKind.textContent = 'GRAPH';
      inspectorTitle.textContent = 'Pilih sebuah node';
      inspectorSummary.textContent = 'Klik atau fokuskan node untuk melihat hubungan publiknya.';
      inspectorMeta.textContent = '';
      makeLocal.disabled = true;
      openLink.hidden = true;
      openLink.removeAttribute('href');
      return;
    }

    const node = nodesById.get(selectedId);
    if (!node) return;
    const neighbors = [...(adjacency.get(node.id) ?? [])]
      .map((id) => nodesById.get(id))
      .filter((candidate): candidate is GraphNode => Boolean(candidate))
      .sort((left, right) => left.label.localeCompare(right.label));

    inspectorKind.textContent = node.kind.toUpperCase();
    inspectorTitle.textContent = node.label;
    inspectorSummary.textContent = node.summary ?? 'Tidak ada ringkasan tambahan pada node ini.';
    inspectorMeta.textContent = `${neighbors.length} hubungan publik`;
    makeLocal.disabled = false;
    openLink.hidden = false;
    openLink.href = node.href;
    openLink.textContent = node.kind === 'article' ? 'Baca' : 'Buka';

    for (const neighbor of neighbors.slice(0, 8)) {
      const fragment = relationTemplate.content.cloneNode(true) as DocumentFragment;
      const link = fragment.querySelector<HTMLAnchorElement>('[data-gaga-graph-relation-link]');
      const meta = fragment.querySelector<HTMLElement>('[data-gaga-graph-relation-meta]');
      if (!link || !meta) continue;
      link.href = neighbor.href;
      link.textContent = neighbor.label;
      meta.textContent = connectedRelation(node.id, neighbor.id);
      inspectorRelations.append(fragment);
    }
  }

  function updateUrlFocus() {
    const url = new URL(window.location.href);
    if (mode === 'local' && selectedId) url.searchParams.set('focus', selectedId);
    else url.searchParams.delete('focus');
    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) window.history.replaceState({}, '', next);
  }

  function selectNode(id: string, options: { announce?: boolean; makeLocal?: boolean } = {}) {
    if (!nodesById.has(id)) return;
    selectedId = id;
    if (options.makeLocal) mode = 'local';
    syncModeControls();
    updateInspector();
    updateHighlighting();
    if (mode === 'local') {
      updateUrlFocus();
      rebuildGraph();
    }
    if (options.announce !== false) {
      const node = nodesById.get(id);
      if (node) setStatus(`${node.label} dipilih. ${degrees.get(id) ?? 0} hubungan publik.`);
    }
  }

  function setMode(nextMode: 'global' | 'local') {
    mode = nextMode;
    if (mode === 'local' && !selectedId) {
      const mostConnected = [...data.nodes].sort((left, right) => (degrees.get(right.id) ?? 0) - (degrees.get(left.id) ?? 0))[0];
      if (mostConnected) selectedId = mostConnected.id;
    }
    syncModeControls();
    updateInspector();
    updateUrlFocus();
    rebuildGraph();
  }

  function syncModeControls() {
    for (const input of rootElement.querySelectorAll<HTMLInputElement>('[data-gaga-graph-mode]')) {
      input.checked = input.value === mode;
    }
  }

  function setTransform() {
    viewportElement.setAttribute('transform', `translate(${panX} ${panY}) scale(${zoom})`);
  }

  function toViewBoxPoint(clientX: number, clientY: number) {
    const rect = svgElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / Math.max(rect.width, 1)) * VIEWBOX_WIDTH;
    const y = ((clientY - rect.top) / Math.max(rect.height, 1)) * VIEWBOX_HEIGHT;
    return { x, y };
  }

  function zoomAt(nextZoom: number, centerX = VIEWBOX_WIDTH / 2, centerY = VIEWBOX_HEIGHT / 2) {
    const clamped = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const worldX = (centerX - panX) / zoom;
    const worldY = (centerY - panY) / zoom;
    panX = centerX - worldX * clamped;
    panY = centerY - worldY * clamped;
    zoom = clamped;
    setTransform();
  }

  function nodeRadius(node: GraphNode) {
    const degree = degrees.get(node.id) ?? 0;
    const base = node.kind === 'author' ? 8.5 : node.kind === 'topic' ? 7.5 : 5.5;
    return clamp(base + Math.sqrt(degree) * 1.15, base, 15);
  }

  function updateHighlighting() {
    const focusId = hoveredId ?? selectedId;
    const connected = focusId ? adjacency.get(focusId) ?? new Set<string>() : new Set<string>();

    for (const element of nodesLayerElement.querySelectorAll<SVGGElement>('[data-gaga-graph-node]')) {
      const id = element.dataset.gagaGraphNode ?? '';
      const selected = id === selectedId;
      const emphasized = !focusId || id === focusId || connected.has(id);
      element.classList.toggle('gaga-is-selected', selected);
      element.classList.toggle('gaga-is-muted', !emphasized);
      element.setAttribute('aria-pressed', selected ? 'true' : 'false');
    }

    for (const element of edgesLayerElement.querySelectorAll<SVGLineElement>('[data-gaga-graph-edge]')) {
      const source = element.dataset.gagaGraphSource ?? '';
      const target = element.dataset.gagaGraphTarget ?? '';
      const emphasized = !focusId || source === focusId || target === focusId;
      element.classList.toggle('gaga-is-muted', !emphasized);
      element.classList.toggle('gaga-is-emphasized', emphasized && Boolean(focusId));
    }
  }

  function renderPositions() {
    for (const element of edgesLayerElement.querySelectorAll<SVGLineElement>('[data-gaga-graph-edge]')) {
      const source = layout.get(element.dataset.gagaGraphSource ?? '');
      const target = layout.get(element.dataset.gagaGraphTarget ?? '');
      if (!source || !target) continue;
      element.setAttribute('x1', source.x.toFixed(2));
      element.setAttribute('y1', source.y.toFixed(2));
      element.setAttribute('x2', target.x.toFixed(2));
      element.setAttribute('y2', target.y.toFixed(2));
    }

    for (const element of nodesLayerElement.querySelectorAll<SVGGElement>('[data-gaga-graph-node]')) {
      const node = layout.get(element.dataset.gagaGraphNode ?? '');
      if (!node) continue;
      element.setAttribute('transform', `translate(${node.x.toFixed(2)} ${node.y.toFixed(2)})`);
    }
  }

  function runForceTick(visibleIds: string[], edges: GraphEdge[]) {
    const visibleNodes = visibleIds.map((id) => layout.get(id)).filter((node): node is LayoutNode => Boolean(node));
    const centerX = VIEWBOX_WIDTH / 2;
    const centerY = VIEWBOX_HEIGHT / 2;

    for (let leftIndex = 0; leftIndex < visibleNodes.length; leftIndex += 1) {
      const left = visibleNodes[leftIndex];
      for (let rightIndex = leftIndex + 1; rightIndex < visibleNodes.length; rightIndex += 1) {
        const right = visibleNodes[rightIndex];
        let dx = right.x - left.x;
        let dy = right.y - left.y;
        const distanceSquared = Math.max(dx * dx + dy * dy, 90);
        const distance = Math.sqrt(distanceSquared);
        dx /= distance;
        dy /= distance;
        const force = Math.min(11, 5200 / distanceSquared);
        left.vx -= dx * force;
        left.vy -= dy * force;
        right.vx += dx * force;
        right.vy += dy * force;
      }
    }

    for (const edge of edges) {
      const source = layout.get(edge.source);
      const target = layout.get(edge.target);
      if (!source || !target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const desired = edge.relation === 'author' ? 115 : 135;
      const spring = (distance - desired) * 0.0027;
      const nx = dx / distance;
      const ny = dy / distance;
      source.vx += nx * spring;
      source.vy += ny * spring;
      target.vx -= nx * spring;
      target.vy -= ny * spring;
    }

    for (const node of visibleNodes) {
      node.vx += (centerX - node.x) * 0.0009;
      node.vy += (centerY - node.y) * 0.0009;
      node.vx *= 0.84;
      node.vy *= 0.84;
      node.x = clamp(node.x + node.vx, 38, VIEWBOX_WIDTH - 38);
      node.y = clamp(node.y + node.vy, 38, VIEWBOX_HEIGHT - 38);
    }
  }

  function settleLargeGraph(visibleIds: string[]) {
    const visibleNodes = visibleIds.map((id) => layout.get(id)).filter((node): node is LayoutNode => Boolean(node));
    const groups: Record<GraphNodeKind, LayoutNode[]> = { article: [], topic: [], author: [] };
    for (const node of visibleNodes) groups[node.kind].push(node);
    const centers: Record<GraphNodeKind, { x: number; y: number }> = {
      article: { x: VIEWBOX_WIDTH * 0.52, y: VIEWBOX_HEIGHT * 0.56 },
      topic: { x: VIEWBOX_WIDTH * 0.28, y: VIEWBOX_HEIGHT * 0.28 },
      author: { x: VIEWBOX_WIDTH * 0.76, y: VIEWBOX_HEIGHT * 0.25 }
    };

    for (const kind of Object.keys(groups) as GraphNodeKind[]) {
      const nodes = groups[kind];
      nodes.forEach((node, index) => {
        const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2;
        const ring = 80 + Math.floor(index / 32) * 44;
        node.x = centers[kind].x + Math.cos(angle) * ring;
        node.y = centers[kind].y + Math.sin(angle) * ring * 0.72;
        node.vx = 0;
        node.vy = 0;
      });
    }
  }

  function startSimulation() {
    window.cancelAnimationFrame(simulationFrame);
    const visibleIds = [...renderedNodeIds];
    if (!visibleIds.length) return;

    if (visibleIds.length > FORCE_NODE_LIMIT) {
      settleLargeGraph(visibleIds);
      renderPositions();
      setStatus(`${visibleIds.length} node tampil dalam large-graph mode.`);
      return;
    }

    simulationTicks = prefersReducedMotion.matches ? 90 : 0;
    if (prefersReducedMotion.matches) {
      for (let iteration = 0; iteration < 90; iteration += 1) runForceTick(visibleIds, currentVisibleEdges);
      renderPositions();
      return;
    }

    const frame = () => {
      simulationTicks += 1;
      runForceTick(visibleIds, currentVisibleEdges);
      renderPositions();
      if (simulationTicks < 240 && !draggedNodeId) simulationFrame = window.requestAnimationFrame(frame);
    };
    simulationFrame = window.requestAnimationFrame(frame);
  }

  function nodeAriaLabel(node: GraphNode) {
    const relationCount = degrees.get(node.id) ?? 0;
    return `${node.label}, ${node.kind}, ${relationCount} hubungan. Enter untuk membuka, Space untuk memilih.`;
  }

  function attachNodeEvents(group: SVGGElement, node: GraphNode) {
    group.addEventListener('pointerenter', () => {
      hoveredId = node.id;
      updateHighlighting();
    });
    group.addEventListener('pointerleave', () => {
      hoveredId = null;
      updateHighlighting();
    });
    group.addEventListener('click', (event) => {
      event.stopPropagation();
      selectNode(node.id);
    });
    group.addEventListener('dblclick', (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(node.href);
    });
    group.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      draggedNodeId = node.id;
      const point = toViewBoxPoint(event.clientX, event.clientY);
      const layoutNode = layout.get(node.id);
      if (layoutNode) {
        layoutNode.x = (point.x - panX) / zoom;
        layoutNode.y = (point.y - panY) / zoom;
        layoutNode.vx = 0;
        layoutNode.vy = 0;
        renderPositions();
      }
      group.setPointerCapture?.(event.pointerId);
    });
  }

  function createGraphNode(node: GraphNode) {
    const group = createSvgElement('g');
    group.classList.add('gaga-knowledge-graph__node', `gaga-knowledge-graph__node--${node.kind}`);
    group.dataset.gagaGraphNode = node.id;
    group.dataset.gagaGraphHref = node.href;
    group.setAttribute('role', 'button');
    group.setAttribute('tabindex', '0');
    group.setAttribute('aria-label', nodeAriaLabel(node));
    group.setAttribute('aria-pressed', node.id === selectedId ? 'true' : 'false');

    const hit = createSvgElement('circle');
    hit.classList.add('gaga-knowledge-graph__node-hit');
    hit.setAttribute('r', '18');

    const circle = createSvgElement('circle');
    circle.classList.add('gaga-knowledge-graph__node-dot');
    circle.setAttribute('r', nodeRadius(node).toFixed(2));

    const label = createSvgElement('text');
    label.classList.add('gaga-knowledge-graph__node-label');
    label.setAttribute('x', (nodeRadius(node) + 8).toFixed(2));
    label.setAttribute('y', '4');
    label.textContent = node.label;

    group.append(hit, circle, label);
    attachNodeEvents(group, node);
    return group;
  }

  function rebuildGraph() {
    const visibleIds = visibleNodeIds();
    renderedNodeIds = visibleIds;
    currentVisibleEdges = data.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
    edgesLayerElement.replaceChildren();
    nodesLayerElement.replaceChildren();

    for (const edge of currentVisibleEdges) {
      const line = createSvgElement('line');
      line.classList.add('gaga-knowledge-graph__edge', `gaga-knowledge-graph__edge--${edge.relation}`);
      line.dataset.gagaGraphEdge = edge.id;
      line.dataset.gagaGraphSource = edge.source;
      line.dataset.gagaGraphTarget = edge.target;
      edgesLayerElement.append(line);
    }

    for (const node of data.nodes) {
      if (!visibleIds.has(node.id)) continue;
      nodesLayerElement.append(createGraphNode(node));
    }

    renderPositions();
    updateHighlighting();
    updateInspector();
    startSimulation();

    if (!visibleIds.size) setStatus('Tidak ada node yang cocok dengan filter saat ini.');
    else if (query.trim().length >= 2) setStatus(`${visibleIds.size} node cocok atau berhubungan dengan pencarian.`);
    else if (mode === 'local' && selectedId) setStatus(`Local graph depth ${depth}: ${visibleIds.size} node.`);
    else setStatus(`${visibleIds.size} node dan ${currentVisibleEdges.length} relationship tampil.`);
  }

  function resetView() {
    selectedId = null;
    mode = 'global';
    zoom = 1;
    panX = 0;
    panY = 0;
    query = '';
    if (searchInput) searchInput.value = '';
    syncModeControls();
    updateInspector();
    updateUrlFocus();
    setTransform();
    rebuildGraph();
  }

  for (const input of rootElement.querySelectorAll<HTMLInputElement>('[data-gaga-graph-mode]')) {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      setMode(input.value === 'local' ? 'local' : 'global');
    });
  }

  for (const input of rootElement.querySelectorAll<HTMLInputElement>('[data-gaga-graph-kind]')) {
    input.addEventListener('change', rebuildGraph);
  }

  depthSelect?.addEventListener('change', () => {
    const nextDepth = Number.parseInt(depthSelect.value, 10);
    depth = clamp(Number.isNaN(nextDepth) ? 1 : nextDepth, 1, 3);
    if (mode === 'local') rebuildGraph();
  });

  labelToggle?.addEventListener('change', () => {
    rootElement.dataset.gagaGraphLabels = labelToggle.checked ? 'true' : 'false';
  });

  searchInput?.addEventListener('input', () => {
    query = searchInput.value;
    rebuildGraph();
  });

  searchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!searchInput) return;
    query = searchInput.value.trim();
    const normalized = query.toLocaleLowerCase('id-ID');
    const match = data.nodes
      .filter((node) => node.label.toLocaleLowerCase('id-ID').includes(normalized) || node.id.toLocaleLowerCase('id-ID').includes(normalized))
      .sort((left, right) => (degrees.get(right.id) ?? 0) - (degrees.get(left.id) ?? 0))[0];
    if (!match) {
      rebuildGraph();
      setStatus('Node tidak ditemukan.');
      return;
    }
    selectNode(match.id, { makeLocal: true });
  });

  makeLocal?.addEventListener('click', () => {
    if (!selectedId) return;
    setMode('local');
  });

  zoomIn?.addEventListener('click', () => zoomAt(zoom * 1.18));
  zoomOut?.addEventListener('click', () => zoomAt(zoom / 1.18));
  registerSiteCommand('reset-knowledge-graph', () => {
    resetView();
    return true;
  });
  resetButton?.addEventListener('click', resetView);

  svgElement.addEventListener('wheel', (event) => {
    event.preventDefault();
    const point = toViewBoxPoint(event.clientX, event.clientY);
    zoomAt(zoom * (event.deltaY > 0 ? 0.9 : 1.1), point.x, point.y);
  }, { passive: false });

  svgElement.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || draggedNodeId) return;
    canvasPointerId = event.pointerId;
    lastCanvasPointer = toViewBoxPoint(event.clientX, event.clientY);
    svgElement.setPointerCapture?.(event.pointerId);
  });

  svgElement.addEventListener('pointermove', (event) => {
    if (draggedNodeId) {
      const point = toViewBoxPoint(event.clientX, event.clientY);
      const node = layout.get(draggedNodeId);
      if (node) {
        node.x = clamp((point.x - panX) / zoom, 38, VIEWBOX_WIDTH - 38);
        node.y = clamp((point.y - panY) / zoom, 38, VIEWBOX_HEIGHT - 38);
        node.vx = 0;
        node.vy = 0;
        renderPositions();
      }
      return;
    }
    if (canvasPointerId !== event.pointerId) return;
    const point = toViewBoxPoint(event.clientX, event.clientY);
    panX += point.x - lastCanvasPointer.x;
    panY += point.y - lastCanvasPointer.y;
    lastCanvasPointer = point;
    setTransform();
  });

  const endPointer = (event: PointerEvent) => {
    if (draggedNodeId) {
      draggedNodeId = null;
      startSimulation();
    }
    if (canvasPointerId === event.pointerId) canvasPointerId = null;
  };

  svgElement.addEventListener('pointerup', endPointer);
  svgElement.addEventListener('pointercancel', endPointer);

  const initialParams = new URLSearchParams(window.location.search);
  const queryFromUrl = initialParams.get('q') ?? '';
  if (queryFromUrl) {
    query = queryFromUrl;
    if (searchInput) searchInput.value = queryFromUrl;
  }

  const focusFromUrl = initialParams.get('focus');
  if (focusFromUrl && nodesById.has(focusFromUrl)) {
    selectedId = focusFromUrl;
    mode = 'local';
  }

  syncModeControls();
  updateInspector();
  setTransform();
  rebuildGraph();
}

initKnowledgeGraph();
