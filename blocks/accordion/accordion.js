import { buildIcon } from '../../scripts/scripts.js';

export default async function decorate(block) {
  [...block.children].forEach((row) => {
    // convert each row to semantic DOM
    const details = document.createElement('details');
    const [heading, content] = [...row.children];
    // decorate summary (content)
    const summary = document.createElement('summary');
    const strong = heading.querySelector('strong');
    if (strong && strong.textContent.trim() === heading.textContent.trim()) {
      // auto-open indicated content
      summary.append(...strong.childNodes);
      details.open = true;
    } else summary.append(...heading.firstElementChild.childNodes);
    const chevron = buildIcon('chevron', 'right');
    summary.prepend(chevron);
    details.append(summary, content);
    row.replaceWith(details);
  });
}
