import { Request, Response } from 'express';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/create-user.dto';

export class UsersController {
  private usersService: UsersService;

  constructor(usersService: UsersService) {
    this.usersService = usersService;
  }

  async createUser(req: Request, res: Response): Promise<void> {
    const createUserDto: CreateUserDto = req.body;
    const user = await this.usersService.createUser(createUserDto);
    res.status(201).json(user);
  }
}