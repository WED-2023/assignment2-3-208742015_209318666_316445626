const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const api_key ="fd98ed4a06bf43488f3ad1f1500db8ff";
const DButils = require('./DButils');  


/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {    
    try {
        return await axios.get(`${api_domain}/${recipe_id}/information`, {
            params: {
                includeNutrition: false,
                apiKey: api_key
            }
        });
  } catch (error) {
    console.error(`Error fetching recipe information for ${recipe_id}`, error);
    throw error;
  }
}




async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, popularity, vegan, vegetarian, glutenFree, servings, instructions, extendedIngredients } = recipe_info.data;

  return {
    id,
    title,
    readyInMinutes,
    image,
    popularity,
    vegan,
    vegetarian,
    glutenFree,
    servings: servings || 4,  // Default servings to 4 if not available
    instructions: instructions || "Instructions not available.",
    extendedIngredients: extendedIngredients || [] // Default to an empty array if no ingredients are available
  };
}

async function searchRecipe(recipeName, cuisine, diet, intolerance, number, username) {
    const response = await axios.get(`${api_domain}/complexSearch`, {
        params: {
            query: recipeName,
            cuisine: cuisine,
            diet: diet,
            intolerances: intolerance,
            number: number,
            apiKey: process.env.spooncular_apiKey
        }
    });

    return getRecipesPreview(response.data.results.map((element) => element.id), username);
}

function formatAsList(listOfRecipes) {
    recipes = []
    for (const recipe of listOfRecipes) {
        recipes.push(format(recipe));
    }
    return {
        amount: listOfRecipes.length,
        recipes: recipes
    };
}

function format(recipe) {
    return {
      id: recipe.id,
      title: recipe.title,
      readyInMinutes: recipe.readyInMinutes,
      image: recipe.image,
      popularity: recipe.aggregateLikes,
      vegan: recipe.vegan,
      vegetarian: recipe.vegetarian,
      glutenFree: recipe.glutenFree
    };
  }
  

async function getRandomRecipes(){
    let recipes = await axios.get(`${api_domain}/random`, {
        params: {
            includeNutrition: false,
            apiKey: api_key,
            number: 3
        }
    });
    return formatAsList(recipes.data.recipes)
}

async function getRecipesPreview(recipes_ids) {
    let spoon_ids = [];
    let formats = [];  // Initialize a list to store formatted recipes

    // Loop over each recipe_id and fetch corresponding spoon_id from the database
    for (let recipe_id of recipes_ids) {
        try {

            let result = await DButils.execQuery(`SELECT spoon_id FROM recipes WHERE recipe_id='${recipe_id}'`);
            console.log(result);
            if (result.length > 0 && result[0].spoon_id) {
                spoon_ids.push(result[0].spoon_id);  // Replace recipe_id with spoon_id
            } else {
                console.log(`No spoon_id found for recipe_id: ${recipe_id}`);
            }
        } catch (error) {
            console.error(`Error fetching spoon_id for recipe_id: ${recipe_id}`, error);
        }
    }


    // Join spoon_ids to make a comma-separated list for the API request
    for (let ids of spoon_ids) {
        console.log(" spoon id : "+ids);
    // Fetch recipe details from the Spoonacular API
    try {
        let recipes_info = await axios.get(`${api_domain}/informationBulk`, {
            params: {
                includeNutrition: false,
                apiKey: api_key,
                ids: ids  // Using spoon_ids for API request
            }
        });
        // Format the fetched recipes and add them to the formats list
        let formatted = formatAsList(recipes_info.data);
        formats.push(formatted);  // Append formatted recipes to formats list    } catch (error) {
    }catch (error) {
        console.error("Error fetching recipes from Spoonacular API:", error);
        throw error;
    }
    }
    return formats;

}

async function getSearchedRecipes(query, limit, cuisine, diet, intolerances, sort) {
    let recipes_info = await axios.get(`${api_domain}/complexSearch`, {
        params: {
            includeNutrition: false,
            apiKey: api_key,
            number: limit,
            query: query,
            cuisine: cuisine,
            diet: diet,
            intolerances: intolerances,
            sort: sort
          }
    });
    let ids = recipes_info.data.results.map(element => element.id);
    return getRecipesPreview1(ids);
}


async function getRecipesPreview1(recipes_ids) {
    let spoon_ids = [];
    let formats = [];  // Initialize a list to store formatted recipes


    // Join spoon_ids to make a comma-separated list for the API request
    for (let ids of recipes_ids) {
        console.log(" spoon id : "+ids);
    // Fetch recipe details from the Spoonacular API
    try {
        let recipes_info = await axios.get(`${api_domain}/informationBulk`, {
            params: {
                includeNutrition: false,
                apiKey: api_key,
                ids: ids  // Using spoon_ids for API request
            }
        });
        // Format the fetched recipes and add them to the formats list
        let formatted = formatAsList(recipes_info.data);
        formats.push(formatted);  // Append formatted recipes to formats list    } catch (error) {
    }catch (error) {
        console.error("Error fetching recipes from Spoonacular API:", error);
        throw error;
    }
    }
    return formats;

}

async function gadd_recipe(recipe_id){
    return await apid.fetchRecipeDetailsByID(recipe_id);
  }
exports.getRecipeDetails = getRecipeDetails;
exports.searchRecipe =searchRecipe;
exports.getRandomRecipes = getRandomRecipes;
exports.getSearchedRecipes = getSearchedRecipes;
exports.getRecipesPreview = getRecipesPreview;
exports.getRecipeInformation = getRecipeInformation;
exports.gadd_recipe = gadd_recipe;

