import { SourceFile, SyntaxKind, ts } from 'ts-morph';
import { GeneratedClientFunctionWithNodes, GeneratedSchemaWithNode, ParsedEnum, PluginFile } from '@pentops/jsonapi-jdef-ts-generator';
import { camelCase, pascalCase, sentenceCase } from 'change-case';
import {
  buildEnumIdExpression,
  DefinitionLabelWriter,
  DefinitionTypeReferenceWriter,
  DefinitionVariableNameWriter,
  DefinitionWriter,
  PSM_ID_PARAMETER_NAME,
  PSM_LABEL_PARAMETER_NAME,
  REACT_TABLE_STATE_PSM_IMPORT_PATH,
} from './shared';

const { factory } = ts;

export const REACT_TABLE_STATE_PSM_BASE_TABLE_SEARCH_TYPE_NAME = 'BaseTableSearch';

export const defaultSearchTypeDefinitionWriter: DefinitionWriter = (options) => {
  const { fieldEnum, field, labelWriter } = options;
  const keyName = fieldEnum.generatedValueNames.get(field.name);
  const idExpression = buildEnumIdExpression(fieldEnum, keyName);

  if (idExpression) {
    const rawLabel = labelWriter(options);
    const label = (typeof rawLabel === 'string' ? factory.createStringLiteral(rawLabel, true) : rawLabel) || idExpression;

    return factory.createObjectLiteralExpression(
      [factory.createPropertyAssignment(PSM_ID_PARAMETER_NAME, idExpression), factory.createPropertyAssignment(PSM_LABEL_PARAMETER_NAME, label)],
      true,
    );
  }

  return undefined;
};

export const defaultSearchTypeReferenceWriter: DefinitionTypeReferenceWriter = (
  file: PluginFile<SourceFile>,
  _generatedFunction: GeneratedClientFunctionWithNodes,
  fieldEnum: GeneratedSchemaWithNode<ParsedEnum>,
) => {
  file.addManualImport(
    REACT_TABLE_STATE_PSM_IMPORT_PATH,
    [REACT_TABLE_STATE_PSM_BASE_TABLE_SEARCH_TYPE_NAME],
    [REACT_TABLE_STATE_PSM_BASE_TABLE_SEARCH_TYPE_NAME],
  );

  return factory.createArrayTypeNode(
    factory.createTypeReferenceNode(REACT_TABLE_STATE_PSM_BASE_TABLE_SEARCH_TYPE_NAME, [
      fieldEnum.generatedName ? factory.createTypeReferenceNode(fieldEnum.generatedName) : factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
    ]),
  );
};

export const defaultSearchDefinitionVariableNameWriter: DefinitionVariableNameWriter = (
  generatedFunction: GeneratedClientFunctionWithNodes,
  isFunction: boolean,
) => {
  const base = `${generatedFunction.generatedName}-Search-Fields`;

  if (isFunction) {
    return camelCase(`get-${base}`);
  }

  return pascalCase(base);
};

export const defaultSearchLabelWriter: DefinitionLabelWriter = ({ field }) => sentenceCase(field.name.split('.').pop() || field.name);
