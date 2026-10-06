// Project Data Map
const projectData = {
    celestial: {
        title: "Celestial Image Identifier",
        description: "Deep learning astronomical analysis engine designed to detect celestial patterns, classify sky sector imagery, and log satellite features with high throughput.",
        tech: ["Python", "OpenCV", "PyTorch", "NumPy"],
        github: "https://github.com/runie1211/Celestial-Image-Identifier"
    },
    facetracking: {
        title: "Face Tracking Filter",
        description: "Low-latency OpenCV application utilizing landmark detection to apply interactive dynamic masks on live video streams with minimal hardware overhead.",
        tech: ["OpenCV", "Python", "NumPy"],
        github: "https://github.com/runie1211/Face-Tracking-Filter"
    },
    nairobi: {
        title: "Nairobi Parking System",
        description: "Comprehensive backend and web interface managing municipal parking availability, real-time spot allocation, user reservations, and automated payment logging.",
        tech: ["Flask", "PostgreSQL", "JavaScript", "HTML/CSS"],
        github: "https://github.com/runie1211/Nairobi-Parking-System"
    }
};

// Modal Functions
function openModal(projectId) {
    const data = projectData[projectId];
    if (!data) return;

    document.getElementById("modal-title").innerText = data.title;
    document.getElementById("modal-description").innerText = data.description;
    
    const techContainer = document.getElementById("modal-tech");
    techContainer.innerHTML = data.tech.map(t => `<span>${t}</span>`).join("");
    
    document.getElementById("modal-github").href = data.github;
    
    const modal = document.getElementById("project-modal");
    modal.style.display = "flex";
}

function closeModal(event, force = false) {
    if (force || event.target.id === "project-modal") {
        document.getElementById("project-modal").style.display = "none";
    }
}