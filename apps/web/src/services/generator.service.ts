import {
  AppBlueprint,
  CreateHandoffPromptDto,
  GenerateBlueprintRequestDto,
  GenerateCodeRequestDto,
  HandoffPromptPackage,
  ImportHandoffResponseDto,
  ProjectArtifactsBundleResponse,
  SoftwareProjectResponse,
} from '@software-factory/shared';
import { apiDownloadBlob, apiRequest } from '@/lib/api-client';

export const generatorService = {
  generateBlueprint: (projectId: string, dto: GenerateBlueprintRequestDto) =>
    apiRequest<{ project: SoftwareProjectResponse; blueprint: AppBlueprint }>(
      `/projects/${projectId}/generate-blueprint`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
    ),

  createHandoffPrompt: (projectId: string, dto: CreateHandoffPromptDto) =>
    apiRequest<HandoffPromptPackage>(`/projects/${projectId}/handoff-prompt`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  importHandoffResponse: (projectId: string, dto: ImportHandoffResponseDto) =>
    apiRequest<{ project: SoftwareProjectResponse; blueprint: AppBlueprint }>(
      `/projects/${projectId}/import-handoff`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
    ),

  generateCode: (projectId: string, dto: GenerateCodeRequestDto) =>
    apiRequest<ProjectArtifactsBundleResponse>(`/projects/${projectId}/generate-code`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  getArtifacts: (projectId: string) =>
    apiRequest<ProjectArtifactsBundleResponse>(`/projects/${projectId}/artifacts`),

  downloadZip: (projectId: string, slug: string) =>
    apiDownloadBlob(`/projects/${projectId}/download`, `${slug}.zip`),
};
