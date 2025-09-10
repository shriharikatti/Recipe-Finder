class RecipeFinderApp {
  constructor() {
    // API Configuration -
    this.apiBase = 'https://www.themealdb.com/api/json/v1/1';
    this.apiKey = '1'; // Test key for development

    // DOM Elements -
    this.ingredientInput = document.getElementById('ingredientInput');
    this.searchBtn = document.getElementById('searchBtn');
    this.loadingSpinner = document.getElementById('loadingSpinner');
    this.recipesContainer = document.getElementById('recipesContainer');
    this.modal = document.getElementById('recipeModal');
    this.modalContent = document.getElementById('recipeDetails');
    this.closeModalBtn = document.getElementById('closeModal');

    // Initialize the system
    this.initializeEventListeners();
  }

  // Event Listeners (Sensor Inputs)
  initializeEventListeners() {
    // Search button click
    this.searchBtn.addEventListener('click', () => this.handleSearch());

    // Enter key press in input
    this.ingredientInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch();
      }
    });

    // Modal close functionality
    this.closeModalBtn.addEventListener('click', () => this.closeModal());

    // Close modal when clicking outside
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
  }

  // Search Handler (Main Process Controller)
  async handleSearch() {
    const ingredient = this.ingredientInput.value.trim();

    // Input validation
    if (!ingredient) {
      this.showError('Please enter an ingredient! 🥕');
      return;
    }

    // Show loading state
    this.showLoading(true);

    try {
      // Make API call - like requesting data from sensors
      const recipes = await this.searchRecipesByIngredient(ingredient);

      if (recipes && recipes.length > 0) {
        this.displayRecipes(recipes);
      } else {
        this.showNoResults(ingredient);
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Oops! Something went wrong. Please try again. 🔧');
    } finally {
      this.showLoading(false);
    }
  }

  // API Communication (Data Pipeline)
  async searchRecipesByIngredient(ingredient) {
    const url = `${this.apiBase}/filter.php?i=${encodeURIComponent(
      ingredient
    )}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Data Processing (Results Handler)
  displayRecipes(recipes) {
    this.recipesContainer.innerHTML = '';

    // Limit to first 12 results for better performance
    const displayRecipes = recipes.slice(0, 12);

    displayRecipes.forEach((recipe) => {
      const recipeCard = this.createRecipeCard(recipe);
      this.recipesContainer.appendChild(recipeCard);
    });

    // Scroll to results
    this.recipesContainer.scrollIntoView({ behavior: 'smooth' });
  }

  // UI Component Creation (Display Generator)
  createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.setAttribute('data-recipe-id', recipe.idMeal);

    card.innerHTML = `
            <img src="${recipe.strMealThumb}" alt="${
      recipe.strMeal
    }" class="recipe-image">
            <div class="recipe-info">
                <h3 class="recipe-title">${recipe.strMeal}</h3>
                <span class="recipe-category">${
                  recipe.strCategory || 'Main Dish'
                }</span>
                <p style="margin-top: 10px; color: #666;">Click to view full recipe →</p>
            </div>
        `;

    // Add click handler for recipe details
    card.addEventListener('click', () => this.showRecipeDetails(recipe.idMeal));

    return card;
  }

  // 🔍 Detailed View (Deep Dive Function)
  async showRecipeDetails(recipeId) {
    this.showLoading(true);

    try {
      const recipeDetails = await this.getRecipeDetails(recipeId);

      if (recipeDetails) {
        this.displayRecipeModal(recipeDetails);
      }
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      this.showError('Could not load recipe details. Please try again! 🔧');
    } finally {
      this.showLoading(false);
    }
  }

  // Detailed Recipe API Call
  async getRecipeDetails(recipeId) {
    const url = `${this.apiBase}/lookup.php?i=${recipeId}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.meals ? data.meals[0] : null;
    } catch (error) {
      console.error('Recipe details API Error:', error);
      throw error;
    }
  }

  // Modal Display (Detailed View)
  displayRecipeModal(recipe) {
    // Extract ingredients and measurements
    const ingredients = this.extractIngredients(recipe);

    this.modalContent.innerHTML = `
            <div class="recipe-header">
                <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" 
                     style="width: 100%; max-width: 400px; border-radius: 10px; margin-bottom: 20px;">
                <h2>${recipe.strMeal}</h2>
                <div style="margin: 15px 0;">
                    <span class="recipe-category">${recipe.strCategory}</span>
                    <span class="recipe-category" style="margin-left: 10px;">${
                      recipe.strArea
                    }</span>
                </div>
            </div>
            
            <div class="recipe-content">
                <h3>📝 Ingredients:</h3>
                <ul style="margin: 15px 0; padding-left: 20px;">
                    ${ingredients.map((ing) => `<li>${ing}</li>`).join('')}
                </ul>
                
                <h3>👨‍🍳 Instructions:</h3>
                <div style="margin: 15px 0; line-height: 1.6; white-space: pre-line;">
                    ${recipe.strInstructions}
                </div>
                
                ${
                  recipe.strYoutube
                    ? `
                    <h3>🎥 Video Tutorial:</h3>
                    <a href="${recipe.strYoutube}" target="_blank" style="color: #ff6b6b; text-decoration: none;">
                        Watch on YouTube →
                    </a>
                `
                    : ''
                }
            </div>
        `;

    this.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  extractIngredients(recipe) {
    const ingredients = [];

    // The API returns ingredients as strIngredient1, strIngredient2, etc.
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`];
      const measure = recipe[`strMeasure${i}`];

      if (ingredient && ingredient.trim()) {
        const fullIngredient =
          measure && measure.trim()
            ? `${measure.trim()} ${ingredient.trim()}`
            : ingredient.trim();
        ingredients.push(fullIngredient);
      }
    }

    return ingredients;
  }

  showLoading(show) {
    if (show) {
      this.loadingSpinner.classList.remove('hidden');
      this.recipesContainer.innerHTML = '';
    } else {
      this.loadingSpinner.classList.add('hidden');
    }
  }

  closeModal() {
    this.modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  showError(message) {
    this.recipesContainer.innerHTML = `
            <div style="text-align: center; color: white; background: rgba(255,107,107,0.2); 
                        padding: 30px; border-radius: 15px; margin: 20px 0;">
                <h3>⚠️ ${message}</h3>
            </div>
        `;
  }

  showNoResults(ingredient) {
    this.recipesContainer.innerHTML = `
            <div style="text-align: center; color: white; padding: 40px;">
                <h3>🔍 No recipes found for "${ingredient}"</h3>
                <p style="margin-top: 15px; opacity: 0.8;">
                    Try searching for common ingredients like: chicken, beef, rice, pasta, or salmon
                </p>
            </div>
        `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize our recipe finder app
  const app = new RecipeFinderApp();

  console.log('🍳 Recipe Finder Pro - System Online!');
});
