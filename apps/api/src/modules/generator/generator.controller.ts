import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import {
  CreateHandoffPromptDto,
  GenerateBlueprintRequestDto,
  GenerateCodeRequestDto,
  ImportHandoffResponseDto,
} from '@software-factory/shared';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateHandoffPromptSchema,
  CreateHandoffPromptSwaggerDto,
  GenerateBlueprintRequestSchema,
  GenerateBlueprintSwaggerDto,
  GenerateCodeRequestSchema,
  GenerateCodeSwaggerDto,
  ImportHandoffResponseSchema,
  ImportHandoffSwaggerDto,
} from './generator.dto';
import { GeneratorService } from './generator.service';

@ApiTags('Fábrica de Software & Gerador')
@ApiBearerAuth()
@Controller('projects/:projectId')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  @Post('generate-blueprint')
  @Roles('ADMIN', 'BUILDER')
  @ApiOperation({
    summary: 'Gerar arquitetura (blueprint) automática a partir de descrição simples',
  })
  @ApiBody({ type: GenerateBlueprintSwaggerDto })
  generateBlueprint(
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(GenerateBlueprintRequestSchema))
    dto: GenerateBlueprintRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generatorService.generateBlueprint(projectId, dto, user);
  }

  @Post('handoff-prompt')
  @Roles('ADMIN', 'BUILDER')
  @ApiOperation({
    summary: 'Gerar super-prompt guiado para usar assinatura Antigravity, ChatGPT, Claude ou Gemini',
  })
  @ApiBody({ type: CreateHandoffPromptSwaggerDto })
  createHandoffPrompt(
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(CreateHandoffPromptSchema)) dto: CreateHandoffPromptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generatorService.createHandoffPrompt(projectId, dto, user);
  }

  @Post('import-handoff')
  @Roles('ADMIN', 'BUILDER')
  @ApiOperation({
    summary: 'Importar e validar resposta JSON vinda da assinatura de IA do usuário',
  })
  @ApiBody({ type: ImportHandoffSwaggerDto })
  importHandoffResponse(
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(ImportHandoffResponseSchema))
    dto: ImportHandoffResponseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generatorService.importHandoffResponse(projectId, dto, user);
  }

  @Post('generate-code')
  @Roles('ADMIN', 'BUILDER')
  @ApiOperation({
    summary: 'Compilar Prisma, NestJS, Next.js, Docker e pacote Antigravity/AI para o projeto',
  })
  @ApiBody({ type: GenerateCodeSwaggerDto })
  generateCode(
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(GenerateCodeRequestSchema)) dto: GenerateCodeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generatorService.generateCode(projectId, dto, user);
  }

  @Get('artifacts')
  @Roles('ADMIN', 'BUILDER', 'VIEWER')
  @ApiOperation({ summary: 'Listar arquivos gerados e histórico de execuções do projeto' })
  getArtifacts(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generatorService.getArtifactsBundle(projectId, user);
  }

  @Get('download')
  @Roles('ADMIN', 'BUILDER', 'VIEWER')
  @ApiOperation({ summary: 'Baixar pacote completo do software gerado em arquivo .ZIP' })
  async downloadZip(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const { filename, buffer } = await this.generatorService.buildZipDownload(
      projectId,
      user,
    );
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
