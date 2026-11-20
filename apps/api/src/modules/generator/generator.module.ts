import { Module } from '@nestjs/common';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';
import { ProjectsModule } from '../projects/projects.module';
import { CodeFactoryEngine } from './codegen/code-factory.engine';
import { GeneratorController } from './generator.controller';
import { GeneratorRepository } from './generator.repository';
import { GeneratorService } from './generator.service';

@Module({
  imports: [ProjectsModule, AiProvidersModule],
  controllers: [GeneratorController],
  providers: [GeneratorService, GeneratorRepository, CodeFactoryEngine],
  exports: [GeneratorService],
})
export class GeneratorModule {}
