exports.up = function (knex) {
  return knex.schema.createTable("comments", (table) => {
    table.increments("id").primary();
    table.integer("recipe_id").unsigned().notNullable();
    table.foreign("recipe_id").references("recipes.id");
    table.string("name").notNullable();
    table.text("comment").notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("comments");
};
