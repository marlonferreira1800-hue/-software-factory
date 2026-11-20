import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe('Fábrica Livre API (E2E Integration)', () => {
  let app: INestApplication;
  let builderToken: string;
  let adminToken: string;
  let createdProjectId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health retorna ok sem autenticação', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('bloqueia acesso a /api/projects sem JWT', async () => {
    await request(app.getHttpServer()).get('/api/projects').expect(401);
  });

  it('registra novo usuário BUILDER, provisiona conectores de assinatura IA e faz login ADMIN', async () => {
    const uniqueEmail = `e2e-${Date.now()}@fabricalivre.org`;
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Empreendedor Teste',
        email: uniqueEmail,
        password: 'Password123',
      })
      .expect(201);

    expect(regRes.body.accessToken).toBeDefined();
    expect(regRes.body.user.role).toBe('BUILDER');
    builderToken = regRes.body.accessToken;

    const connectorsRes = await request(app.getHttpServer())
      .get('/api/ai-providers')
      .set('Authorization', `Bearer ${builderToken}`)
      .expect(200);

    expect(connectorsRes.body.data.length).toBeGreaterThanOrEqual(5);
    const brands = connectorsRes.body.data.map((c: { subscriptionBrand: string }) => c.subscriptionBrand);
    expect(brands).toEqual(
      expect.arrayContaining(['Antigravity', 'ChatGPT', 'Claude', 'Gemini']),
    );

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@fabricalivre.org',
        password: 'Admin@123',
      })
      .expect(200);

    adminToken = adminLogin.body.accessToken;
  });

  it('aplica RBAC impedindo BUILDER de acessar /api/users, permitindo ADMIN', async () => {
    await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${builderToken}`)
      .expect(403);

    const adminRes = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(adminRes.body.meta.total).toBeGreaterThanOrEqual(3);
  });

  it('valida entradas inválidas com Zod retornando HTTP 400 estruturado', async () => {
    const errRes = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${builderToken}`)
      .send({ name: 'A', plainIdea: 'curta' })
      .expect(400);

    expect(errRes.body.details).toBeDefined();
    expect(errRes.body.details.length).toBeGreaterThan(0);
  });

  it('executa fluxo completo: criar projeto, modelar blueprint, handoff IA, compilar código e baixar ZIP', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${builderToken}`)
      .send({
        name: 'Confeitaria Doce Lar',
        plainIdea: 'Quero cadastrar clientes, produtos e encomendas de bolos com pagamento.',
      })
      .expect(201);

    createdProjectId = createRes.body.id;

    const blueprintRes = await request(app.getHttpServer())
      .post(`/api/projects/${createdProjectId}/generate-blueprint`)
      .set('Authorization', `Bearer ${builderToken}`)
      .send({
        prompt: 'Quero cadastrar clientes, produtos e encomendas de bolos com pagamento.',
      })
      .expect(201);

    expect(blueprintRes.body.blueprint.entities.length).toBeGreaterThanOrEqual(2);

    const handoffRes = await request(app.getHttpServer())
      .post(`/api/projects/${createdProjectId}/handoff-prompt`)
      .set('Authorization', `Bearer ${builderToken}`)
      .send({
        targetPlatform: 'CHATGPT',
        prompt: 'Adicione controle de ingredientes.',
      })
      .expect(201);

    expect(handoffRes.body.launchUrl).toBe('https://chatgpt.com');

    const codeRes = await request(app.getHttpServer())
      .post(`/api/projects/${createdProjectId}/generate-code`)
      .set('Authorization', `Bearer ${builderToken}`)
      .send({ includeDocker: true, includeAiPack: true })
      .expect(201);

    expect(codeRes.body.artifacts.length).toBeGreaterThan(10);

    const zipRes = await request(app.getHttpServer())
      .get(`/api/projects/${createdProjectId}/download`)
      .set('Authorization', `Bearer ${builderToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);

    expect((zipRes.body as Buffer).subarray(0, 2).toString('utf8')).toBe('PK');

    await request(app.getHttpServer())
      .delete(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${builderToken}`)
      .expect(200);
  });
});
