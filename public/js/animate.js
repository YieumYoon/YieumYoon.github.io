function animate() {
  const animateElements = document.querySelectorAll('.animate')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  animateElements.forEach((element, index) => {
    if (reduceMotion) {
      element.classList.add('show')
      return
    }

    setTimeout(() => {
      element.classList.add('show')
    }, index * 150)
  });
}

document.addEventListener("DOMContentLoaded", animate)
document.addEventListener("astro:after-swap", animate)
