exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex("users")
    .del()
    .then(function () {
      // Inserts seed entries
      return knex("users").insert([
        {
          id: 1,
          name: "Alice",
          email: "abc123@gmail.com",
          password: "$2b$10$0ccVOoLpCb9ZElVPCoqW0eppaz6csBrL1DuANVzgXO.0NQCSgteti",
        },
        {
          id: 2,
          name: "Bob",
          email: "bob123@gmail.com",
          password: "$2a$12$CUguWz/q4Cy1I3ehUdpvm.ZfFstZR1js2WIRXNGbfI1xMJ.nKGqAW",
        },
      ]);
    });
};
