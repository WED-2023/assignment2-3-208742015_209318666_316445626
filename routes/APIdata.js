var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils"); // Assuming you have DButils to run queries.
const api_domain = "https://api.spoonacular.com/recipes";
const api_key = "fd98ed4a06bf43488f3ad1f1500db8ff";
const axios = require("axios");


async function fetchRecipes() {
  try {
    console.log("Fetching recipes from Spoonacular...");
    const response = await axios.get(`${api_domain}/complexSearch`, {
      params: {
        number: 10, // Number of recipes to fetch
        apiKey: api_key
      }
    });
    console.log("Fetched recipes successfully:", response.data.results);
    return response.data.results.map(recipe => recipe.id); // Extract IDs
  } catch (error) {
    console.error("Error fetching recipes from Spoonacular:", error);
    throw error;
  }
}

// Fetches detailed recipe information using recipe ID
async function fetchRecipeDetailsByID(recipe_id) {
  try {
    const response = await axios.get(`${api_domain}/${recipe_id}/information`, {
      params: {
        apiKey: api_key
      }
    });
    return response.data;  // Returns recipe details
  } catch (error) {
    console.error(`Error fetching recipe details for ID: ${recipe_id}`, error);
    throw error;
  }
}


async function insertRecipesIntoDB(recipe,id) {
  const sanitizeHtml = require('sanitize-html');

    const sanitizedInstructions = sanitizeHtml(recipe.instructions || "No instructions", {
      allowedTags: [], // Remove all HTML tags
      allowedAttributes: {}
    });

    const query = `
    INSERT INTO recipes 
    (ingredients, instructions, recipe_name, proccess_time, vegan_veg, gluten, image, numOfPortions, spoon_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
    try {
      console.log("Inserting recipe into DB:", recipe.title);
      await DButils.execQuery(query,
        [
          recipe.extendedIngredients ? recipe.extendedIngredients.map(ing => ing.name).join(", ") : "N/A",
          sanitizedInstructions,
          recipe.title || "No name",
          recipe.readyInMinutes || 0,
          recipe.vegan ? 1 : 0,
          recipe.glutenFree ? 1 : 0,
          recipe.image || "No image",
          recipe.servings || 1,
          id
        ]
      );
      console.log("Recipe inserted successfully:", recipe.title);
    } catch (error) {
      console.error("Error inserting recipe into DB:", error);
      throw error;
    }
  
}



async function fetchAndInsertRecipes() {
  try {
    console.log("Fetching and inserting recipes...");
    const recipeIDs = await fetchRecipes();

    for (let id of recipeIDs) {
      const recipeDetails = await fetchRecipeDetailsByID(id);
      await insertRecipesIntoDB(recipeDetails,id);  // Insert recipe details into DB
    }

    console.log("All recipes inserted successfully!");
  } catch (error) {
    console.error("Error in fetchAndInsertRecipes:", error);
  }
}

// Run the function to fetch and insert
router.post('/APIdata', async (req, res, next) => {
  try {
    await fetchAndInsertRecipes();
    res.status(200).send("Recipes fetched and inserted successfully");
  } catch (error) {
    next(error);
  }
});

exports.fetchRecipeDetailsByID = fetchRecipeDetailsByID;
module.exports = router;
