import {
  APISource,
  Builder,
  defaultConfig,
  defaultEnumKeyNameWriter,
  IPluginFileConfig,
  parseApiSource,
  ParsedMethod,
} from '@pentops/jsonapi-jdef-ts-generator';
import { SourceFile } from 'ts-morph';
import { describe, it, expect } from 'vitest';
import { match, P } from 'ts-pattern';
import { camelCase, kebabCase, pascalCase } from 'change-case';
import { PSMTableConfigPlugin } from '../src';
import rawSource from './mock/api.json';

function typeNameWriter(x: string) {
  return x
    .split(/[./]/)
    .filter((x) => x)
    .map((x) => pascalCase(x))
    .join('');
}

function methodNameWriter(method: ParsedMethod) {
  return method.fullGrpcName
    .split(/[./]/)
    .reduce<string[]>((acc, curr) => {
      if (curr) {
        acc.push(acc.length === 0 ? camelCase(curr) : pascalCase(curr));
      }

      return acc;
    }, [])
    .join('');
}

const hooksToGenerate: Set<string> = new Set();
const entitiesToGenerate: Set<string> = new Set();

describe('PSMTableConfigPlugin', async () => {
  const source = parseApiSource(rawSource as unknown as APISource);

  it('should properly generate filter, search, and sort definitions from an api.json file', async () => {
    const gen = await new Builder(
      process.cwd(),
      {
        ...defaultConfig,
        dryRun: { log: false },
        typeOutput: {
          directory: './types/generated',
          fileName: 'api.ts',
        },
        clientOutput: {
          directory: './api-client/generated/client-functions',
          fileName: 'index.ts',
        },
        types: {
          enumType: 'enum',
          enumKeyNameWriter: defaultEnumKeyNameWriter,
          nameWriter: typeNameWriter,
        },
        client: {
          methodNameWriter,
        },
        plugins: [
          new PSMTableConfigPlugin({
            files: [{ directory: './table-config/generated', fileName: 'index.ts' }],
          }) as any,
        ],
      },
      source,
    ).build();

    expect(gen).toBeDefined();

    gen?.getSourceFiles().forEach((file) => {
      console.log(file.getFullText())
    });
  });
});
