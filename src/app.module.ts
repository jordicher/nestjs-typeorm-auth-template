import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import config from './config';
import { enviroments } from './environments';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: enviroments[process.env.NODE_ENV] || '.env',
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),
      }),
      validationOptions: {
        abortEarly: true, //when true, stops validation on the first error, otherwise returns all the errors found. Defaults to true.
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [config.KEY],
      useFactory: (configService: ConfigType<typeof config>) => {
        console.log(configService);
        return {
          type: 'postgres',
          host: configService.postgres.host,
          port: configService.postgres.port,
          database: configService.postgres.name,
          username: configService.postgres.user,
          password: configService.postgres.password,
          synchronize: false,
          autoLoadEntities: true,
        };
      },
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
