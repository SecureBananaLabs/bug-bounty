<content>
import { env } from './env';

export const config = {
  jwt: {
    secret: env.JWT_SECRET,
  },
};
</content>