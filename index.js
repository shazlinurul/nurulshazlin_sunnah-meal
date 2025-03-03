const fs = require('fs');
const path = require('path');

let filePath = path.join(__dirname, 'Files', 'mealplan.txt');


if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

document.addEventListener('DOMContentLoaded', () => {
    let fetchRecipeBtn = document.getElementById('fetchRecipe');
    let clearMealBtn = document.getElementById('btnClear');
    let searchMealBtn = document.getElementById('btnSearch');

    if (fetchRecipeBtn) fetchRecipeBtn.addEventListener('click', fetchRecipe);
    if (clearMealBtn) clearMealBtn.addEventListener('click', clearMealPlan);
    if (searchMealBtn) searchMealBtn.addEventListener('click', searchMeal);
    
    loadMealPlan();
});

// #fetch
function fetchRecipe() {
    let query = document.getElementById('ingredientInput').value || 'dates';
    let day = document.getElementById('daySelect').value;
    let apiKey = 'c40b4ab6061047488a59e1c5ec5c0daf';
    let apiUrl = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apiKey}&ingredients=${query}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            let imageSection = '';
            data.forEach(recipe => {
                let usedIngredients = recipe.usedIngredients.map(i => i.name).join(", ");
                let missedIngredients = recipe.missedIngredients.map(i => i.name).join(", ");
                let allIngredients = `${usedIngredients}, ${missedIngredients}`;

                imageSection += `
                    <div class="recipe-card">
                        <img src="${recipe.image}" alt="${recipe.title}">
                        <h3>${recipe.title}</h3>
                        <p><strong>Day:</strong> ${day}</p>
                        <p><strong>Ingredients:</strong> ${allIngredients}</p>
                        <button onclick="addToMealPlan('${day}', '${recipe.title}', '${allIngredients}')">Add</button>
                    </div>
                `;
            });
            document.getElementById('recipeImages').innerHTML = imageSection;
        })
        .catch(error => console.error("API Error:", error));
}

// #add
function addToMealPlan(day, meal, ingredients) {
    let newEntry = `${day} | ${meal} | ${ingredients}\n`;
    fs.appendFileSync(filePath, newEntry);
    alert(`"${meal}" added to ${day}!`);
    loadMealPlan();
}

// #load
function loadMealPlan() {
    let tableBody = document.getElementById('mealPlanTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!fs.existsSync(filePath)) return;

    let mealPlan = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
    mealPlan.forEach(line => {
        let [day, meal] = line.split(" | ");
        let row = `<tr>
                    <td>${day}</td>
                    <td>${meal}</td>
                    <td>
                        <button onclick="openEditModal('${day}', '${meal}')">Edit</button>
                        <button onclick="deleteMeal('${meal}')">Delete</button>
                    </td>
                   </tr>`;
        tableBody.innerHTML += row;
    });
}

// #edit
function openEditModal(day, oldMeal) {
    document.getElementById('editMealInput').value = oldMeal;
    document.getElementById('editModal').style.display = 'block';

    document.getElementById('saveEditBtn').onclick = function () {
        let newMeal = document.getElementById('editMealInput').value.trim();
        if (newMeal === '') {
            alert("Meal name cannot be empty!");
            return;
        }
        editMeal(day, oldMeal, newMeal);
        closeEditModal();
    };
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// #edit
function editMeal(day, oldMeal, newMeal) {
    let mealPlan = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
    let updatedPlan = mealPlan.map(line => {
        let parts = line.split(" | ");
        if (parts[0] === day && parts[1] === oldMeal) {
            return `${day} | ${newMeal} | ${parts.slice(2).join(" | ")}`;
        }
        return line;
    });

    fs.writeFileSync(filePath, updatedPlan.join('\n'));
    alert(`"${oldMeal}" updated to "${newMeal}"!`);
    loadMealPlan();
}

// #delete
function deleteMeal(meal) {
    let mealPlan = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
    let updatedPlan = mealPlan.filter(line => !line.includes(meal));

    fs.writeFileSync(filePath, updatedPlan.join('\n'));
    alert(`🗑️ "${meal}" deleted!`);
    loadMealPlan();
}

// #clear
function clearMealPlan() {
    fs.writeFileSync(filePath, '');
    alert("🗑️ Meal plan cleared!");
    loadMealPlan();
}

// #search
function searchMeal() {
    let searchTerm = document.getElementById('searchInput').value.toLowerCase();
    let rows = document.querySelectorAll('#mealPlanTableBody tr');

    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(searchTerm) ? '' : 'none';
    });
}
