export default async function decorate(block) {
  // style headings
  block.querySelectorAll('h2, h3, h4, h5, h6').forEach((h) => {
    h.className = 'detail';
  });

  // identify and decorate illustration
  const illustration = block.querySelector('div > div > p > span.icon, div > div > picture');
  if (illustration) {
    const wrapper = illustration.closest('div');
    wrapper.className = 'illustration-wrapper';
    wrapper.classList.add(illustration.tagName === 'PICTURE' ? 'illustrated-img' : 'illustrated-icon');
  }
}
