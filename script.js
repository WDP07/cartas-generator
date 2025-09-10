function createCard(name, position, level, attack, defense, skill, discipline, training, character, energy) {
  // Si no vienen parámetros, tomar los del formulario
  if (!name) {
    name = document.getElementById("name").value || "Jugador Anónimo";
    position = document.getElementById("position").value;
    level = parseInt(document.getElementById("level").value);
    attack = parseInt(document.getElementById("attack").value);
    defense = parseInt(document.getElementById("defense").value);
    skill = parseInt(document.getElementById("skill").value);
    discipline = parseInt(document.getElementById("discipline").value);
    training = parseInt(document.getElementById("training").value);
    character = parseInt(document.getElementById("character").value);
    energy = parseInt(document.getElementById("energy").value);
  }

  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <h3>${name}</h3>
    <small>Posición: ${position} | Nivel: ${level}</small>
    <div class="stats">
      <div class="stat">⚡ Ataque: ${attack}</div>
      <div class="stat">🛡️ Defensa: ${defense}</div>
      <div class="stat">🎯 Habilidad: ${skill}</div>
      <div class="stat">📏 Disciplina: ${discipline}</div>
      <div class="stat">🏋️ Entrenamiento: ${training}</div>
      <div class="stat">🔥 Carácter: ${character}</div>
      <div class="stat">💧 Energía: ${energy}</div>
    </div>
  `;

  document.getElementById("cardsContainer").appendChild(card);
}

// Generar colección automática
function generateCollection() {
  const collectionName = document.getElementById("collectionName").value || "Colección Sin Nombre";
  const size = parseInt(document.getElementById("collectionSize").value) || 5;

  alert(`Generando colección: ${collectionName} con ${size} cartas.`);

  // Borra cartas anteriores
  document.getElementById("cardsContainer").innerHTML = "";

  // Nivel 1: siempre arranca con los 4 básicos
  createCard("Portero Base", "GK", 1, 40, 60, 30, 50, 40, 50, 50);
  createCard("Defensa Base", "DEF", 1, 50, 70, 35, 55, 45, 50, 50);
  createCard("Mediocampista Base", "MED", 1, 55, 55, 45, 60, 50, 55, 50);
  createCard("Delantero Base", "DC", 1, 70, 40, 50, 45, 55, 60, 50);

  // Si hay más cartas, agregarlas aleatorias
  for (let i = 4; i < size; i++) {
    createCard(
      "Jugador Random " + (i + 1),
      ["GK", "DEF", "MED", "DC"][Math.floor(Math.random() * 4)],
      Math.ceil(Math.random() * 3),
      30 + Math.floor(Math.random() * 70),
      30 + Math.floor(Math.random() * 70),
      30 + Math.floor(Math.random() * 70),
      30 + Math.floor(Math.random() * 70),
      30 + Math.floor(Math.random() * 70),
      30 + Math.floor(Math.random() * 70),
      30 + Math.floor(Math.random() * 70)
    );
  }
}
