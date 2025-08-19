function filterExperiences(type) {
    const cards = document.querySelectorAll(".experience-card");
    cards.forEach(card => {
        if (type === "Alle" || card.dataset.type === type) {
            card.style.display = "grid";
        } else {
            card.style.display = "none";
        }
    });

    type.id = 'selected';
}

function setSelected(button) {
    document.querySelectorAll('.filter-buttons button').forEach(btn => {
        if (btn.id === 'selected') {
            btn.removeAttribute('id');
        }
    });
    button.id = 'selected';
}

filterExperiences("Alle");