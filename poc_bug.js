const { z } = require("zod");
const { createJobSchema } = require("./apps/api/src/validators/job.js");

const testPayloads = [
  {
    name: "Valid Range",
    data: {
      title: "Valid Job",
      description: "This is a valid description",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat1",
      skills: ["js"]
    },
    expected: "valid"
  },
  {
    name: "Inverted Range (The Bug)",
    data: {
      title: "Inverted Job",
      description: "This is an inverted budget range",
      budgetMin: 500,
      budgetMax: 100,
      categoryId: "cat1",
      skills: ["js"]
    },
    expected: "invalid"
  }
];

testPayloads.forEach(test => {
  console.log(`Testing ${test.name}...`);
  try {
    createJobSchema.parse(test.data);
    console.log(test.expected === "valid" ? "✅ Passed" : "❌ Failed: Should have been invalid");
  } catch (e) {
    console.log(test.expected === "invalid" ? "✅ Passed" : `❌ Failed: ${e.message}`);
  }
});
