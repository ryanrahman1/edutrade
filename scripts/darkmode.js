if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}

function toggleTheme() {
  document.documentElement.classList.toggle('dark');
}