`createJobSchema` function with added validation for inverted budget ranges

```js
function createJobSchema(payload) {
  // Existing validation logic would go here
  
  // Add validation for budget range ordering
  if (payload.budgetMin && payload.budgetMax && payload.budgetMax < payload.budgetMin) {
    throw new Error('Budget max must be greater than or equal to budget min');
  }
  
  // Return the validated schema
  return {
    // Schema definition
  };
}
```