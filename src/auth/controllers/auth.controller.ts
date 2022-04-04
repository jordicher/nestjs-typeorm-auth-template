import { Controller, Get, Post, Req, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import JwtRefreshGuard from '../guards/jwt-refresh.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { PayloadToken } from '../models/token.model';
import { AuthService } from '../services/auth.service';

type AuthorizedRequest = Express.Request & {
  headers: { authorization: string };
  user: PayloadToken;
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiBody({ type: LoginDto })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: { user: PayloadToken }) {
    const user = req.user;
    return this.authService.login(user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('logout')
  async logOut(@Request() req: { user: User }) {
    await this.authService.logout(req.user);
  }

  @ApiBearerAuth('refresh-token')
  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  refresh(@Req() req: AuthorizedRequest) {
    //get bearear of request
    console.log(req.user);
    const refreshToken = req.headers.authorization.split(' ')[1];

    return this.authService.createAccessTokenFromRefreshToken(
      refreshToken,
      req.user,
    );
  }
}
