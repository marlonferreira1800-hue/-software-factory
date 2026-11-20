import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import {
  CreateUserDto,
  PaginatedResult,
  UpdateUserDto,
  UserQueryDto,
  UserResponse,
  UserRole,
} from '@software-factory/shared';
import { toPaginatedResult } from '../../common/utils/pagination.util';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async list(query: UserQueryDto): Promise<PaginatedResult<UserResponse>> {
    const { items, total } = await this.usersRepository.findManyPaginated(query);
    return toPaginatedResult(
      items.map((u) => this.toResponse(u)),
      total,
      query.page,
      query.pageSize,
    );
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return this.toResponse(user);
  }

  async create(dto: CreateUserDto): Promise<UserResponse> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Já existe um usuário ativo com este e-mail.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role,
      isActive: dto.isActive,
    });
    return this.toResponse(created);
  }

  async update(id: string, dto: UpdateUserDto, actorId: string): Promise<UserResponse> {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (id === actorId && dto.isActive === false) {
      throw new BadRequestException('Você não pode desativar a sua própria conta.');
    }

    if (id === actorId && dto.role && dto.role !== existing.role) {
      throw new BadRequestException('Você não pode alterar seu próprio nível de acesso.');
    }

    if (dto.email && dto.email.toLowerCase() !== existing.email) {
      const emailTaken = await this.usersRepository.findByEmail(dto.email);
      if (emailTaken) {
        throw new ConflictException('Este e-mail já está em uso por outro usuário.');
      }
    }

    const updateData: Parameters<UsersRepository['update']>[1] = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };

    if (dto.password && dto.password.trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.usersRepository.update(id, updateData);
    return this.toResponse(updated);
  }

  async remove(id: string, actorId: string): Promise<{ deleted: true; id: string }> {
    if (id === actorId) {
      throw new BadRequestException('Você não pode excluir sua própria conta de administrador.');
    }

    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.usersRepository.softDelete(id);
    return { deleted: true, id };
  }

  private toResponse(user: User): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
