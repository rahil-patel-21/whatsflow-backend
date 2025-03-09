// Imports
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('WhatsFlow Backend')
    .setDescription('API Doc for whatsflow backend')
    .setVersion('1.0')
    .addTag('v1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docBook', app, document);

  await app.listen(3000);
}

bootstrap();
