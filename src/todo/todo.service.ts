import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateTodoInput } from './dto/create-todo.input';
import { UpdateTodoInput } from './dto/update-todo.input';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TodoService {
  constructor(private prismaService: PrismaService) {}
  async create(createTodoInput: CreateTodoInput, userId: number) {
    const createdTodo = await this.prismaService.todo.create({
      data: {
        title: createTodoInput.title,
        userId,
      },
    });
    if (!createdTodo) throw new BadRequestException();
    if (
      createTodoInput.meetingNames &&
      createTodoInput.meetingNames.length >= 1
    ) {
      const newMeetingsArray = [];
      createTodoInput.meetingNames.map((value) => {
        newMeetingsArray.push({
          name: value,
          todoId: createdTodo.id,
        });
      });
      const newTodoWithMeetings = await this.prismaService.meeting.createMany({
        data: newMeetingsArray,
      });
      if (!newTodoWithMeetings) throw new BadRequestException();
    }
    return await this.prismaService.todo.findUnique({
      where: {
        id: createdTodo.id,
      },
      include: {
        meetings: true,
      },
    });
  }

  async findAll() {
    const todos = await this.prismaService.todo.findMany({
      include: {
        User: true,
        meetings: true,
      },
    });
    if (!todos || todos.length == 0) throw new BadRequestException();
    return todos;
  }

  async findOne(id: number) {
    const user = await this.prismaService.todo.findUnique({
      where: {
        id,
      },
      include: {
        User: true,
      },
    });
    if (!user) throw new BadRequestException();
    return user;
  }

  async update(updateTodoInput: UpdateTodoInput, userId: number) {
    const todo = await this.prismaService.todo.findUnique({
      where: {
        id: updateTodoInput.id,
      },
    });
    if (!todo) throw new BadRequestException();
    if (todo.userId !== userId) throw new ForbiddenException();
    return await this.prismaService.todo.update({
      where: {
        id: updateTodoInput.id,
      },
      data: {
        title: updateTodoInput.title,
      },
      include: {
        User: true,
      },
    });
  }

  async remove(id: number, userId: number) {
    const todo = await this.prismaService.todo.findUnique({
      where: {
        id,
      },
    });
    if (!todo) throw new BadRequestException();
    if (todo.userId !== userId) throw new ForbiddenException();
    return await this.prismaService.todo.delete({
      where: {
        id,
      },
    });
  }
}
