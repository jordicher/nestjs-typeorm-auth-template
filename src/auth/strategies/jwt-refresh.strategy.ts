import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import config from '../../config';
import { UsersService } from '../../users/services/users.service';
import { PayloadToken } from '../models/token.model';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  constructor(
    @Inject(config.KEY)
    private configService: ConfigType<typeof config>,
    private readonly userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.jwt.jwtRefreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: PayloadToken) {
    const refreshToken = request.headers.authorization.split(' ')[1];

    return this.userService.getUserIfRefreshTokenMatches(
      refreshToken,
      payload.id,
    );
  }
}
