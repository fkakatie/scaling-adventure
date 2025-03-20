import { buildCarousel } from '../../scripts/utils.js';

export default function decorate(block) {
  const slides = [...block.children];
  block.innerHTML = '';

  // build wrapper
  const frameWrapper = document.createElement('ul');
  frameWrapper.className = 'frame-wrapper';
  block.append(frameWrapper);

  // extract frames
  const frames = slides.map((s) => s.children);
  frames.forEach((f) => {
    const frame = document.createElement('li');
    frame.append(...f);
    frameWrapper.append(frame);
  });

  const carousel = buildCarousel(block, true, true);
  // TODO: gallery-specific stuff

  if (carousel) block.replaceWith(carousel);
  else block.parentElement.remove();
}
