// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Buscar roles requeridas do decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Se não há roles definidas, permitir acesso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Extrair usuário da requisição (inserido pelo JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // 4. Verificar se usuário tem alguma das roles requeridas
    const hasRole = requiredRoles.some((role) => user?.role === role);
    // Debug: log roles evaluation
    if (!hasRole) {
      const currentRole = user?.role;
      const rolesList = requiredRoles.join(', ');
      // Use console.warn to ensure visibility regardless of Nest logger level
      // eslint-disable-next-line no-console
      console.warn(`RolesGuard: usuário com role=${currentRole} não possui uma das necessárias: ${rolesList}`);
    }

    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado. Roles necessárias: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}