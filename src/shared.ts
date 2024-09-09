import { match, P } from 'ts-pattern';
import { SourceFile, Statement, SyntaxKind, ts } from 'ts-morph';
import {
  GeneratedClientFunctionWithNodes,
  GeneratedSchemaWithNode,
  ParsedBool,
  ParsedEnum,
  ParsedEnumValueDescription,
  ParsedFloat,
  ParsedInteger,
  ParsedKey,
  ParsedOneOf,
  ParsedSchema,
  ParsedString,
  PluginFile,
} from '@pentops/jsonapi-jdef-ts-generator';
import { sentenceCase } from 'change-case';

const { factory } = ts;

export const REACT_TABLE_STATE_PSM_IMPORT_PATH = '@pentops/react-table-state-psm';
export const PSM_ID_PARAMETER_NAME = 'id';
export const PSM_LABEL_PARAMETER_NAME = 'label';

export type DefinitionTypeReferenceWriter = (
  file: PluginFile<SourceFile>,
  generatedFunction: GeneratedClientFunctionWithNodes,
  fieldEnum: GeneratedSchemaWithNode<ParsedEnum>,
) => ts.TypeNode;

export type DefinitionVariableNameWriter = (generatedFunction: GeneratedClientFunctionWithNodes, isFunction: boolean) => string;

export type VariableNameWriter = (generatedFunction: GeneratedClientFunctionWithNodes) => string;

export interface GeneratorHookOptions {
  generatedStatement: ts.VariableStatement;
  generatedFunction: GeneratedClientFunctionWithNodes;
  file: PluginFile<SourceFile>;
}

export type GeneratorHook = (options: GeneratorHookOptions) => ts.VariableStatement;

export type DependencyInjectorFunction = (argumentName: string, typeReference: ts.TypeReferenceNode | string) => void;

export interface DefinitionWriterOptions<TFieldSchema extends ParsedSchema = ParsedSchema> {
  file: PluginFile<SourceFile>;
  generatedFunction: GeneratedClientFunctionWithNodes;
  fieldEnum: GeneratedSchemaWithNode<ParsedEnum>;
  field: ParsedEnumValueDescription<TFieldSchema>;
  generatedFieldSchema: GeneratedSchemaWithNode<TFieldSchema> | undefined;
  // If dependencies are added for any definition, the resulting generated definition will be a getter function that accepts
  // the dependencies as arguments
  injectDependency: DependencyInjectorFunction;
  config: DefinitionWriterConfig;
  labelWriter: DefinitionLabelWriter<TFieldSchema>;
}

export type DefinitionWriter<TFieldSchema extends ParsedSchema = ParsedSchema> = (
  options: DefinitionWriterOptions<TFieldSchema>,
) => ts.ObjectLiteralExpression | undefined;

export type DefinitionHookOptions<TFieldSchema extends ParsedSchema = ParsedSchema> = DefinitionWriterOptions<TFieldSchema> & {
  generatedExpression: ts.ObjectLiteralExpression;
};

export type DefinitionLabelWriter<TFieldSchema extends ParsedSchema = ParsedSchema> = (
  options: Omit<DefinitionWriterOptions<TFieldSchema>, 'labelWriter'>,
) => string | ts.Expression | undefined;

export type DefinitionHook = (options: DefinitionHookOptions) => ts.ObjectLiteralExpression | undefined;

export function buildEnumIdExpression(enumSchema: GeneratedSchemaWithNode<ParsedEnum>, keyName: string | undefined) {
  if (!keyName) {
    return undefined;
  }

  return enumSchema.node.kind === SyntaxKind.EnumDeclaration
    ? factory.createPropertyAccessExpression(factory.createIdentifier(enumSchema.generatedName), factory.createIdentifier(keyName))
    : factory.createStringLiteral(keyName);
}

export type StatementConflictHandler = (newSource: Statement | undefined, existingSource: Statement | undefined) => Statement | undefined;

export const defaultStatementConflictHandler: StatementConflictHandler = (newSource) => newSource;

export type EnumOptionLabelWriterOptions = Omit<DefinitionWriterOptions<ParsedEnum>, 'config' | 'labelWriter'>;

export type EnumOptionLabelWriter = (options: EnumOptionLabelWriterOptions) => string | ts.Expression | undefined;

export const defaultEnumOptionLabelWriter: EnumOptionLabelWriter = ({ field }) => sentenceCase(field.name.split('.').pop() || field.name);

export type OneOfOptionLabelWriterOptions = Omit<DefinitionWriterOptions<ParsedOneOf>, 'config' | 'labelWriter'>;

export type OneOfOptionLabelWriter = (options: OneOfOptionLabelWriterOptions) => string | ts.Expression | undefined;

export const defaultOneOfOptionLabelWriter: OneOfOptionLabelWriter = ({ field }) => sentenceCase(field.name.split('.').pop() || field.name);

export interface DefinitionWriterConfig {
  enum: DefinitionWriter<ParsedEnum>;
  enumOptionLabelWriter: EnumOptionLabelWriter;
  oneOf: DefinitionWriter<ParsedOneOf>;
  oneOfOptionLabelWriter: OneOfOptionLabelWriter;
  date: DefinitionWriter<ParsedString>;
  string: DefinitionWriter<ParsedString>;
  key: DefinitionWriter<ParsedKey>;
  boolean: DefinitionWriter<ParsedBool>;
  integer: DefinitionWriter<ParsedInteger>;
  float: DefinitionWriter<ParsedFloat>;
}

export function addTypeImportIfEnum(file: PluginFile<SourceFile>, generatedSchema: GeneratedSchemaWithNode<ParsedEnum>) {
  if (generatedSchema.node.kind === SyntaxKind.EnumDeclaration) {
    file.addGeneratedTypeImport(generatedSchema.generatedName);
  }
}

export function defaultTypeObjectLiteralExpressionGetter(options: DefinitionWriterOptions) {
  const { file, fieldEnum, field, generatedFunction, generatedFieldSchema, injectDependency, labelWriter, config } = options;
  const keyName = fieldEnum.generatedValueNames.get(field.name);
  const idExpression = buildEnumIdExpression(fieldEnum, keyName);

  if (idExpression) {
    return match(field)
      .returnType<ts.ObjectLiteralExpression | undefined>()
      .with({ genericReferenceToSchema: { string: P.union({ format: 'date-time' }, { format: 'date' }) } }, (f) =>
        config.date({
          file,
          generatedFunction,
          fieldEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedString>,
          injectDependency,
          config,
          labelWriter,
        }),
      )
      .with({ genericReferenceToSchema: { string: P.not(P.nullish) } }, (f) =>
        config.string({
          file,
          generatedFunction,
          fieldEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedString>,
          injectDependency,
          config,
          labelWriter,
        }),
      )
      .with({ genericReferenceToSchema: { key: P.not(P.nullish) } }, (f) =>
        config.key({
          file,
          generatedFunction,
          fieldEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedKey>,
          injectDependency,
          config,
          labelWriter,
        }),
      )
      .with({ genericReferenceToSchema: { oneOf: P.not(P.nullish) } }, (f) =>
        config.oneOf({
          file,
          generatedFunction,
          fieldEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedOneOf>,
          injectDependency,
          config,
          labelWriter,
        }),
      )
      .with({ genericReferenceToSchema: { enum: P.not(P.nullish) } }, (f) =>
        config.enum({
          file,
          generatedFunction,
          fieldEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedEnum>,
          injectDependency,
          config,
          labelWriter,
        }),
      )
      .with({ genericReferenceToSchema: { bool: P.not(P.nullish) } }, (f) =>
        config.boolean({
          file,
          generatedFunction,
          fieldEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedBool>,
          injectDependency,
          config,
          labelWriter,
        }),
      )
      .with({ genericReferenceToSchema: { integer: P.not(P.nullish) } }, (f) =>
        config.integer({
          file,
          generatedFunction,
          fieldEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedInteger>,
          injectDependency,
          config,
          labelWriter,
        }),
      )
      .with({ genericReferenceToSchema: { float: P.not(P.nullish) } }, (f) =>
        config.float({
          file,
          generatedFunction,
          fieldEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedFloat>,
          injectDependency,
          config,
          labelWriter,
        }),
      )
      .otherwise(() => undefined);
  }

  return undefined;
}
