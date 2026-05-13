// Lucide icon wrapper — Lucide UMD entries look like:
//   ["svg", svgAttrs, [["path", {d: "..."}], ["circle", {...}], ...]]
// We extract the children array and render them as SVG sub-nodes,
// applying our own root <svg> with consistent size/stroke.

const _lucide = window.lucide || {};
const _iconCache = {};

function _toPascal(name) {
  if (_lucide.icons && _lucide.icons[name]) return name;
  return name.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
}

function _resolveEntry(name) {
  if (_iconCache[name] !== undefined) return _iconCache[name];
  const reg = _lucide.icons || {};
  const key = _toPascal(name);
  const e = reg[key] || reg[name] || null;
  _iconCache[name] = e;
  return e;
}

function _children(entry) {
  // ["svg", attrs, children[]]
  if (Array.isArray(entry) && entry.length >= 3 && Array.isArray(entry[2])) {
    return entry[2];
  }
  // already an array of children
  if (Array.isArray(entry) && entry.every(n => Array.isArray(n))) {
    return entry;
  }
  return [];
}

function _renderNode(node, idx) {
  if (!Array.isArray(node)) return null;
  const tag = node[0];
  const attrs = node[1] || {};
  const kids = node[2];
  // Convert SVG kebab attributes to React-style where needed
  const props = { key: idx };
  for (const k in attrs) {
    if (k === "stroke-width" || k === "stroke-linecap" || k === "stroke-linejoin" || k === "stroke-dasharray" || k === "fill-rule" || k === "clip-rule") {
      props[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = attrs[k];
    } else {
      props[k] = attrs[k];
    }
  }
  const renderedKids = Array.isArray(kids) ? kids.map(_renderNode) : null;
  return React.createElement(tag, props, renderedKids);
}

function Icon({ name, size = 16, strokeWidth = 1.75, className = "", style = {} }) {
  const entry = _resolveEntry(name);
  if (!entry) {
    return <span className={"inline-block " + className} style={{ width: size, height: size, ...style }} />;
  }
  const kids = _children(entry);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {kids.map(_renderNode)}
    </svg>
  );
}

window.Icon = Icon;
