const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id){
    await DButils.execQuery(`insert into FavoriteRecipes values ('${user_id}',${recipe_id})`);
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from FavoriteRecipes where user_id='${user_id}'`);
    return recipes_id;
}

async function markAsSeen(user_id, recipe_id) {
    await DButils.execQuery(`insert into seen(user_id, recipe_id) values ('${user_id}',${recipe_id})`);
}

async function getseenRecipes(user_id, limit) { //the limit will be 3 almost all the times
    const recipes_id = await DButils.execQuery(`select recipe_id from seen where user_id='${user_id}' order by seen_at desc limit ${limit}`);
    console.log(" seen recipes_id : "+ recipes_id);  
    return recipes_id;
}

async function addRecipe(ingredients, instructions, recipe_name, proccess_time, vegan_veg, gluten, image, numOfPortions) {
    await DButils.execQuery(`insert into recipes (ingredients, instructions, recipe_name, proccess_time, vegan_veg, gluten, image, numOfPortions) values 
        ('${ingredients}','${instructions}','${recipe_name}','${proccess_time}','${vegan_veg}','${gluten}','${image}','${numOfPortions}')`);
}

async function getRecipe(user_id) {
    const recipes = await DButils.execQuery(`select recipe_name,proccess_time,vegan_veg,gluten,image,ingredients,instructions,numOfPortions from recipes where user_id='${user_id}'`);
    return recipes;
}


exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.markAsSeen = markAsSeen;
exports.getseenRecipes = getseenRecipes;
exports.addRecipe = addRecipe;
exports.getRecipe = getRecipe;
