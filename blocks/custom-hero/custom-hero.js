export default function decorate(block) {
  const customHeroElements = document.querySelectorAll('.custom-hero');
  const h1 = block.querySelector('h1');
  const h2 = block.querySelector('h2');
  const pTags = block.querySelectorAll('p');
  let nonEmptyPTag = null;

  let i = 0;
  while (!nonEmptyPTag || i >= pTags.length) {
    const p = pTags[i];
    if (p.textContent.trim() !== '') {
      nonEmptyPTag = p;
    }
    i += 1;
  }

  customHeroElements.forEach((element) => {
    // Convert the class list to an array
    const classList = Array.from(element.classList);

    // Get the middle classes (excluding first and last)
    const blockStyleClasses = classList.slice(1, -1);

    // If middle classes exist, add them to heroContent
    if (blockStyleClasses.length > 0) {
      // Join the middle classes into a string and add them as a class to heroContent
      block.classList.add(...blockStyleClasses);
    }
  });

  // Move the h2 after the h1
  if (h2) h1.insertAdjacentHTML('afterend', h2.outerHTML);
}
