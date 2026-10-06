const github_user = "808kirai";
const github_api = `https://api.github.com/users/${github_user}`;

const projects_box = document.querySelector("#projects");
const activity_box = document.querySelector("#github-activity");

const cache_time = 10 * 60 * 1000;

function get_cache(key) {
    const saved = sessionStorage.getItem(key);

    if (!saved) return null;

    try {
        const data = JSON.parse(saved);

        if (Date.now() - data.time > cache_time) {
            sessionStorage.removeItem(key);
            return null;
        }

        return data.value;
    } catch {
        return null;
    }
}

function save_cache(key, value) {
    sessionStorage.setItem(
        key,
        JSON.stringify({
            time: Date.now(),
            value: value
        })
    );
}

async function github_request(url) {
    const cached = get_cache(url);

    if (cached) {
        return cached;
    }

    const response = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json"
        }
    });

    if (!response.ok) {
        throw new Error(`github request failed: ${response.status}`);
    }

    const data = await response.json();

    save_cache(url, data);

    return data;
}

function format_date(date) {
    return new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric"
    }).format(new Date(date));
}

function project_card(project) {
    const description = project.description || "No description available.";

    return `
        <article class="project-card">
            <div class="project-top">
                <span class="project-type">github</span>
                <a
                    href="${project.html_url}"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="open ${project.name} on github"
                >
                    ↗
                </a>
            </div>

            <h3>${project.name}</h3>

            <p>${description}</p>

            <div class="project-meta">
                ${
                    project.language
                        ? `<span>${project.language}</span>`
                        : ""
                }

                <span>${project.stargazers_count} stars</span>

                <span>${project.forks_count} forks</span>
            </div>
        </article>
    `;
}

async function load_projects() {
    if (!projects_box) return;

    try {
        const projects = await github_request(
            `${github_api}/repos?sort=updated&per_page=6`
        );

        const visible_projects = projects.filter(
            project => !project.fork
        );

        if (!visible_projects.length) {
            projects_box.innerHTML = "<p>no projects found.</p>";
            return;
        }

        projects_box.innerHTML = visible_projects
            .map(project_card)
            .join("");
    } catch (error) {
        console.error("could not load github projects:", error);

        projects_box.innerHTML = `
            <p class="github-error">
                github projects could not be loaded right now.
            </p>
        `;
    }
}

function activity_item(event) {
    const repo_name = event.repo?.name || "unknown repository";

    let action = "updated";

    if (event.type === "PushEvent") {
        const count = event.payload?.commits?.length || 0;
        action = `pushed ${count} commit${count === 1 ? "" : "s"}`;
    }

    if (event.type === "CreateEvent") {
        action = `created ${event.payload?.ref_type || "content"}`;
    }

    if (event.type === "IssuesEvent") {
        action = `${event.payload?.action || "updated"} an issue`;
    }

    if (event.type === "PullRequestEvent") {
        action = `${event.payload?.action || "updated"} a pull request`;
    }

    if (event.type === "WatchEvent") {
        action = "starred a repository";
    }

    if (event.type === "ForkEvent") {
        action = "forked a repository";
    }

    return `
        <a
            class="activity-item"
            href="https://github.com/${repo_name}"
            target="_blank"
            rel="noopener noreferrer"
        >
            <div class="activity-content">
                <span class="activity-action">${action}</span>
                <strong>${repo_name.split("/").pop()}</strong>
            </div>

            <time datetime="${event.created_at}">
                ${format_date(event.created_at)}
            </time>
        </a>
    `;
}

async function load_activity() {
    if (!activity_box) return;

    try {
        const events = await github_request(
            `${github_api}/events/public?per_page=10`
        );

        if (!events.length) {
            activity_box.innerHTML = "<p>no recent activity.</p>";
            return;
        }

        activity_box.innerHTML = events
            .map(activity_item)
            .join("");
    } catch (error) {
        console.error("could not load github activity:", error);

        activity_box.innerHTML = `
            <p class="github-error">
                github activity could not be loaded right now.
            </p>
        `;
    }
}

function setup_navigation() {
    const links = document.querySelectorAll(
        'a[href^="#"]'
    );

    links.forEach(link => {
        link.addEventListener("click", event => {
            const target_id = link.getAttribute("href");

            if (!target_id || target_id === "#") {
                return;
            }

            const target = document.querySelector(target_id);

            if (!target) {
                return;
            }

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });
}

function setup_header() {
    const header = document.querySelector("header");

    if (!header) return;

    let last_scroll = 0;

    window.addEventListener(
        "scroll",
        () => {
            const current_scroll = window.scrollY;

            if (current_scroll > 40) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }

            if (current_scroll > last_scroll && current_scroll > 120) {
                header.classList.add("hidden");
            } else {
                header.classList.remove("hidden");
            }

            last_scroll = current_scroll;
        },
        { passive: true }
    );
}

function setup_reveal() {
    const elements = document.querySelectorAll(
        ".project-card, .activity-item, section"
    );

    if (!elements.length) return;

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.12
        }
    );

    elements.forEach(element => {
        observer.observe(element);
    });
}

function start() {
    setup_navigation();
    setup_header();
    setup_reveal();

    load_projects();
    load_activity();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
} else {
    start();
}