import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: { user: User }) {
    const user = req.user;
    return this.authService.login(user);
  }

  @Get('logout')
  @ApiTags('Authentication')
  @UseGuards(JwtAuthGuard)
  async logOut(@Request() req: any, user) {
    await this.authService.logout(user.email);
    req.res.setHeader('Authorization', null);
  }
}
