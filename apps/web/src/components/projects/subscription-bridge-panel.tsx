'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, Sparkles, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  AppBlueprint,
  HandoffPromptPackage,
  TargetAiPlatform,
} from '@software-factory/shared';
import { ApiClientError } from '@/lib/api-client';
import { generatorService } from '@/services/generator.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label, Textarea } from '@/components/ui/input';

const PLATFORMS: Array<{
  id: TargetAiPlatform;
  label: string;
  subtitle: string;
}> = [
  { id: 'ANTIGRAVITY', label: 'Antigravity', subtitle: 'Sua conta / agente Antigravity' },
  { id: 'CHATGPT', label: 'ChatGPT', subtitle: 'Assinatura Plus / Pro na web' },
  { id: 'CLAUDE', label: 'Claude', subtitle: 'Assinatura Claude Pro / Max' },
  { id: 'GEMINI', label: 'Gemini', subtitle: 'Assinatura Google AI / Gemini' },
];

export function SubscriptionBridgePanel({
  projectId,
  initialPrompt,
  onImported,
}: {
  projectId: string;
  initialPrompt: string;
  onImported: (blueprint: AppBlueprint) => void;
}) {
  const [platform, setPlatform] = useState<TargetAiPlatform>('ANTIGRAVITY');
  const [promptInput, setPromptInput] = useState(initialPrompt);
  const [handoffPkg, setHandoffPkg] = useState<HandoffPromptPackage | null>(null);
  const [rawAiResponse, setRawAiResponse] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGeneratePrompt() {
    if (promptInput.trim().length < 8) {
      toast.error('Descreva o que você precisa com pelo menos 8 caracteres.');
      return;
    }
    setLoadingPrompt(true);
    try {
      const pkg = await generatorService.createHandoffPrompt(projectId, {
        targetPlatform: platform,
        prompt: promptInput,
      });
      setHandoffPkg(pkg);
      toast.success('Pedido preparado! Agora copie e cole na sua assinatura de IA.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao montar pedido.');
    } finally {
      setLoadingPrompt(false);
    }
  }

  async function handleCopyPrompt() {
    if (!handoffPkg) return;
    await navigator.clipboard.writeText(handoffPkg.superPrompt);
    setCopied(true);
    toast.success('Pedido copiado! Cole agora na conversa da sua IA.');
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleImportResponse() {
    if (rawAiResponse.trim().length < 20) {
      toast.error('Cole a resposta completa retornada pela sua IA.');
      return;
    }
    setImporting(true);
    try {
      const res = await generatorService.importHandoffResponse(projectId, {
        rawAiResponse,
        targetPlatform: platform,
      });
      toast.success('Estrutura importada e validada com sucesso!');
      onImported(res.blueprint);
    } catch (err) {
      if (err instanceof ApiClientError && err.details?.length) {
        toast.error(`${err.message} (${err.details[0]})`);
      } else {
        toast.error(err instanceof Error ? err.message : 'Não foi possível validar o JSON.');
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Usar sua Assinatura de IA (Sem Pagar Chave API)
            </CardTitle>
            <CardDescription className="mt-1">
              Conecte seu plano pessoal do Antigravity, ChatGPT, Claude ou Gemini em 3 cliques.
            </CardDescription>
          </div>
          <Badge variant="warning">Zero API Key</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div>
          <Label className="mb-2 block">1. Escolha qual assinatura você já utiliza</Label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PLATFORMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPlatform(item.id)}
                className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                  platform === item.id
                    ? 'border-primary bg-primary/8 ring-1 ring-primary/30'
                    : 'border-border bg-white hover:bg-muted/60'
                }`}
              >
                <p className="font-semibold text-sm text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bridge-prompt">2. O que você quer pedir ou melhorar neste sistema?</Label>
          <Textarea
            id="bridge-prompt"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Ex: Quero um sistema para controlar pedidos da minha confeitaria, sabores disponíveis e pagamentos..."
          />
          <Button type="button" onClick={handleGeneratePrompt} disabled={loadingPrompt}>
            {loadingPrompt ? 'Preparando pedido...' : 'Gerar Pedido Pronto para Minha IA'}
          </Button>
        </div>

        {handoffPkg && (
          <div className="space-y-4 rounded-xl border border-border bg-muted/50 p-4">
            <p className="text-sm text-foreground font-medium">{handoffPkg.platformInstructions}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="default" size="sm" onClick={handleCopyPrompt}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado!' : 'Copiar Pedido Estruturado'}
              </Button>
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={handoffPkg.launchUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Abrir {PLATFORMS.find((p) => p.id === platform)?.label}
                </a>
              </Button>
            </div>
            <pre className="max-h-44 overflow-auto rounded-lg border border-border bg-white p-3 font-mono text-xs text-stone-700 whitespace-pre-wrap">
              {handoffPkg.superPrompt}
            </pre>
          </div>
        )}

        <div className="space-y-2 border-t border-border pt-4">
          <Label htmlFor="bridge-response">
            3. Cole aqui a resposta que a sua IA devolveu (JSON)
          </Label>
          <Textarea
            id="bridge-response"
            className="min-h-[130px] font-mono text-xs"
            value={rawAiResponse}
            onChange={(e) => setRawAiResponse(e.target.value)}
            placeholder='Cole aqui o bloco ```json { "appName": ... } ``` retornado pelo Antigravity, ChatGPT, Claude ou Gemini...'
          />
          <Button
            type="button"
            variant="accent"
            onClick={handleImportResponse}
            disabled={importing}
          >
            <Upload className="h-4 w-4" />
            {importing ? 'Validando e construindo...' : 'Importar Resposta & Atualizar Projeto'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
