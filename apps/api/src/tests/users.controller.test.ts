import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { CreateUserDto } from './dtos/create-user.dto';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should create a new user with a generated id', async () => {
    const createUserDto: CreateUserDto = { name: 'John Doe', email: 'john.doe@example.com' };
    const result = await usersController.createUser({ body: createUserDto } as any, {} as any);
    expect(result.id).toBeDefined();
    expect(result.name).toBe(createUserDto.name);
    expect(result.email).toBe(createUserDto.email);
  });

  it('should ignore the client-provided id', async () => {
    const createUserDto: CreateUserDto = { id: 'client-provided-id', name: 'John Doe', email: 'john.doe@example.com' };
    const result = await usersController.createUser({ body: createUserDto } as any, {} as any);
    expect(result.id).not.toBe(createUserDto.id);
  });
});