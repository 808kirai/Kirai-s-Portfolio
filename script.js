const body = document.body;

const fadeItems = document.querySelectorAll(".fade");

const menuButton = document.querySelector(".menu-button");
const mobileNav = document.querySelector(".mobile-nav");

const themeToggle = document.querySelector(".theme-toggle");
const themeIcon = document.querySelector(".theme-icon");

const magneticItems = document.querySelectorAll(".magnetic");

const githubRepos = document.querySelector("#github-repos");

const year = document.querySelector("#year");


/* Footer year */

year.textContent = new Date().getFullYear();


/* Fade animations */

const observer = new IntersectionObserver(
  (entries) => {

    entries.forEach((entry, index) => {

      if (entry.isIntersecting) {

        setTimeout(() => {
          entry.target.classList.add("show");
        }, index * 60);

        observer.unobserve(entry.target);
      }

    });

  },
  {
    threshold: 0.1
  }
);

fadeItems.forEach((item) => {
  observer.observe(item);
});


/* Mobile menu */

menuButton.addEventListener("click", () => {
  mobileNav.classList.toggle("open");
});

mobileNav.querySelectorAll("a").forEach((link) => {

  link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
  });

});


/* Light / dark mode */

const savedTheme = localStorage.getItem("kirai-theme");

if (savedTheme === "light") {

  body.classList.add("light");

  themeIcon.textContent = "☾";
}

themeToggle.addEventListener("click", () => {

  body.classList.toggle("light");

  const isLight =
    body.classList.contains("light");

  localStorage.setItem(
    "kirai-theme",
    isLight ? "light" : "dark"
  );

  themeIcon.textContent =
    isLight ? "☾" : "☼";
});

/* Magnetic elements */

magneticItems.forEach((item) => {

  item.addEventListener("mousemove", (event) => {

    if (window.innerWidth <= 600) {
      return;
    }

    const rect =
      item.getBoundingClientRect();

    const x =
      event.clientX -
      rect.left -
      rect.width / 2;

    const y =
      event.clientY -
      rect.top -
      rect.height / 2;

    item.style.transform =
      `translate(${x * 0.18}px, ${y * 0.18}px)`;

  });


  item.addEventListener("mouseleave", () => {

    item.style.transform = "";

  });

});


/* GitHub repositories */

async function loadGitHubRepos() {

  try {

    const response = await fetch(
      "https://api.github.com/users/808kirai/repos?sort=updated&per_page=6"
    );

    if (!response.ok) {
      throw new Error("GitHub request failed");
    }

    const repos =
      await response.json();


    if (!repos.length) {

      githubRepos.innerHTML = `
        <p class="repo-loading">
          No public repositories found yet.
        </p>
      `;

      return;
    }


    githubRepos.innerHTML =
      repos
        .slice(0, 3)
        .map(
          (repo) => `
            <a
              class="repo-card"
              href="${repo.html_url}"
              target="_blank"
              rel="noreferrer"
            >

              <h3>
                ${repo.name}
              </h3>

              <p>
                ${
                  repo.description ||
                  "No description added yet."
                }
              </p>

              <div class="repo-meta">

                <span>
                  ${repo.language || "Code"}
                </span>

                <span>
                  ↗ GitHub
                </span>

              </div>

            </a>
          `
        )
        .join("");


  } catch (error) {

    githubRepos.innerHTML = `
      <a
        class="repo-card"
        href="https://github.com/808kirai"
        target="_blank"
        rel="noreferrer"
      >

        <h3>
          808kirai
        </h3>

        <p>
          View my latest projects, repositories and experiments
          directly on GitHub.
        </p>

        <div class="repo-meta">

          <span>
            GitHub
          </span>

          <span>
            ↗ Open profile
          </span>

        </div>

      </a>
    `;

  }
}

loadGitHubRepos();