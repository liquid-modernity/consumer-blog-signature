export function updateRovingTabIndex(
  items: HTMLElement[],
  activeIndex: number,
): void {
  items.forEach((item, index) => {
    item.tabIndex = index === activeIndex ? 0 : -1;
  });
}
