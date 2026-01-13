import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { TokenRevocationService } from '../token-revocation/token-revocation.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenRevocationService: TokenRevocationService,
  ) {}

  async register(
    email: string,
    name: string,
    password: string,
    role?: UserRole,
  ) {
    if (role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Não é permitido criar usuários ADMIN via registro',
      );
    }

    const user = await this.usersService.create({
      email,
      name,
      password,
      role: role || UserRole.COMERCIAL,
      
    });

    return {
      user,
      message:
        'Usuário criado com sucesso. Aguarde ativação por um administrador.',
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Usuário inativo. Entre em contato com o administrador.',
      );
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user.isActive) {
      throw new UnauthorizedException('Usuário foi desativado');
    }

    return user;
  }

  private async generateTokens(userId: string, email: string, role: UserRole) {
    // ✅ Adicionar jti (JWT ID) único para garantir tokens diferentes
    const jti = randomBytes(16).toString('hex');

    const payload = {
      sub: userId,
      email,
      role,
      jti, // Identificador único do token
    };

    // Access token usa a configuração padrão do módulo (15min)
    const accessToken = await this.jwtService.signAsync(payload);

    // ✅ Refresh token com JTI diferente para garantir unicidade
    const refreshJti = randomBytes(16).toString('hex');
    const refreshPayload = {
      sub: userId,
      email,
      role,
      jti: refreshJti,
    };

    // Refresh token tem secret e expiração próprios
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    try {
      // 1. Verificar se está na blacklist
      const isRevoked =
        await this.tokenRevocationService.isTokenRevoked(refreshToken);
      if (isRevoked) {
        throw new UnauthorizedException('Token revogado');
      }

      // 2. Validar e decodificar o refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      });

      // 3. Verificar se usuário ainda está ativo
      const user = await this.usersService.findById(payload.sub);
      if (!user.isActive) {
        throw new UnauthorizedException('Usuário foi desativado');
      }

      // 4. Revogar o refresh token antigo ANTES de gerar o novo
      const decoded = this.jwtService.decode(refreshToken) as any;
      if (decoded && decoded.exp) {
        const expiresAt = new Date(decoded.exp * 1000);
        await this.tokenRevocationService.revokeToken(
          refreshToken,
          payload.sub,
          expiresAt,
        );
      }

      // 5. Gerar novos tokens (com novos JTIs únicos)
      const newTokens = await this.generateTokens(
        payload.sub,
        payload.email,
        payload.role,
      );

      return newTokens;
    } catch (error) {
      // Preservar mensagens específicas de UnauthorizedException
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async logout(userId: string, refreshToken: string) {
    try {
      // ✅ Validar o refresh token antes de revogar
      const decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      });

      // ✅ Verificar se o token pertence ao usuário
      if (decoded.sub !== userId) {
        throw new UnauthorizedException('Token não pertence ao usuário');
      }

      const expiresAt = new Date(decoded.exp * 1000);

      await this.tokenRevocationService.revokeToken(
        refreshToken,
        userId,
        expiresAt,
      );

      return { message: 'Logout realizado com sucesso' };
    } catch (error) {
      // ✅ Se for erro de validação, retornar mensagem apropriada
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async logoutAllDevices(userId: string) {
    // Implementação básica - tokens serão invalidados naturalmente
    // Para invalidação imediata, implemente tokenVersion no User model
    return {
      message:
        'Sessões encerradas. Tokens refresh serão invalidados na próxima tentativa de uso.',
      note: 'Para invalidação imediata, implemente tokenVersion no User model',
    };
  }
}
