  document.addEventListener("DOMContentLoaded", () => {
    const path = location.pathname.split("/").pop();
    document.querySelectorAll("nav a").forEach(link => {
      if (link.getAttribute("href") === path) {
        link.classList.add("active");
      }
    });
  });