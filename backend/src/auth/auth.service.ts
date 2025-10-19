import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { TokenRevocationService } from '../token-revocation/token-revocation.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenRevocationService: TokenRevocationService,
  ) {}

  async register(email: string, name: string, password: string) {
    const user = await this.usersService.create(email, name, password);
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user,
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      // Verifica se o token está na blacklist
      const isRevoked =
        await this.tokenRevocationService.isTokenRevoked(refreshToken);
      if (isRevoked) {
        throw new UnauthorizedException('Token revogado');
      }

      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      });

      return this.generateTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async logout(userId: string, refreshToken: string) {
    try {
      // Decodifica o token para pegar a data de expiração
      const decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      });

      const expiresAt = new Date(decoded.exp * 1000);

      // Adiciona à blacklist
      await this.tokenRevocationService.revokeToken(
        refreshToken,
        userId,
        expiresAt,
      );

      return { message: 'Logout realizado com sucesso' };
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }

  async logoutAllDevices(userId: string) {
    await this.tokenRevocationService.revokeAllUserTokens(userId);
    return { message: 'Logout realizado em todos os dispositivos' };
  }
}
