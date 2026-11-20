import { Injectable } from '@nestjs/common';
import JSZip from 'jszip';
import { AppBlueprint } from '@software-factory/shared';
import { generatePrismaSchema } from './prisma-codegen';
import { GeneratedCodeFile, generateNestJsBackend } from './nestjs-codegen';
import { generateNextJsFrontend } from './nextjs-codegen';
import { generateInfraAndAiPack } from './infra-codegen';

@Injectable()
export class CodeFactoryEngine {
  generateAllFiles(
    blueprint: AppBlueprint,
    options: { includeDocker: boolean; includeAiPack: boolean },
  ): Array<GeneratedCodeFile & { sizeBytes: number }> {
    const prismaFile: GeneratedCodeFile = {
      filePath: 'backend/prisma/schema.prisma',
      layer: 'DATABASE',
      language: 'prisma',
      content: generatePrismaSchema(blueprint),
    };

    const backendFiles = generateNestJsBackend(blueprint);
    const frontendFiles = generateNextJsFrontend(blueprint);
    const infraFiles = generateInfraAndAiPack(blueprint, options);

    const allFiles = [prismaFile, ...backendFiles, ...frontendFiles, ...infraFiles];
    return allFiles.map((file) => ({
      ...file,
      sizeBytes: Buffer.byteLength(file.content, 'utf8'),
    }));
  }

  async createZipArchive(
    files: Array<{ filePath: string; content: string }>,
    rootFolderSlug: string,
  ): Promise<Buffer> {
    const zip = new JSZip();
    const root = zip.folder(rootFolderSlug) || zip;

    for (const file of files) {
      root.file(file.filePath, file.content);
    }

    return zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  }
}
