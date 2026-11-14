import {
  detectHardcodedSecrets,
  detectMissingZodErrorHandler,
  detectUnprotectedMutatingRoutes,
  detectUnvalidatedRequestBody
} from "./rules.js";

export const detectors = [
  detectMissingZodErrorHandler,
  detectUnvalidatedRequestBody,
  detectUnprotectedMutatingRoutes,
  detectHardcodedSecrets
];
