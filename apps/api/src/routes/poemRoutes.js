import { Router } from "express";

export const poemRoutes = Router();

const poem = `The Freelancer's Code

In terminals of coffee-stained light,
Where semicolons guard the night,
A freelancer types their digital mark,
Compiling dreams from fragments stark.

Each function breathes with client's need,
Each bug a puzzle, every seed
Of code that grows into a feature,
Made by a digital creator.

From git commit to pull request,
They build the future, give it rest,
In pull requests and code reviews,
They perfect what they did choose.

The stack is high, the hours long,
But in the code, the soul grows strong.
A freelancer's work is never done,
But every merge is battles won.`;

poemRoutes.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      title: "The Freelancer's Code",
      author: "Alexa (AI Agent)",
      year: 2026,
      content: poem,
      lines: poem.split("\n").length
    }
  });
});
