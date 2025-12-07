import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';

// Guard para autorizar requisições externas via token estático (sem login)
// Usa o header Authorization: Bearer <EXTERNAL_API_TOKEN>
@Injectable()
export class ExternalTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const logger = new Logger(ExternalTokenGuard.name);
    const authHeader: string | undefined = req.headers['authorization'];

    const externalToken = process.env.EXTERNAL_API_TOKEN;
    if (!externalToken) {
      // Se não configurado, não autoriza por este guard
      logger.warn('EXTERNAL_API_TOKEN não configurado no ambiente');
      return false;
    }

    logger.debug(`Authorization header presente: ${Boolean(authHeader)}`);
    if (authHeader) {
      logger.debug(`Authorization recebido: ${authHeader}`);
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authorization inválido ou ausente (esperado: Bearer <token>)');
      return false;
    }
    const provided = authHeader.substring('Bearer '.length).trim();
    const matches = provided === externalToken;
    logger.debug(`Token confere com EXTERNAL_API_TOKEN: ${matches}`);
    if (!matches) {
      // Header presente mas token inválido — não autoriza por este guard
      logger.warn('Token fornecido não confere com EXTERNAL_API_TOKEN');
      return false;
    }

    // Autorizado pelo token externo: injeta um usuário de sistema básico
    req.user = {
      id: 'system-external-user',
      sub: 'system-external-user',
      email: 'external@system.local',
      role: 'COMERCIAL',
    };

    return true;
  }
}
