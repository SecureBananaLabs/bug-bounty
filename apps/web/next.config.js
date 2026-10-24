const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../..")
  }
};

module.exports = nextConfig;
