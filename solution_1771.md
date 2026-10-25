```js
uploadRoutes.post("/", (req, res, next) => {
  req.authenticate("someSecretToken", (err, user) => {
    if (err) {
      return res.status(401).send({ message: "Authentication failed" });
    }
    next();
  })(req, res, next);
  upload.single("file")(req, res, next);
});
```