import {
  GeneratedClientFunctionWithNodes,
  GeneratedSchemaWithNode,
  getFullGRPCName,
  getPropertyByPath,
  Optional,
  ParsedBoolean,
  ParsedEnum,
  ParsedEnumValueDescription,
  ParsedFloat,
  ParsedInteger,
  ParsedKey,
  ParsedObject,
  ParsedOneOf,
  ParsedSchema,
  ParsedString,
  PluginBase,
  PluginConfig,
  PluginFile,
  PluginFileGeneratorConfig,
  PluginFilePostBuildHook,
  PluginFileReader,
} from '@pentops/jsonapi-jdef-ts-generator';
import { camelCase, constantCase, sentenceCase } from 'change-case';
import { match, P } from 'ts-pattern';
import { Project, SourceFile, Statement, SyntaxKind, ts } from 'ts-morph';

const { factory } = ts;

export const pluginFileReader: PluginFileReader<SourceFile> = (filePath) =>
  new Promise((resolve) => {
    resolve(new Project({ useInMemoryFileSystem: true }).addSourceFileAtPath(filePath));
  });

export const REACT_TABLE_STATE_PSM_IMPORT_PATH = '@pentops/react-table-state-psm';
export const REACT_TABLE_STATE_PSM_BASE_TABLE_FILTER_TYPE_NAME = 'BaseTableFilter';
export const REACT_TABLE_STATE_PSM_BASE_TABLE_FILTER_TYPE_TYPE_NAME = 'BaseFilterType';
export const SORTING_STATE_TYPE_NAME = 'SortingState';
export const FILTER_STATE_TYPE_NAME = 'FilterState';
export const PSM_ID_PARAMETER_NAME = 'id';
export const PSM_VALUE_PARAMETER_NAME = 'value';
export const PSM_EXACT_PARAMETER_NAME = 'exact';
export const PSM_IN_PARAMETER_NAME = 'in';
export const PSM_DESC_PARAMETER_NAME = 'desc';
export const PSM_FILTER_TYPE_PARAMETER_NAME = 'type';
export const PSM_FILTERS_PARAMETER_NAME = 'filters';
export const REACT_TABLE_STATE_PSM_ENUM_FILTER_TYPE_OPTION_NAMES_OPTIONS = 'options';
export const REACT_TABLE_STATE_PSM_ENUM_FILTER_TYPE_OPTION_NAMES_VALUE = 'value';
export const REACT_TABLE_STATE_PSM_ENUM_FILTER_TYPE_OPTION_NAMES_LABEL = 'label';
export const REACT_TABLE_STATE_PSM_ONE_OF_FILTER_TYPE_OPTION_NAMES_OPTIONS = 'options';
export const REACT_TABLE_STATE_PSM_ONE_OF_FILTER_TYPE_OPTION_NAMES_VALUE = 'value';
export const REACT_TABLE_STATE_PSM_ONE_OF_FILTER_TYPE_OPTION_NAMES_LABEL = 'label';
export const REACT_TABLE_STATE_PSM_DATE_FILTER_TYPE_OPTION_NAMES_ALLOW_TIME = 'allowTime';

export enum ReactTableStatePSMFilterType {
  enum = 'enum',
  oneOf = 'oneOf',
  date = 'date',
  numeric = 'numeric',
  string = 'string',
  boolean = 'boolean',
}

export type FilterTypeReferenceWriter = (
  file: PluginFile<SourceFile>,
  generatedFunction: GeneratedClientFunctionWithNodes,
  filterEnum: GeneratedSchemaWithNode<ParsedEnum>,
) => ts.TypeReferenceNode;

export type FilterDefinitionVariableNameWriter = (generatedFunction: GeneratedClientFunctionWithNodes, isFunction: boolean) => string;

export type VariableNameWriter = (generatedFunction: GeneratedClientFunctionWithNodes) => string;

export interface GeneratorHookOptions {
  generatedStatement: ts.VariableStatement;
  generatedFunction: GeneratedClientFunctionWithNodes;
  file: PluginFile<SourceFile>;
}

export type GeneratorHook = (options: GeneratorHookOptions) => ts.VariableStatement;

export type FilterDependencyInjectorFunction = (argumentName: string, typeReference: ts.TypeReferenceNode | string) => void;

export interface FilterTypeDefinitionWriterOptions<TFieldSchema extends ParsedSchema = ParsedSchema> {
  file: PluginFile<SourceFile>;
  generatedFunction: GeneratedClientFunctionWithNodes;
  filterEnum: GeneratedSchemaWithNode<ParsedEnum>;
  field: ParsedEnumValueDescription<TFieldSchema>;
  generatedFieldSchema: GeneratedSchemaWithNode<TFieldSchema> | undefined;
  // If dependencies are added for any filter, the resulting generated filter definition will be a getter function that accepts
  // the dependencies as arguments
  injectDependency: FilterDependencyInjectorFunction;
  config: FilterTypeDefinitionWriterConfig;
}

export type FilterTypeDefinitionWriter<TFieldSchema extends ParsedSchema = ParsedSchema> = (
  options: FilterTypeDefinitionWriterOptions<TFieldSchema>,
) => ts.ObjectLiteralExpression | undefined;

export type FilterTypeDefinitionHookOptions<TFieldSchema extends ParsedSchema = ParsedSchema> = FilterTypeDefinitionWriterOptions<TFieldSchema> & {
  generatedExpression: ts.ObjectLiteralExpression;
};

export type FilterTypeDefinitionHook = (options: FilterTypeDefinitionHookOptions) => ts.ObjectLiteralExpression | undefined;

export type FilterTypeDefinitionEnumOptionLabelWriterOptions = Omit<FilterTypeDefinitionWriterOptions<ParsedEnum>, 'config'>;

export type EnumOptionLabelWriter = (options: FilterTypeDefinitionEnumOptionLabelWriterOptions) => string | ts.Expression | undefined;

export const defaultEnumOptionLabelWriter: EnumOptionLabelWriter = ({ field }) => sentenceCase(field.name.split('.').pop() || field.name);

export type FilterTypeDefinitionOneOfOptionLabelWriterOptions = Omit<FilterTypeDefinitionWriterOptions<ParsedOneOf>, 'config'>;

export type OneOfOptionLabelWriter = (options: FilterTypeDefinitionOneOfOptionLabelWriterOptions) => string | ts.Expression | undefined;

export const defaultOneOfOptionLabelWriter: OneOfOptionLabelWriter = ({ field }) => sentenceCase(field.name.split('.').pop() || field.name);

export function buildEnumIdExpression(enumSchema: GeneratedSchemaWithNode<ParsedEnum>, keyName: string | undefined) {
  if (!keyName) {
    return undefined;
  }

  return enumSchema.node.kind === SyntaxKind.EnumDeclaration
    ? factory.createPropertyAccessExpression(factory.createIdentifier(enumSchema.generatedName), factory.createIdentifier(keyName))
    : factory.createStringLiteral(keyName);
}

export const defaultStringFilterDefinitionBuilder: FilterTypeDefinitionWriter<ParsedString> = () =>
  factory.createObjectLiteralExpression([
    factory.createPropertyAssignment(ReactTableStatePSMFilterType.string, factory.createObjectLiteralExpression([])),
  ]);

export const defaultKeyFilterDefinitionBuilder: FilterTypeDefinitionWriter<ParsedKey> = () =>
  factory.createObjectLiteralExpression([
    factory.createPropertyAssignment(ReactTableStatePSMFilterType.string, factory.createObjectLiteralExpression([])),
  ]);

export const defaultDateFilterDefinitionBuilder: FilterTypeDefinitionWriter<ParsedString> = ({ field }) =>
  factory.createObjectLiteralExpression(
    [
      factory.createPropertyAssignment(
        ReactTableStatePSMFilterType.date,
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment(
            REACT_TABLE_STATE_PSM_DATE_FILTER_TYPE_OPTION_NAMES_ALLOW_TIME,
            field.genericReferenceToSchema?.string.format === 'date-time' ? factory.createTrue() : factory.createFalse(),
          ),
        ]),
      ),
    ],
    true,
  );

export const defaultBooleanFilterDefinitionBuilder: FilterTypeDefinitionWriter<ParsedBoolean> = () =>
  factory.createObjectLiteralExpression([
    factory.createPropertyAssignment(ReactTableStatePSMFilterType.boolean, factory.createObjectLiteralExpression([])),
  ]);

export const defaultIntegerFilterDefinitionBuilder: FilterTypeDefinitionWriter<ParsedInteger> = () =>
  factory.createObjectLiteralExpression([
    factory.createPropertyAssignment(ReactTableStatePSMFilterType.numeric, factory.createObjectLiteralExpression([])),
  ]);

export const defaultFloatFilterDefinitionBuilder: FilterTypeDefinitionWriter<ParsedFloat> = () =>
  factory.createObjectLiteralExpression([
    factory.createPropertyAssignment(ReactTableStatePSMFilterType.numeric, factory.createObjectLiteralExpression([])),
  ]);

export function addTypeImportIfEnum(file: PluginFile<SourceFile>, generatedSchema: GeneratedSchemaWithNode<ParsedEnum>) {
  if (generatedSchema.node.kind === SyntaxKind.EnumDeclaration) {
    file.addGeneratedTypeImport(generatedSchema.generatedName);
  }
}

export const defaultEnumFilterDefinitionBuilder: FilterTypeDefinitionWriter<ParsedEnum> = (options) => {
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

export const defaultOneOfFilterDefinitionBuilder: FilterTypeDefinitionWriter<ParsedOneOf> = (options) => {
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

export interface FilterTypeDefinitionWriterConfig {
  enum: FilterTypeDefinitionWriter<ParsedEnum>;
  enumOptionLabelWriter: EnumOptionLabelWriter;
  oneOf: FilterTypeDefinitionWriter<ParsedOneOf>;
  oneOfOptionLabelWriter: OneOfOptionLabelWriter;
  date: FilterTypeDefinitionWriter<ParsedString>;
  string: FilterTypeDefinitionWriter<ParsedString>;
  key: FilterTypeDefinitionWriter<ParsedKey>;
  boolean: FilterTypeDefinitionWriter<ParsedBoolean>;
  integer: FilterTypeDefinitionWriter<ParsedInteger>;
  float: FilterTypeDefinitionWriter<ParsedFloat>;
}

export const defaultFilterTypeDefinitionWriterConfig: FilterTypeDefinitionWriterConfig = {
  enum: defaultEnumFilterDefinitionBuilder,
  enumOptionLabelWriter: defaultEnumOptionLabelWriter,
  oneOf: defaultOneOfFilterDefinitionBuilder,
  oneOfOptionLabelWriter: defaultOneOfOptionLabelWriter,
  date: defaultDateFilterDefinitionBuilder,
  string: defaultStringFilterDefinitionBuilder,
  key: defaultKeyFilterDefinitionBuilder,
  boolean: defaultBooleanFilterDefinitionBuilder,
  integer: defaultIntegerFilterDefinitionBuilder,
  float: defaultFloatFilterDefinitionBuilder,
};

const defaultFilterTypeDefinitionWriter: FilterTypeDefinitionWriter = (options) => {
  const { file, filterEnum, field, generatedFunction, generatedFieldSchema, injectDependency, config } = options;
  const keyName = filterEnum.generatedValueNames.get(field.name);
  const idExpression = buildEnumIdExpression(filterEnum, keyName);

  if (idExpression) {
    const typeObjectLiteralExpression = match(field)
      .returnType<ts.ObjectLiteralExpression | undefined>()
      .with({ genericReferenceToSchema: { string: P.union({ format: 'date-time' }, { format: 'date' }) } }, (f) =>
        config.date({
          file,
          generatedFunction,
          filterEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedString>,
          injectDependency,
          config,
        }),
      )
      .with({ genericReferenceToSchema: { string: P.not(P.nullish) } }, (f) =>
        config.string({
          file,
          generatedFunction,
          filterEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedString>,
          injectDependency,
          config,
        }),
      )
      .with({ genericReferenceToSchema: { key: P.not(P.nullish) } }, (f) =>
        config.key({
          file,
          generatedFunction,
          filterEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedKey>,
          injectDependency,
          config,
        }),
      )
      .with({ genericReferenceToSchema: { oneOf: P.not(P.nullish) } }, (f) =>
        config.oneOf({
          file,
          generatedFunction,
          filterEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedOneOf>,
          injectDependency,
          config,
        }),
      )
      .with({ genericReferenceToSchema: { enum: P.not(P.nullish) } }, (f) =>
        config.enum({
          file,
          generatedFunction,
          filterEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedEnum>,
          injectDependency,
          config,
        }),
      )
      .with({ genericReferenceToSchema: { boolean: P.not(P.nullish) } }, (f) =>
        config.boolean({
          file,
          generatedFunction,
          filterEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedBoolean>,
          injectDependency,
          config,
        }),
      )
      .with({ genericReferenceToSchema: { integer: P.not(P.nullish) } }, (f) =>
        config.integer({
          file,
          generatedFunction,
          filterEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedInteger>,
          injectDependency,
          config,
        }),
      )
      .with({ genericReferenceToSchema: { float: P.not(P.nullish) } }, (f) =>
        config.float({
          file,
          generatedFunction,
          filterEnum,
          field: f,
          generatedFieldSchema: generatedFieldSchema as GeneratedSchemaWithNode<ParsedFloat>,
          injectDependency,
          config,
        }),
      )
      .otherwise(() => undefined);

    if (typeObjectLiteralExpression) {
      return factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(PSM_ID_PARAMETER_NAME, idExpression),
          factory.createPropertyAssignment(PSM_FILTER_TYPE_PARAMETER_NAME, typeObjectLiteralExpression),
        ],
        true,
      );
    }
  }

  return undefined;
};

const defaultFilterTypeReferenceWriter: FilterTypeReferenceWriter = (
  file: PluginFile<SourceFile>,
  _generatedFunction: GeneratedClientFunctionWithNodes,
  filterEnum: GeneratedSchemaWithNode<ParsedEnum>,
) => {
  file.addManualImport(
    REACT_TABLE_STATE_PSM_IMPORT_PATH,
    [REACT_TABLE_STATE_PSM_BASE_TABLE_FILTER_TYPE_NAME],
    [REACT_TABLE_STATE_PSM_BASE_TABLE_FILTER_TYPE_NAME],
  );

  const typeNodes: ts.TypeNode[] = [
    filterEnum.generatedName ? factory.createTypeReferenceNode(filterEnum.generatedName) : factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
    factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
    factory.createTypeReferenceNode(REACT_TABLE_STATE_PSM_BASE_TABLE_FILTER_TYPE_TYPE_NAME),
  ];

  return factory.createTypeReferenceNode(REACT_TABLE_STATE_PSM_BASE_TABLE_FILTER_TYPE_NAME, typeNodes);
};

const defaultSortVariableNameWriter: VariableNameWriter = (generatedFunction: GeneratedClientFunctionWithNodes) =>
  constantCase(`${generatedFunction.generatedName}-Default-Sorts`);

const defaultFilterVariableNameWriter: VariableNameWriter = (generatedFunction: GeneratedClientFunctionWithNodes) =>
  constantCase(`${generatedFunction.generatedName}-Default-Filters`);

const defaultFilterDefinitionVariableNameWriter: FilterDefinitionVariableNameWriter = (
  generatedFunction: GeneratedClientFunctionWithNodes,
  isFunction: boolean,
) => {
  const base = `${generatedFunction.generatedName}-Filters`;

  return camelCase(isFunction ? `get-${base}` : base);
};

export type StatementConflictHandler = (newSource: Statement | undefined, existingSource: Statement | undefined) => Statement | undefined;

export const defaultStatementConflictHandler: StatementConflictHandler = (newSource) => newSource;

export interface PSMTablePluginConfig extends PluginConfig<SourceFile> {
  statementConflictHandler: StatementConflictHandler;
  filter: {
    afterBuildInitialValuesNodeHook?: GeneratorHook;
    afterBuildFilterTypeDefinitionHook?: FilterTypeDefinitionHook;
    definitionVariableNameWriter: FilterDefinitionVariableNameWriter;
    initialValuesVariableNameWriter: VariableNameWriter;
    typeDefinitionWriter: FilterTypeDefinitionWriter;
    typeDefinitionWriterConfig: FilterTypeDefinitionWriterConfig;
    typeReferenceWriter: FilterTypeReferenceWriter;
  };
  sort: {
    afterBuildInitialValuesNodeHook?: GeneratorHook;
    initialValuesVariableNameWriter: VariableNameWriter;
  };
}

export type PSMTablePluginFilterTypeDefinitionWriterConfigInput = Partial<FilterTypeDefinitionWriterConfig>;

export type PSMTablePluginFilterConfigInput = Optional<
  Omit<PSMTablePluginConfig['filter'], 'typeDefinitionWriterConfig'> & {
  typeDefinitionWriterConfig: PSMTablePluginFilterTypeDefinitionWriterConfigInput;
},
  'definitionVariableNameWriter' | 'initialValuesVariableNameWriter' | 'typeDefinitionWriter' | 'typeDefinitionWriterConfig' | 'typeReferenceWriter'
>;

export type PSMTablePluginSortConfigInput = Optional<PSMTablePluginConfig['sort'], 'initialValuesVariableNameWriter'>;

export type PSMTablePluginConfigInput = Optional<
  Omit<PSMTablePluginConfig, 'filter' | 'sort' | 'defaultExistingFileReader' | 'defaultFileHooks'> & {
  filter: PSMTablePluginFilterConfigInput;
  sort: PSMTablePluginSortConfigInput;
},
  'filter' | 'sort' | 'statementConflictHandler'
>;

function findMatchingVariableStatement(needle: Statement, haystack: Statement[]) {
  if (needle.isKind(SyntaxKind.VariableStatement)) {
    const needleName = needle.getDeclarations()[0]?.getName();

    for (const searchStatement of haystack) {
      if (searchStatement.isKind(SyntaxKind.VariableStatement)) {
        for (const searchDeclaration of searchStatement.getDeclarations()) {
          if (needleName === searchDeclaration.getName()) {
            return searchStatement;
          }
        }
      }
    }
  } else {
    for (const searchStatement of haystack) {
      if (needle.getText() === searchStatement.getText()) {
        return searchStatement;
      }
    }
  }

  return undefined;
}

export class PSMTableConfigPlugin extends PluginBase<SourceFile, PluginFileGeneratorConfig<SourceFile>, PSMTablePluginConfig> {
  name = 'PSMTableConfigPlugin';

  private static getPostBuildHook(baseConfig: Omit<PSMTablePluginConfig, 'defaultFileHooks'>) {
    const mergedPostBuildHook: PluginFilePostBuildHook<SourceFile> = (file, fileToWrite) => {
      const { content } = fileToWrite;

      if (!file.existingFileContent) {
        return content;
      }

      // Check for existing content and merge it with the new content
      const newFileAsSourceFile = new Project({ useInMemoryFileSystem: true }).createSourceFile(fileToWrite.fileName, content);

      const newFileStatements = newFileAsSourceFile.getStatements();
      const existingFileStatements = file.existingFileContent?.getStatements() || [];
      const handledStatements = new Set<Statement>();

      for (const newStatement of newFileStatements) {
        const existingStatement = findMatchingVariableStatement(newStatement, existingFileStatements);

        handledStatements.add(newStatement);

        if (existingStatement) {
          handledStatements.add(existingStatement);
        }

        if (newStatement.getText() !== existingStatement?.getText()) {
          const out = baseConfig.statementConflictHandler(newStatement, existingStatement);

          if (out) {
            if (out.getText() !== newStatement.getText()) {
              newStatement.replaceWithText(out.getText());
            }
          } else {
            newStatement.remove();
          }
        }
      }

      for (const existingStatement of existingFileStatements) {
        if (!handledStatements.has(existingStatement)) {
          const newStatement = findMatchingVariableStatement(existingStatement, newFileStatements);

          if (newStatement) {
            handledStatements.add(newStatement);
          }

          if (!newStatement || existingStatement.getText() !== newStatement.getText()) {
            const out = baseConfig.statementConflictHandler(newStatement, existingStatement);

            if (out) {
              if (!newStatement) {
                newFileAsSourceFile.addStatements(out.getText());
              } else if (out.getText() !== newStatement.getText()) {
                newStatement.replaceWithText(out.getText());
              }
            }
          }
        }
      }

      newFileAsSourceFile.saveSync();

      return newFileAsSourceFile.getFullText();
    };

    return mergedPostBuildHook;
  }

  private static buildConfig(config: PSMTablePluginConfigInput): PSMTablePluginConfig {
    const filterConfig = {
      ...config.filter,
      statementConflictHandler: config.statementConflictHandler || defaultStatementConflictHandler,
      definitionVariableNameWriter: config.filter?.definitionVariableNameWriter || defaultFilterDefinitionVariableNameWriter,
      initialValuesVariableNameWriter: config.filter?.initialValuesVariableNameWriter || defaultFilterVariableNameWriter,
      typeDefinitionWriter: config.filter?.typeDefinitionWriter || defaultFilterTypeDefinitionWriter,
      typeDefinitionWriterConfig: {
        ...defaultFilterTypeDefinitionWriterConfig,
        ...config.filter?.typeDefinitionWriterConfig,
      },
      typeReferenceWriter: config.filter?.typeReferenceWriter || defaultFilterTypeReferenceWriter,
    };

    const sortConfig = {
      ...config.sort,
      initialValuesVariableNameWriter: config.sort?.initialValuesVariableNameWriter || defaultSortVariableNameWriter,
    };

    const baseConfig: Omit<PSMTablePluginConfig, 'defaultFileHooks'> = {
      ...config,
      statementConflictHandler: config.statementConflictHandler || defaultStatementConflictHandler,
      defaultExistingFileReader: pluginFileReader,
      filter: filterConfig,
      sort: sortConfig,
    };

    return {
      ...baseConfig,
      defaultFileHooks: {
        postBuildHook: PSMTableConfigPlugin.getPostBuildHook(baseConfig),
      },
    };
  }

  constructor(config: PSMTablePluginConfigInput) {
    super(PSMTableConfigPlugin.buildConfig(config));
  }

  private getFieldGeneratedSchema(filterableField: ParsedEnumValueDescription, rootSchema: ParsedObject) {
    const fieldSchema = getPropertyByPath(filterableField.name, rootSchema, this.api?.schemas || new Map());
    return fieldSchema ? this.generatedSchemas.get(getFullGRPCName(fieldSchema)) : undefined;
  }

  private buildTableFilterDefinitions(file: PluginFile<SourceFile>, generatedFunction: GeneratedClientFunctionWithNodes) {
    const elements: ts.Expression[] = [];
    const filterDependencies = new Map<string, ts.TypeReferenceNode>();

    const addDependency: FilterDependencyInjectorFunction = (argumentName: string, typeReference: ts.TypeReferenceNode | string) => {
      filterDependencies.set(argumentName, typeof typeReference === 'string' ? factory.createTypeReferenceNode(typeReference) : typeReference);
    };

    if (generatedFunction.method.rootEntitySchema && generatedFunction.method.list?.filterableFields) {
      const filterTypeReference = this.pluginConfig.filter.typeReferenceWriter(
        file,
        generatedFunction,
        generatedFunction.method.list.filterableFields,
      );

      for (const filterableField of generatedFunction.method.list.filterableFields.rawSchema.enum.options) {
        const fieldGeneratedSchema = this.getFieldGeneratedSchema(filterableField, generatedFunction.method.rootEntitySchema.rawSchema);
        let filterNode = this.pluginConfig.filter.typeDefinitionWriter({
          file,
          generatedFunction,
          filterEnum: generatedFunction.method.list.filterableFields,
          field: filterableField,
          generatedFieldSchema: fieldGeneratedSchema,
          injectDependency: addDependency,
          config: this.pluginConfig.filter.typeDefinitionWriterConfig,
        });

        if (filterNode) {
          if (this.pluginConfig.filter.afterBuildFilterTypeDefinitionHook) {
            filterNode = this.pluginConfig.filter.afterBuildFilterTypeDefinitionHook({
              generatedExpression: filterNode,
              file,
              generatedFunction,
              filterEnum: generatedFunction.method.list.filterableFields,
              field: filterableField,
              generatedFieldSchema: fieldGeneratedSchema,
              injectDependency: addDependency,
              config: this.pluginConfig.filter.typeDefinitionWriterConfig,
            });
          }

          if (filterNode) {
            elements.push(filterNode);
          }
        }
      }

      let variableStatement: ts.VariableStatement | undefined;

      const isGetterFunction = filterDependencies.size > 0;
      const variableStatementName = this.pluginConfig.filter.definitionVariableNameWriter(generatedFunction, isGetterFunction);

      if (elements.length) {
        const arrayLiteralExpression = factory.createArrayLiteralExpression(elements, true);

        file.addGeneratedTypeImport(generatedFunction.method.list.filterableFields.generatedName);

        variableStatement = factory.createVariableStatement(
          [factory.createModifier(SyntaxKind.ExportKeyword)],
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                variableStatementName,
                undefined,
                filterTypeReference ? factory.createArrayTypeNode(filterTypeReference) : undefined,
                isGetterFunction
                  ? factory.createArrowFunction(
                    undefined,
                    undefined,
                    Array.from(filterDependencies).map(([argName, typeRef]) =>
                      factory.createParameterDeclaration(undefined, undefined, argName, undefined, typeRef),
                    ),
                    undefined,
                    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
                    arrayLiteralExpression,
                  )
                  : arrayLiteralExpression,
              ),
            ],
            ts.NodeFlags.Const,
          ),
        );
      }

      if (variableStatement) {
        file.addNodes(variableStatement, factory.createIdentifier('\n'));
      }
    }
  }

  private buildDefaultTableFilters(file: PluginFile<SourceFile>, generatedFunction: GeneratedClientFunctionWithNodes) {
    if (generatedFunction.method.rootEntitySchema && generatedFunction.method.list?.filterableFields) {
      const elements: ts.Expression[] = [];

      for (const filterableField of generatedFunction.method.list.filterableFields.rawSchema.enum.options) {
        const defaultFilters = generatedFunction.method.list.defaultFilters?.[filterableField.name];
        const keyName = generatedFunction.method.list.filterableFields.generatedValueNames.get(filterableField.name);
        const generatedSchemaForField = this.getFieldGeneratedSchema(filterableField, generatedFunction.method.rootEntitySchema.rawSchema);
        const builtDefaultValues: ts.Expression[] = [];
        const idPropAssignment = buildEnumIdExpression(generatedFunction.method.list.filterableFields, keyName);

        if (defaultFilters?.length && idPropAssignment) {
          const defaultFilterExpression = match(generatedSchemaForField)
            .with(
              P.union(
                { rawSchema: { string: P.not(P.nullish) } },
                { rawSchema: { integer: P.not(P.nullish) } },
                { rawSchema: { float: P.not(P.nullish) } },
              ),
              () =>
                factory.createObjectLiteralExpression([
                  factory.createPropertyAssignment(PSM_ID_PARAMETER_NAME, idPropAssignment),
                  factory.createPropertyAssignment(
                    PSM_VALUE_PARAMETER_NAME,
                    factory.createObjectLiteralExpression([
                      factory.createPropertyAssignment(
                        defaultFilters.length === 1 ? PSM_EXACT_PARAMETER_NAME : PSM_IN_PARAMETER_NAME,
                        defaultFilters.length === 1
                          ? factory.createStringLiteral(defaultFilters[0])
                          : factory.createArrayLiteralExpression(defaultFilters.map((filter) => factory.createStringLiteral(filter))),
                      ),
                    ]),
                  ),
                ]),
            )
            .with({ rawSchema: { boolean: P.not(P.nullish) } }, () =>
              factory.createObjectLiteralExpression([
                factory.createPropertyAssignment(PSM_ID_PARAMETER_NAME, idPropAssignment),
                factory.createPropertyAssignment(
                  PSM_VALUE_PARAMETER_NAME,
                  factory.createObjectLiteralExpression([
                    factory.createPropertyAssignment(
                      PSM_EXACT_PARAMETER_NAME,
                      defaultFilters[0].toLowerCase() === 'true' ? factory.createTrue() : factory.createFalse(),
                    ),
                  ]),
                ),
              ]),
            )
            .with({ rawSchema: { enum: P.not(P.nullish) } }, (s) => {
              const generatedEnum = s as GeneratedSchemaWithNode<ParsedEnum>;
              const mappedEnumAccessExpressions = defaultFilters.reduce<ts.Expression[]>((acc, curr) => {
                const enumExpression = buildEnumIdExpression(generatedEnum, generatedEnum.generatedValueNames.get(curr));

                if (enumExpression) {
                  acc.push(enumExpression);
                }

                return acc;
              }, []);

              if (mappedEnumAccessExpressions.length) {
                return factory.createObjectLiteralExpression([
                  factory.createPropertyAssignment(PSM_ID_PARAMETER_NAME, idPropAssignment),
                  factory.createPropertyAssignment(
                    PSM_VALUE_PARAMETER_NAME,
                    factory.createObjectLiteralExpression([
                      factory.createPropertyAssignment(
                        mappedEnumAccessExpressions.length === 1 ? PSM_EXACT_PARAMETER_NAME : PSM_IN_PARAMETER_NAME,
                        mappedEnumAccessExpressions.length === 1
                          ? mappedEnumAccessExpressions[0]
                          : factory.createArrayLiteralExpression(mappedEnumAccessExpressions),
                      ),
                    ]),
                  ),
                ]);
              }

              return undefined;
            })
            .with({ rawSchema: { oneOf: P.not(P.nullish) } }, (s) => {
              const generatedOneOf = s as GeneratedSchemaWithNode<ParsedOneOf>;

              const mappedOneOfEnumAccessExpressions = defaultFilters.reduce<ts.Expression[]>((acc, curr) => {
                if (generatedOneOf.derivedOneOfTypeEnum) {
                  const enumExpression = buildEnumIdExpression(
                    generatedOneOf.derivedOneOfTypeEnum as GeneratedSchemaWithNode<ParsedEnum>,
                    generatedOneOf.derivedOneOfTypeEnum.generatedValueNames.get(curr),
                  );

                  if (enumExpression) {
                    acc.push(enumExpression);
                  }
                }

                return acc;
              }, []);

              if (mappedOneOfEnumAccessExpressions.length) {
                return factory.createObjectLiteralExpression([
                  factory.createPropertyAssignment(PSM_ID_PARAMETER_NAME, idPropAssignment),
                  factory.createPropertyAssignment(
                    PSM_VALUE_PARAMETER_NAME,
                    factory.createObjectLiteralExpression([
                      factory.createPropertyAssignment(
                        mappedOneOfEnumAccessExpressions.length === 1 ? PSM_EXACT_PARAMETER_NAME : PSM_IN_PARAMETER_NAME,
                        mappedOneOfEnumAccessExpressions.length === 1
                          ? mappedOneOfEnumAccessExpressions[0]
                          : factory.createArrayLiteralExpression(mappedOneOfEnumAccessExpressions),
                      ),
                    ]),
                  ),
                ]);
              }

              return undefined;
            })
            .otherwise(() => undefined);

          if (defaultFilterExpression) {
            builtDefaultValues.push(defaultFilterExpression);
          }
        }

        if (builtDefaultValues.length && keyName) {
          elements.push(
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  PSM_FILTER_TYPE_PARAMETER_NAME,
                  factory.createObjectLiteralExpression(
                    [factory.createPropertyAssignment(PSM_FILTERS_PARAMETER_NAME, factory.createArrayLiteralExpression(builtDefaultValues))],
                    true,
                  ),
                ),
              ],
              true,
            ),
          );
        }
      }

      const variableStatementName = this.pluginConfig.filter.initialValuesVariableNameWriter(generatedFunction);

      if (elements.length) {
        // Import the enum to reference it
        file.addGeneratedTypeImport(generatedFunction.method.list.filterableFields.generatedName);
        file.addManualImport(REACT_TABLE_STATE_PSM_IMPORT_PATH, [FILTER_STATE_TYPE_NAME], [FILTER_STATE_TYPE_NAME]);

        let variableStatement = factory.createVariableStatement(
          [factory.createModifier(SyntaxKind.ExportKeyword)],
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                variableStatementName,
                undefined,
                factory.createTypeReferenceNode(FILTER_STATE_TYPE_NAME, [
                  factory.createTypeReferenceNode(generatedFunction.method.list.filterableFields.generatedName),
                ]),
                factory.createArrayLiteralExpression(elements, true),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        );

        if (this.pluginConfig.filter.afterBuildInitialValuesNodeHook) {
          variableStatement = this.pluginConfig.filter.afterBuildInitialValuesNodeHook({
            generatedStatement: variableStatement,
            generatedFunction,
            file,
          });
        }

        if (variableStatement) {
          file.addNodes(variableStatement, factory.createIdentifier('\n'));
        }
      }
    }
  }

  private buildDefaultTableSorts(file: PluginFile<SourceFile>, generatedFunction: GeneratedClientFunctionWithNodes) {
    if (generatedFunction.method.rootEntitySchema && generatedFunction.method.list?.sortableFields) {
      const elements: ts.Expression[] = [];

      for (const sortableField of generatedFunction.method.list.sortableFields.rawSchema.enum.options) {
        const defaultSorts = generatedFunction.method.list.defaultSorts?.[sortableField.name];
        const keyName = generatedFunction.method.list.sortableFields.generatedValueNames.get(sortableField.name);
        const idPropAssignment = buildEnumIdExpression(generatedFunction.method.list.sortableFields, keyName);

        if (defaultSorts !== undefined && idPropAssignment) {
          elements.push(
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(PSM_ID_PARAMETER_NAME, idPropAssignment),
                factory.createPropertyAssignment(PSM_DESC_PARAMETER_NAME, defaultSorts === 'desc' ? factory.createTrue() : factory.createFalse()),
              ],
              true,
            ),
          );
        }
      }

      const variableStatementName = this.pluginConfig.sort.initialValuesVariableNameWriter(generatedFunction);

      if (elements.length) {
        // Import the enum to reference it
        file.addGeneratedTypeImport(generatedFunction.method.list.sortableFields.generatedName);
        file.addManualImport(REACT_TABLE_STATE_PSM_IMPORT_PATH, [SORTING_STATE_TYPE_NAME], [SORTING_STATE_TYPE_NAME]);

        let variableStatement = factory.createVariableStatement(
          [factory.createModifier(SyntaxKind.ExportKeyword)],
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                variableStatementName,
                undefined,
                factory.createTypeReferenceNode(SORTING_STATE_TYPE_NAME, [
                  factory.createTypeReferenceNode(generatedFunction.method.list.sortableFields.generatedName),
                ]),
                factory.createArrayLiteralExpression(elements, true),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        );

        if (this.pluginConfig.sort.afterBuildInitialValuesNodeHook) {
          variableStatement = this.pluginConfig.sort.afterBuildInitialValuesNodeHook({
            generatedStatement: variableStatement,
            generatedFunction,
            file,
          });
        }

        if (variableStatement) {
          file.addNodes(variableStatement, factory.createIdentifier('\n'));
        }
      }
    }
  }

  async run() {
    for (const file of this.files) {
      for (const generatedFunction of this.generatedClientFunctions) {
        if (file.isFileForGeneratedClientFunction(generatedFunction)) {
          this.buildDefaultTableSorts(file, generatedFunction);
          // this.buildDefaultTableFilters(file, generatedFunction);
          // this.buildTableFilterDefinitions(file, generatedFunction);
        }
      }

      if (file.getHasContent()) {
        file.generateHeading();
      }
    }
  }
}
