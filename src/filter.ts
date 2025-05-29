import { SyntaxKind, ts } from 'ts-morph';
import { camelCase, constantCase, pascalCase, sentenceCase } from 'change-case';
import {
  GeneratedClientFunctionWithNodes,
  GeneratedSchemaWithNode, ParsedAny,
  ParsedBool, ParsedDate, ParsedDecimal,
  ParsedEnum,
  ParsedEnumValueDescription,
  ParsedFloat,
  ParsedInteger,
  ParsedKey,
  ParsedOneOf, ParsedPolymorph,
  ParsedString, ParsedTimestamp,
} from '@pentops/jsonapi-jdef-ts-generator';
import {
  addTypeImportIfEnum,
  buildEnumIdExpression, defaultAnyOptionLabelWriter,
  defaultEnumOptionLabelWriter,
  defaultOneOfOptionLabelWriter, defaultPolymorphOptionLabelWriter,
  defaultTypeObjectLiteralExpressionGetter,
  DefinitionLabelWriter,
  DefinitionTypeReferenceWriter,
  DefinitionVariableNameWriter,
  DefinitionWriter,
  DefinitionWriterConfig,
  PSM_ID_PARAMETER_NAME,
  PSM_LABEL_PARAMETER_NAME,
  REACT_TABLE_STATE_PSM_IMPORT_PATH,
  VariableNameWriter,
} from './shared';
import { PSMTableConfigPluginFile } from './plugin-file';

const { factory } = ts;

export const FILTER_STATE_TYPE_NAME = 'FilterState';
export const PSM_FILTER_TYPE_PARAMETER_NAME = 'type';
export const PSM_VALUE_PARAMETER_NAME = 'value';
export const PSM_EXACT_PARAMETER_NAME = 'exact';
export const PSM_IN_PARAMETER_NAME = 'in';
export const PSM_FILTERS_PARAMETER_NAME = 'filters';

export const REACT_TABLE_STATE_PSM_BASE_TABLE_FILTER_TYPE_NAME = 'BaseTableFilter';
export const REACT_TABLE_STATE_PSM_BASE_TABLE_FILTER_TYPE_TYPE_NAME = 'BaseFilterType';
export const REACT_TABLE_STATE_PSM_ENUM_FILTER_TYPE_OPTION_NAMES_OPTIONS = 'options';
export const REACT_TABLE_STATE_PSM_ENUM_FILTER_TYPE_OPTION_NAMES_VALUE = 'value';
export const REACT_TABLE_STATE_PSM_ENUM_FILTER_TYPE_OPTION_NAMES_LABEL = 'label';
export const REACT_TABLE_STATE_PSM_ONE_OF_FILTER_TYPE_OPTION_NAMES_OPTIONS = 'options';
export const REACT_TABLE_STATE_PSM_ONE_OF_FILTER_TYPE_OPTION_NAMES_VALUE = 'value';
export const REACT_TABLE_STATE_PSM_ONE_OF_FILTER_TYPE_OPTION_NAMES_LABEL = 'label';
export const REACT_TABLE_STATE_PSM_DATE_FILTER_TYPE_OPTION_NAMES_ALLOW_TIME = 'allowTime';
export const REACT_TABLE_STATE_PSM_POLYMORPH_FILTER_TYPE_OPTION_NAMES_OPTIONS = 'options';

export enum ReactTableStatePSMFilterType {
  enum = 'enum',
  oneOf = 'oneOf',
  date = 'date',
  numeric = 'numeric',
  string = 'string',
  boolean = 'boolean',
  polymorph = 'polymorph',
}

export const defaultFilterVariableNameWriter: VariableNameWriter = (generatedFunction: GeneratedClientFunctionWithNodes) =>
  constantCase(`${generatedFunction.generatedName}-Default-Filters`);

export const defaultFilterDefinitionVariableNameWriter: DefinitionVariableNameWriter = (
  generatedFunction: GeneratedClientFunctionWithNodes,
  isFunction: boolean,
) => {
  const base = `${generatedFunction.generatedName}-Filters`;

  if (isFunction) {
    return camelCase(`get-${base}`);
  }

  return pascalCase(base);
};

export const defaultFilterLabelWriter: DefinitionLabelWriter = ({ field }) => sentenceCase(field.name.split('.').pop() || field.name);

export const defaultFilterTypeReferenceWriter: DefinitionTypeReferenceWriter = (
  file: PSMTableConfigPluginFile,
  _generatedFunction: GeneratedClientFunctionWithNodes,
  fieldEnum: GeneratedSchemaWithNode<ParsedEnum>,
) => {
  file.addManualImport(
    REACT_TABLE_STATE_PSM_IMPORT_PATH,
    [REACT_TABLE_STATE_PSM_BASE_TABLE_FILTER_TYPE_NAME, REACT_TABLE_STATE_PSM_BASE_TABLE_FILTER_TYPE_TYPE_NAME],
    [REACT_TABLE_STATE_PSM_BASE_TABLE_FILTER_TYPE_NAME, REACT_TABLE_STATE_PSM_BASE_TABLE_FILTER_TYPE_TYPE_NAME],
  );

  const typeNodes: ts.TypeNode[] = [
    fieldEnum.generatedName ? factory.createTypeReferenceNode(fieldEnum.generatedName) : factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
    factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
    factory.createTypeReferenceNode(REACT_TABLE_STATE_PSM_BASE_TABLE_FILTER_TYPE_TYPE_NAME),
  ];

  return factory.createArrayTypeNode(factory.createTypeReferenceNode(REACT_TABLE_STATE_PSM_BASE_TABLE_FILTER_TYPE_NAME, typeNodes));
};

export const defaultFilterTypeDefinitionWriter: DefinitionWriter = (options) => {
  const { fieldEnum, field, labelWriter } = options;
  const keyName = fieldEnum.generatedValueNames.get(field.name);
  const idExpression = buildEnumIdExpression(fieldEnum, keyName);

  if (idExpression) {
    const typeObjectLiteralExpression = defaultTypeObjectLiteralExpressionGetter(options);

    if (typeObjectLiteralExpression) {
      const rawLabel = labelWriter(options);
      const label = (typeof rawLabel === 'string' ? factory.createStringLiteral(rawLabel, true) : rawLabel) || idExpression;

      return factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(PSM_ID_PARAMETER_NAME, idExpression),
          factory.createPropertyAssignment(PSM_LABEL_PARAMETER_NAME, label),
          factory.createPropertyAssignment(PSM_FILTER_TYPE_PARAMETER_NAME, typeObjectLiteralExpression),
        ],
        true,
      );
    }
  }

  return undefined;
};

export const defaultEnumFilterDefinitionBuilder: DefinitionWriter<ParsedEnum> = (options) => {
  const optionExpressions: ts.Expression[] = [];

  if (options.generatedFieldSchema) {
    for (const [keyName, generatedName] of options.generatedFieldSchema.generatedValueNames) {
      const matchingOption = options.generatedFieldSchema.rawSchema.enum.options.find((option) => option.name === keyName);

      if (matchingOption) {
        const value = buildEnumIdExpression(options.generatedFieldSchema, generatedName);
        const label = options.config.enumOptionLabelWriter({ ...options, field: matchingOption as ParsedEnumValueDescription<ParsedEnum> });

        if (value && label) {
          addTypeImportIfEnum(options.file, options.generatedFieldSchema);

          optionExpressions.push(
            factory.createObjectLiteralExpression([
              factory.createPropertyAssignment(REACT_TABLE_STATE_PSM_ENUM_FILTER_TYPE_OPTION_NAMES_VALUE, value),
              factory.createPropertyAssignment(
                REACT_TABLE_STATE_PSM_ENUM_FILTER_TYPE_OPTION_NAMES_LABEL,
                typeof label === 'string' ? factory.createStringLiteral(label, true) : label,
              ),
            ]),
          );
        }
      }
    }
  }

  return factory.createObjectLiteralExpression(
    [
      factory.createPropertyAssignment(
        ReactTableStatePSMFilterType.enum,
        factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(
              REACT_TABLE_STATE_PSM_ENUM_FILTER_TYPE_OPTION_NAMES_OPTIONS,
              factory.createArrayLiteralExpression(optionExpressions, true),
            ),
          ],
          true,
        ),
      ),
    ],
    true,
  );
};

export const defaultOneOfFilterDefinitionBuilder: DefinitionWriter<ParsedOneOf> = (options) => {
  const optionExpressions: ts.Expression[] = [];

  if (options.generatedFieldSchema?.derivedOneOfTypeEnum) {
    for (const [keyName, generatedName] of options.generatedFieldSchema.derivedOneOfTypeEnum.generatedValueNames) {
      const matchingOption = options.generatedFieldSchema.derivedOneOfTypeEnum.rawSchema.enum.options.find((option) => option.name === keyName);

      if (matchingOption) {
        const value = buildEnumIdExpression(options.generatedFieldSchema.derivedOneOfTypeEnum as GeneratedSchemaWithNode<ParsedEnum>, generatedName);
        const label = options.config.oneOfOptionLabelWriter({ ...options, field: matchingOption as ParsedEnumValueDescription<ParsedOneOf> });

        if (value && label) {
          addTypeImportIfEnum(options.file, options.generatedFieldSchema.derivedOneOfTypeEnum as GeneratedSchemaWithNode<ParsedEnum>);

          optionExpressions.push(
            factory.createObjectLiteralExpression([
              factory.createPropertyAssignment(REACT_TABLE_STATE_PSM_ONE_OF_FILTER_TYPE_OPTION_NAMES_VALUE, value),
              factory.createPropertyAssignment(
                REACT_TABLE_STATE_PSM_ONE_OF_FILTER_TYPE_OPTION_NAMES_LABEL,
                typeof label === 'string' ? factory.createStringLiteral(label, true) : label,
              ),
            ]),
          );
        }
      }
    }
  }

  return factory.createObjectLiteralExpression(
    [
      factory.createPropertyAssignment(
        ReactTableStatePSMFilterType.oneOf,
        factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(
              REACT_TABLE_STATE_PSM_ONE_OF_FILTER_TYPE_OPTION_NAMES_OPTIONS,
              factory.createArrayLiteralExpression(optionExpressions, true),
            ),
          ],
          true,
        ),
      ),
    ],
    true,
  );
};

export const defaultStringFilterDefinitionBuilder: DefinitionWriter<ParsedString> = () =>
  factory.createObjectLiteralExpression([
    factory.createPropertyAssignment(ReactTableStatePSMFilterType.string, factory.createObjectLiteralExpression([])),
  ]);

export const defaultKeyFilterDefinitionBuilder: DefinitionWriter<ParsedKey> = () =>
  factory.createObjectLiteralExpression([
    factory.createPropertyAssignment(ReactTableStatePSMFilterType.string, factory.createObjectLiteralExpression([])),
  ]);

export const defaultDateFilterDefinitionBuilder: DefinitionWriter<ParsedDate> = () =>
  factory.createObjectLiteralExpression(
    [
      factory.createPropertyAssignment(
        ReactTableStatePSMFilterType.date,
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment(
            REACT_TABLE_STATE_PSM_DATE_FILTER_TYPE_OPTION_NAMES_ALLOW_TIME,
            factory.createFalse(),
          ),
        ]),
      ),
    ],
    true,
  );

export const defaultTimestampFilterDefinitionBuilder: DefinitionWriter<ParsedTimestamp> = () =>
  factory.createObjectLiteralExpression(
    [
      factory.createPropertyAssignment(
        ReactTableStatePSMFilterType.date,
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment(
            REACT_TABLE_STATE_PSM_DATE_FILTER_TYPE_OPTION_NAMES_ALLOW_TIME,
            factory.createTrue(),
          ),
        ]),
      ),
    ],
    true,
  );

export const defaultDecimalFilterDefinitionBuilder: DefinitionWriter<ParsedDecimal> = () =>
  factory.createObjectLiteralExpression([
    factory.createPropertyAssignment(ReactTableStatePSMFilterType.numeric, factory.createObjectLiteralExpression([])),
  ]);

export const defaultBooleanFilterDefinitionBuilder: DefinitionWriter<ParsedBool> = () =>
  factory.createObjectLiteralExpression([
    factory.createPropertyAssignment(ReactTableStatePSMFilterType.boolean, factory.createObjectLiteralExpression([])),
  ]);

export const defaultIntegerFilterDefinitionBuilder: DefinitionWriter<ParsedInteger> = () =>
  factory.createObjectLiteralExpression([
    factory.createPropertyAssignment(ReactTableStatePSMFilterType.numeric, factory.createObjectLiteralExpression([])),
  ]);

export const defaultFloatFilterDefinitionBuilder: DefinitionWriter<ParsedFloat> = () =>
  factory.createObjectLiteralExpression([
    factory.createPropertyAssignment(ReactTableStatePSMFilterType.numeric, factory.createObjectLiteralExpression([])),
  ]);

export const defaultAnyFilterDefinitionBuilder: DefinitionWriter<ParsedAny> = (options) => {
  // const optionExpressions: ts.Expression[] = [];

  // return factory.createObjectLiteralExpression(
  //   [
  //     factory.createPropertyAssignment(
  //       ReactTableStatePSMFilterType.any,
  //       factory.createObjectLiteralExpression(
  //         [
  //           factory.createPropertyAssignment(
  //             REACT_TABLE_STATE_PSM_ANY_FILTER_TYPE_OPTION_NAMES_OPTIONS,
  //             factory.createArrayLiteralExpression(optionExpressions, true),
  //           ),
  //         ],
  //         true,
  //       ),
  //     ),
  //   ],
  //   true,
  // );

  // TODO: implement select for options

  return factory.createObjectLiteralExpression([
    factory.createPropertyAssignment(ReactTableStatePSMFilterType.string, factory.createObjectLiteralExpression([])),
  ]);
}

export const defaultPolymorphFilterDefinitionBuilder: DefinitionWriter<ParsedPolymorph> = (options) => {
  // TODO: implement select for options
  return factory.createObjectLiteralExpression([
    factory.createPropertyAssignment(ReactTableStatePSMFilterType.string, factory.createObjectLiteralExpression([])),
  ]);
}

export const defaultDefinitionWriterConfig: DefinitionWriterConfig = {
  any: defaultAnyFilterDefinitionBuilder,
  anyOptionLabelWriter: defaultAnyOptionLabelWriter,
  enum: defaultEnumFilterDefinitionBuilder,
  enumOptionLabelWriter: defaultEnumOptionLabelWriter,
  oneOf: defaultOneOfFilterDefinitionBuilder,
  oneOfOptionLabelWriter: defaultOneOfOptionLabelWriter,
  polymorph: defaultPolymorphFilterDefinitionBuilder,
  polymorphOptionLabelWriter: defaultPolymorphOptionLabelWriter,
  date: defaultDateFilterDefinitionBuilder,
  timestamp: defaultTimestampFilterDefinitionBuilder,
  decimal: defaultDecimalFilterDefinitionBuilder,
  string: defaultStringFilterDefinitionBuilder,
  key: defaultKeyFilterDefinitionBuilder,
  boolean: defaultBooleanFilterDefinitionBuilder,
  integer: defaultIntegerFilterDefinitionBuilder,
  float: defaultFloatFilterDefinitionBuilder,
};
