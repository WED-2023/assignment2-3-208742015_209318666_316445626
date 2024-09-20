var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));

/**
 * This path is for searching a recipe
 */
// router.get("/search", async (req, res, next) => {
//   try {
//     const recipeName = req.query.recipeName;
//     const cuisine = req.query.cuisine;
//     const diet = req.query.diet;
//     const intolerance = req.query.intolerance;
//     const number = req.query.number || 5;
//     const results = await recipes_utils.searchRecipe(recipeName, cuisine, diet, intolerance, number);
//     res.send(results);
//   } catch (error) {
//     next(error);
//   }
// });
router.get("/search", async (req, res, next) => {
  try {
    const recipes = await recipes_utils.getSearchedRecipes(  
      req.query.key, 
      req.query.limit, 
      req.query.cuisine, 
      req.query.diet, 
      req.query.intolerances, 
      req.query.sort
    );
    
    res.send(recipes);
  } catch (error) {
    next(error);
  }
});




// Returns 3 random recipes from the database
router.get("/random", async (req, res, next) => {
  console.log("Random recipe route hit");

  try {
    const recipes = await recipes_utils.getRandomRecipes();
    res.send(recipes);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  // console(req.params.recipeId);
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
