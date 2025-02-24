import { buildIcon } from '../../scripts/scripts.js';

function closeAlert(alert) {
  const container = alert.closest('.alert-banner-container');
  const wrapper = alert.closest('.alert-banner-wrapper');
  wrapper.remove();
  const alertsInContainer = container.querySelectorAll('.alert-banner-wrapper').length;
  if (alertsInContainer < 1) container.classList.remove('alert-banner-container');
}

export default async function decorate(block) {
  // apply color variants to wrapper
  const variants = [...block.classList].filter((c) => c !== 'block' && c !== 'alert-banner');
  if (variants) {
    const wrapper = block.closest('.alert-banner-wrapper');
    wrapper.classList.add(...variants);
  }

  // separate icon wrapper from alert content
  const icon = block.querySelector('p > span.icon');
  if (icon) {
    const wrapper = icon.closest('p');
    if (!wrapper.textContent) wrapper.classList.add('icon-wrapper');
  }

  // separate button wrapper from alert content
  const buttons = block.querySelector('.button-wrapper');
  if (buttons) {
    block.append(buttons);
    [...buttons.children].forEach((button) => button.classList.add('outline'));
  }

  // build close button
  const closeButton = document.createElement('button');
  const close = buildIcon('close');
  closeButton.append(close);
  closeButton.className = 'button close';
  closeButton.setAttribute('type', 'button');
  closeButton.setAttribute('aria-label', 'Close alert');
  closeButton.addEventListener('click', () => closeAlert(block));
  block.append(closeButton);

  // set properties for assistive technology
  block.setAttribute('role', 'alert');
  block.setAttribute('aria-live', 'assertive');
}
