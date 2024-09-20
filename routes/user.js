var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");
const api_domain = "https://api.spoonacular.com/recipes";
const api_key ="fd98ed4a06bf43488f3ad1f1500db8ff"
const apid = require("./APIdata");
const axios = require("axios");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    if(req.session.user_id){
      DButils.execQuery("SELECT user_id FROM users").then((users) => {
        if (users.find((x) => x.user_id === req.session.user_id)) {
          req.user_id = req.session.user_id;
          next();
        }
      }).catch(err => next(err));
    }else{
      console.log("username not found!")
      res.sendStatus(401);
    }
    
  } else {

    console.log("session not found!")
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

//This path returns the last seen recipes that were saved by the logged-in user
router.post('/lastSeen', async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send("Unauthorized : post id ");
  }
  console.log(req.body.recipeId)
  console.log(req.session.user_id)
  try {
    let user_id = req.session.user_id;
    let recipe_id = req.body.recipeId;
    
    const recipeDetails = await fetchRecipeDetailsByID(recipe_id);
    const newRecipeId = await insertRecipesIntoDB(recipeDetails,recipe_id);
    console.log("newRecipeId :"+newRecipeId);
    await user_utils.markAsSeen(user_id, newRecipeId);
    res.status(200).send("The Recipe successfully saved as seen");
  } catch (error) {
    next(error);
  }
})

/**
 * Get the last seen recipes for the logged-in user.
 * Limits the result to the number specified in the query parameters.
 */
router.get('/lastSeen', async (req, res, next) => {
  try {
    if (req.session && req.session.user_id) {
      if (!req.session.user_id) {
        return res.status(401).send("Unauthorized : get id");
      }
    const  user_id  = req.session.user_id;

    const  limit  = req.query.limit || 3;

    const seenRecipes = await user_utils.getseenRecipes(user_id, limit);
    const recipeIds = [];
    for (let i = 0; i < seenRecipes.length; i++) {
      recipeIds.push(seenRecipes[i].recipe_id);
    }
    
    const recipePreviews = await recipe_utils.getRecipesPreview(recipeIds);
    res.status(200).send(recipePreviews);
  } else {
      return res.status(401).send("Unauthorized session not found ! ");
  }
  
    
  } catch (error) {
    next(error);
  }
});

/**
 * Add a new recipe for the logged-in user.
 */
router.post('/addRecipe', async (req, res, next) => {
  try {
    const ingredients  = req.body.ingredients;
    const instructions = req.body.instructions;
    const recipe_name = req.body.name;
    const proccess_time = req.body.proccess_time;
    const vegan_veg = req.body.vegan_veg ? 1 : 0;
    const gluten = req.body.gluten ? 1 : 0;    
    const image = req.body.image;
    const numOfPortions = req.body.numOfPortions;


  
    await user_utils.addRecipe(ingredients, instructions, recipe_name, proccess_time, vegan_veg, gluten, image, numOfPortions);
    res.status(200).send("The recipe was successfully added.");
  } catch (error) {
    next(error);
  }
});

/**
 * Get all the recipes created by the logged-in user.
 */
router.get('/myRecipes', async (req, res, next) => {
  try {
    const { user_id } = req.session.user_id;

    const userRecipes = await user_utils.getRecipe(user_id);
    res.status(200).send(userRecipes);
  } catch (error) {
    next(error);
  }
});


router.get("/alive1", (req, res) => res.send("im here"));
router.post("/", (req, res) => res.send("im here"));


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


async function insertRecipesIntoDB(recipe, recipe_id) {
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
          recipe_id
        ]
      );
      // Get the ID of the last inserted recipe
      const result =  await DButils.execQuery("SELECT MAX(recipe_id) AS max_recipe_id FROM recipes");
      const newRecipeId = result[0].max_recipe_id;

      console.log("Recipe inserted successfully:", recipe.title);
 
      return newRecipeId;
    } catch (error) {
      console.error("Error inserting recipe into DB:", error);
      throw error;
    }
  
}


module.exports = router;
