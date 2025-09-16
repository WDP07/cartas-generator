let cards = [];

// Cargar desde localStorage
window.onload = () => {
  const saved = localStorage.getItem("cards");
  if (saved) {
    cards = JSON.parse(saved);
    renderCards();
  }
};

// Guardar en localStorage
function saveCards() {
  localStorage.setItem("cards", JSON.stringify(cards));
}

// Renderizar
function renderCards() {
  const container = document.getElementById("cardsList");
  container.innerHTML = "";

  cards.forEach((card, index) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${card.name}</h3>
      <p><b>Posición:</b> ${card.position}</p>
      <p><b>Nivel:</b> ${card.level}</p>
      <p><b>Ataque:</b> ${card.attack}</p>
      <p><b>Defensa:</b> ${card.defense}</p>
      <p><b>Habilidad:</b> ${card.skill}</p>
      <p><b>Disciplina:</b> ${card.discipline}</p>
      <p><b>Entrenamiento:</b> ${card.training}</p>
      <p><b>Carácter:</b> ${card.character}</p>
      <p><b>Poder total:</b> ${card.attack + card.defense + card.skill + card.discipline + card.training + card.character}</p>
      <button onclick="editCard(${index})">Editar</button>
      <button onclick="deleteCard(${index})">Eliminar</button>
    `;
    container.appendChild(div);
  });
}

// Agregar carta
document.getElementById("cardForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const card = {
    name: document.getElementById("name").value,
    position: document.getElementById("position").value,
    level: parseInt(document.getElementById("level").value),
    attack: parseInt(document.getElementById("attack").value),
    defense: parseInt(document.getElementById("defense").value),
    skill: parseInt(document.getElementById("skill").value),
    discipline: parseInt(document.getElementById("discipline").value),
    training: parseInt(document.getElementById("training").value),
    character: parseInt(document.getElementById("character").value),
  };

  cards.push(card);
  saveCards();
  renderCards();
  e.target.reset();
});

// Eliminar
function deleteCard(index) {
  cards.splice(index, 1);
  saveCards();
  renderCards();
}

// Editar
function editCard(index) {
  const card = cards[index];

  document.getElementById("name").value = card.name;
  document.getElementById("position").value = card.position;
  document.getElementById("level").value = card.level;
  document.getElementById("attack").value = card.attack;
  document.getElementById("defense").value = card.defense;
  document.getElementById("skill").value = card.skill;
  document.getElementById("discipline").value = card.discipline;
  document.getElementById("training").value = card.training;
  document.getElementById("character").value = card.character;

  deleteCard(index); // elimina para que luego se reemplace
}

// Exportar
function exportCards() {
  const blob = new Blob([JSON.stringify(cards, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "coleccion.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Importar
function importCards(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    cards = JSON.parse(e.target.result);
    saveCards();
    renderCards();
  };
  reader.readAsText(file);
}
