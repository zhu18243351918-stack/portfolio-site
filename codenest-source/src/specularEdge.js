export function steerSpecularEdge(event) {
  const node = event.currentTarget;
  const rect = node.getBoundingClientRect();
  const x = event.clientX - (rect.left + rect.width / 2);
  const y = event.clientY - (rect.top + rect.height / 2);
  const angle = (Math.atan2(y, x) * 180) / Math.PI + 90;

  node.style.setProperty("--specular-angle", `${angle}deg`);
  node.style.setProperty("--specular-proximity", "1");
}

export function resetSpecularEdge(event) {
  event.currentTarget.style.removeProperty("--specular-angle");
  event.currentTarget.style.removeProperty("--specular-proximity");
}
