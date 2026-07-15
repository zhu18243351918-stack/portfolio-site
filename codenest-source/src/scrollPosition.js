const HOME_SCROLL_POSITION_KEY = "codenest-home-scroll-position";

export function rememberHomeScrollPosition(event) {
  if (
    event?.defaultPrevented ||
    event?.button !== 0 ||
    event?.metaKey ||
    event?.ctrlKey ||
    event?.shiftKey ||
    event?.altKey
  ) {
    return;
  }

  try {
    window.sessionStorage.setItem(HOME_SCROLL_POSITION_KEY, String(window.scrollY));
  } catch {
    // Returning to the page still works when session storage is unavailable.
  }
}

export function consumeHomeScrollPosition() {
  try {
    const storedValue = window.sessionStorage.getItem(HOME_SCROLL_POSITION_KEY);
    window.sessionStorage.removeItem(HOME_SCROLL_POSITION_KEY);
    if (storedValue === null) return null;

    const position = Number(storedValue);
    return Number.isFinite(position) && position >= 0 ? position : null;
  } catch {
    return null;
  }
}
