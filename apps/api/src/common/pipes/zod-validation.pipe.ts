import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodType, ZodTypeDef } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T, ZodTypeDef, unknown>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const formattedErrors = this.formatErrors(result.error);
      throw new BadRequestException({
        message: 'Os dados enviados são inválidos.',
        details: formattedErrors,
      });
    }
    return result.data;
  }

  private formatErrors(error: ZodError): string[] {
    return error.errors.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'campo';
      return `${path}: ${issue.message}`;
    });
  }
}
