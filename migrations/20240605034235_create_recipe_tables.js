exports.up = function (knex) {
  return knex.schema.createTable("recipes", function (table) {
    table.increments("id").primary();
    table.string("title", 255).notNullable();
    table.text("description");
    table.string("serves", 50);
    table.string("prep_time", 50);
    table.string("cook_time", 50);
    table.text("ingredients");
    table.text("method");
    table.string("category", 50);
    table.float("rating");
    table.string("image_path", 255);
    table.timestamps(true, true); // Adds created_at and updated_at columns
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("recipes");
};
