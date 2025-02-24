import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  // convert cards to list and list items
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-card';
    li.append(...row.children);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  // decorate card content
  ul.querySelectorAll('img').forEach((img) => img.closest('picture').replaceWith(
    createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
  ));
  ul.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    h.className = 'detail';
  });
  ul.querySelectorAll(':scope > li a[href]').forEach((a) => {
    const li = a.closest('li');
    li.addEventListener('click', () => a.click());
  });
  block.textContent = '';
  block.append(ul);
}
