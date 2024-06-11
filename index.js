const express = require("express");
const cors = require("cors");
const knex = require("knex");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
require("dotenv").config();
const knexConfig = require("./knexfile");

const db = knex(knexConfig.development);

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use a unique filename
  },
});
const upload = multer({ storage });

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static("uploads"));

// Homepage route
app.get("/", (req, res) => {
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
      <li>POST /signup - User signup</li>
      <li>POST /login - User login</li>
      <li>GET /users - List all users</li>
      <li>POST /search: Search recipes by ingredients</li>
      <li>POST /comments: Add a new comment</li>
      <li>GET /recipes/:id/comments: Get comments for a specific recipe</li>
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

// Get all recipes
app.get("/recipes", async (req, res) => {
  try {
    const recipes = await db("recipes").select("*");
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recipe by ID
app.get("/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await db("recipes").where({ id }).first();
    if (recipe) {
      res.json(recipe);
    } else {
      res.status(404).json({ message: "Recipe not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recipes by category
app.get("/recipes/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const recipes = await db("recipes").where({ category });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new recipe with file upload
app.post("/recipes", upload.single("image_path"), async (req, res) => {
  try {
    const newRecipe = {
      ...req.body,
      image_path: req.file ? `/uploads/${req.file.filename}` : null,
    };
    const [id] = await db("recipes").insert(newRecipe);
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Edit a recipe
app.put("/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRecipe = req.body;
    const count = await db("recipes").where({ id }).update(updatedRecipe);
    if (count) {
      res.json({ message: "Recipe updated" });
    } else {
      res.status(404).json({ message: "Recipe not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a recipe
app.delete("/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const count = await db("recipes").where({ id }).del();
    if (count) {
      res.json({ message: "Recipe deleted" });
    } else {
      res.status(404).json({ message: "Recipe not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User signup endpoint
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required." });
  }

  try {
    // Check if user already exists
    const existingUser = await db("users").where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const [id] = await db("users")
      .insert({ name, email, password: hashedPassword })
      .returning("id");

    res.status(201).json({ message: "User created successfully", userId: id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// User login endpoint
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    // Check if user exists
    const user = await db("users").where({ email }).first();
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Compare the password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const users = await db("users").select("id", "name", "email", "password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search recipes by ingredients
app.post("/search", async (req, res) => {
  const { ingredients } = req.body;

  try {
    const recipes = await db("recipes").where(function () {
      ingredients.forEach((ingredient) => {
        this.orWhere("ingredients", "like", `%${ingredient}%`);
      });
    });

    if (recipes.length) {
      res.json(recipes);
    } else {
      // Fetch from external API if no recipes found in the database
      res
        .status(404)
        .json({ message: "No recipes found with the provided ingredients." });
    }
  } catch (error) {
    console.error("Error searching recipes:", error);
    res.status(500).json({ message: "Error searching recipes" });
  }
});

// Add a new comment
app.post("/comments", async (req, res) => {
  try {
    const newComment = req.body;
    const [id] = await db("comments").insert(newComment);
    res.status(201).json({ id });
  } catch (error) {
    console.error("Error adding comment:", error.message);
    res.status(500).json({ message: "Failed to add comment" });
  }
});

// Get comments for a specific recipe
app.get("/recipes/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await db("comments").where({ recipe_id: id });
    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error.message);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

// Set the server to listen on a specific port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
