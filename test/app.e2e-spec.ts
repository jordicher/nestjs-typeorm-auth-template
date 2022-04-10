import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Connection } from 'typeorm';
import { AppModule } from './../src/app.module';
import { userAdmin, userCustomer, userLogin } from './utils';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let adminJwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();

    const connection = app.get(Connection);
    await connection.synchronize(true);

    await connection
      .createQueryBuilder()
      .insert()
      .into('users')
      .values([userAdmin])
      .execute();
  });

  afterAll(() => {
    app.close();
  });

  describe('Authentication', () => {
    //some tests are of  => https://gist.github.com/mjclemente/e13995c29376f0924eb2eacf98eaa5a6

    it('authenticates user with valid credentials and provides a jwt token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: userLogin.email, password: userLogin.password })
        .expect(200);

      adminJwtToken = response.body.accessToken;
      expect(adminJwtToken).toMatch(
        /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
      );
    });

    it('fails to authenticate user with an incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: userLogin.email, password: 'wrong' })
        .expect(401);

      expect(response.body.accessToken).not.toBeDefined();
    });

    it('fails to authenticate user that does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'test' })
        .expect(401);

      expect(response.body.accessToken).not.toBeDefined();
    });
  });

  describe('Users', () => {
    let customerId: number;
    it('should create a customer user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: userCustomer.email,
          password: userCustomer.password,
          firstName: userCustomer.firstName,
          lastName: userCustomer.lastName,
        })
        .expect(201);

      customerId = response.body.id;
      expect(response.body.email).toBe(userCustomer.email);
      expect(response.body.firstName).toBe(userCustomer.firstName);
      expect(response.body.lastName).toBe(userCustomer.lastName);
    });

    it('should not create a customer user with an invalid email', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'invalid',
          password: userCustomer.password,
          firstName: userCustomer.firstName,
          lastName: userCustomer.lastName,
        })
        .expect(400);
    });

    it('should get a user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${customerId}`)
        .set('Authorization', `Bearer ${adminJwtToken}`)
        .expect(200);

      expect(response.body.email).toBe(userCustomer.email);
    });

    it('should list all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminJwtToken}`)
        .expect(200);

      expect(response.body.length).toBe(2);
    });

    it('should update a customer user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${customerId}`)
        .set('Authorization', `Bearer ${adminJwtToken}`)
        .send({
          email: userCustomer.email,
          password: userCustomer.password,
          firstName: 'Jordi',
          lastName: 'test',
        })
        .expect(200);

      expect(response.body.email).toBe(userCustomer.email);
      expect(response.body.firstName).toBe('Jordi');
      expect(response.body.lastName).toBe('test');
    });

    it('should delete a customer user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${customerId}`)
        .set('Authorization', `Bearer ${adminJwtToken}`)
        .expect(200);
    });

    it('should not delete a customer user with an invalid id', async () => {
      await request(app.getHttpServer())
        .delete('/users/0')
        .set('Authorization', `Bearer ${adminJwtToken}`)
        .expect(404);
    });
  });
});
