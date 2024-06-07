const express = require('express');
const cors = require('cors');
const knex = require('knex');
const knexConfig = require('./knexfile');

const db = knex(knexConfig.development);

const app = express();
app.use(cors());
app.use(express.json());

// Homepage route
app.get('/', (req, res) => {
  res.send(`
    <h1>Recipes API</h1>
    <p>Welcome to the Recipes API. Below are the available endpoints:</p>
    <ul>
      <li>GET /recipes - List all recipes</li>
      <li>GET /recipes/:id - Get a specific recipe by ID</li>
      <li>GET /recipes/category/:category - Get recipes by category</li>
      <li>POST /recipes - Add a new recipe</li>
      <li>PUT /recipes/:id - Update a recipe by ID</li>
      <li>DELETE /recipes/:id - Delete a recipe by ID</li>
    </ul>
    <h2>Sample Response JSON</h2>
    <pre>
      {
        "title": "Vanilla Bean Ice Cream",
        "description": "The easiest homemade ice cream recipe ever.",
        "serves": "4-6",
        "prep_time": "4 hours-Overnight",
        "cook_time": "N/A",
        "ingredients": [
          "1 (14 oz) can sweetened condensed milk",
          "1 tablespoon (15g) vanilla bean paste",
          "2 cups (475g) heavy cream cold"
        ],
        "method": [
          "In a chilled metal bowl whisk together the sweetened condensed milk and the vanilla bean paste. Set aside in the freezer.",
          "In a chilled bowl of a stand mixer whip the heavy cream until stiff peaks form 7-8 minutes.",
          "Once soft peaks form get the sweetened condensed milk mixture from the freezer and gently fold ¾ of the whipped cream into the sweetened condensed milk and vanilla bean mixture. You want to let your rubber spatula hit the bottom of the bowl and then raise it up as you fold and spin the bowl keeping the whipped cream airy and light. Add a pinch of salt and mix to combine. Finally fold in the remaining whipped cream.",
          "When the mixture is fully combined place into a 9x5 loaf pan and gently press some plastic wrap directly on top of the whipped mixture. Place into the freezer until fully frozen at least 4 hours preferably overnight. Serve and enjoy."
        ],
        "category": "Dessert",
        "rating": 4.5,
        "image_path": "/images/vanilla_bean_ice_cream.jpg"
      }
    </pre>
  `);
});

// Routes

// Get all recipes
app.get('/recipes', async (req, res) => {
  try {
    const recipes = await db('recipes').select('*');
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recipe by ID
app.get('/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await db('recipes').where({ id }).first();
    if (recipe) {
      res.json(recipe);
    } else {
      res.status(404).json({ message: 'Recipe not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recipes by category
app.get('/recipes/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const recipes = await db('recipes').where({ category });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new recipe
app.post('/recipes', async (req, res) => {
  try {
    const newRecipe = req.body;
    const [id] = await db('recipes').insert(newRecipe);
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Edit a recipe
app.put('/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRecipe = req.body;
    const count = await db('recipes').where({ id }).update(updatedRecipe);
    if (count) {
      res.json({ message: 'Recipe updated' });
    } else {
      res.status(404).json({ message: 'Recipe not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a recipe
app.delete('/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const count = await db('recipes').where({ id }).del();
    if (count) {
      res.json({ message: 'Recipe deleted' });
    } else {
      res.status(404).json({ message: 'Recipe not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
