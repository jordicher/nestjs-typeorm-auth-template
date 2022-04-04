import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { PayloadToken } from './../models/token.model';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user: {
      password: string;
      id: number;
      role: string;
    } = await this.usersService.findByEmailAndGetPassword(email);
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...rta } = user;
        return rta;
      }
    }
    return null;
  }

  async login(user: PayloadToken) {
    const { accessToken, user: userData } = this.jwtToken(user);
    const refreshToken = this.jwtRefreshToken(user);

    await this.usersService.setCurrentRefreshToken(refreshToken, user.id);

    return {
      accessToken,
      user: userData,
      refreshToken,
    };
  }

  jwtToken(user: PayloadToken) {
    const payload: PayloadToken = { role: user.role, id: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  jwtRefreshToken(user: PayloadToken) {
    const payload = { role: user.role, id: user.id };

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: `${this.configService.get('REFRESH_TOKEN_EXPIRATION')}`,
    });

    return refreshToken;
  }

  async logout(user: User) {
    return await this.usersService.removeRefreshToken(user.id);
  }

  async createAccessTokenFromRefreshToken(
    refreshToken: string,
    user: PayloadToken,
  ) {
    try {
      await this.jwtService.verifyAsync(refreshToken, this.getTokenOptions());
      return this.login(user);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private getTokenOptions() {
    const options: JwtSignOptions = {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    };

    const expiration: string = this.configService.get(
      'REFRESH_TOKEN_EXPIRATION',
    );
    if (expiration) {
      options.expiresIn = expiration;
    }
    return options;
  }
}
