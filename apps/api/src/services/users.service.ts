import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from '../dtos/create-user.dto';

export class UsersService {
  async createUser(createUserDto: CreateUserDto): Promise<any> {
    const id = uuidv4(); // Generate a unique id
    const user = { id, ...createUserDto }; // Assign generated id after spreading payload fields
    // Save user to database
    return user;
  }
}