import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .flatMap((o) => {
      if (o === '*' || o.startsWith('http://') || o.startsWith('https://')) {
        return [o];
      }
      return [`https://${o}`, `http://${o}`];
    });

  app.enableCors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fábrica Livre API — Software Factory Open-Source')
    .setDescription(
      'API RESTful para geração automatizada de software Full-Stack voltada a pessoas sem conhecimento técnico, com suporte a Antigravity, ChatGPT, Claude, Gemini, Ollama e motor offline.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  logger.log(`Fábrica Livre API rodando em http://localhost:${port}/api`);
  logger.log(`Swagger OpenAPI disponível em http://localhost:${port}/api/docs`);
}

bootstrap();
