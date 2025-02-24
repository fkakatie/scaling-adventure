export default async function decorate(block) {
  // separate icon wrapper from alert content
  const icon = block.querySelector('p > span.icon');
  if (icon) {
    const wrapper = icon.closest('p');
    if (!wrapper.textContent) wrapper.classList.add('icon-wrapper');
  }

  // decorate titles
  const strong = block.querySelector('strong');
  if (strong && strong.parentElement) {
    const wrapper = strong.parentElement;
    if (wrapper.textContent.trim() === strong.textContent.trim()) {
      wrapper.className = 'alert-title detail';
      if (icon) wrapper.classList.add('alert-with-icon');
    }
  }

  // set properties for assistive technology
  block.setAttribute('role', 'alert');
  block.setAttribute('aria-live', 'polite');
}
