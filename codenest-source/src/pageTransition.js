export const PAGE_TRANSITION_EVENT = "anthony:page-transition";

export function isPlainNavigationClick(event) {
  return !(
    event?.defaultPrevented ||
    event?.button !== 0 ||
    event?.metaKey ||
    event?.ctrlKey ||
    event?.shiftKey ||
    event?.altKey ||
    event?.currentTarget?.target === "_blank" ||
    event?.currentTarget?.hasAttribute?.("download")
  );
}

export function requestPageTransition(href, historyMode = "push") {
  window.dispatchEvent(
    new CustomEvent(PAGE_TRANSITION_EVENT, {
      detail: { href, historyMode },
    }),
  );
}

export function handleTransitionLink(event) {
  if (!isPlainNavigationClick(event)) return;
  event.preventDefault();
  requestPageTransition(event.currentTarget.href);
}
