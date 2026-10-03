import { createUserSchema } from './src/validators/user.js';
import { createMessageSchema } from './src/validators/message.js';

const r1 = createUserSchema.safeParse({name: 'T', email: 'bad', password: '123'});
console.log('User schema:', !r1.success ? 'PASS' : 'FAIL');

const r2 = createMessageSchema.safeParse({});
console.log('Message schema:', !r2.success ? 'PASS' : 'FAIL');
