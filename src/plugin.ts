import {
  GeneratedClientFunctionWithNodes,
  GeneratedSchemaWithNode,
  getFullGRPCName,
  getPropertyByPath,
  ParsedEnum,
  ParsedEnumValueDescription,
  ParsedObject,
  ParsedOneOf,
  BasePlugin,
  GeneratorFileReader,
  IWritableFile,
  PluginEventHandlers,
} from '@pentops/jsonapi-jdef-ts-generator';
import { match, P } from 'ts-pattern';
import { Project, SourceFile, Statement, SyntaxKind, ts } from 'ts-morph';
import {
  defaultDefinitionWriterConfig,
  defaultFilterDefinitionVariableNameWriter,
  defaultFilterLabelWriter,
  defaultFilterTypeDefinitionWriter,
  defaultFilterTypeReferenceWriter,
  defaultFilterVariableNameWriter,
  FILTER_STATE_TYPE_NAME,
  PSM_EXACT_PARAMETER_NAME,
  PSM_FILTER_TYPE_PARAMETER_NAME,
  PSM_FILTERS_PARAMETER_NAME,
  PSM_IN_PARAMETER_NAME,
  PSM_VALUE_PARAMETER_NAME,
} from './filter';
import {
  buildEnumIdExpression,
  defaultStatementConflictHandler,
  DependencyInjectorFunction,
  PSM_ID_PARAMETER_NAME,
  PSMTablePluginConfig,
  PSMTablePluginConfigInput,
  REACT_TABLE_STATE_PSM_IMPORT_PATH,
} from './shared';
import {
  defaultSearchDefinitionVariableNameWriter,
  defaultSearchLabelWriter,
  defaultSearchTypeDefinitionWriter,
  defaultSearchTypeReferenceWriter,
} from './search';
import { defaultSortVariableNameWriter, PSM_DESC_PARAMETER_NAME, SORTING_STATE_TYPE_NAME } from './sort';
import { PSMTableConfigPluginFile, PSMTableConfigPluginFileConfig } from './plugin-file';
import type { IPluginRunOutput } from '@pentops/jsonapi-jdef-ts-generator/dist/plugin/types';

const { factory } = ts;

export const pluginFileReader: GeneratorFileReader<SourceFile> = async (filePath) => {
  try {
    return new Project({ useInMemoryFileSystem: true }).addSourceFileAtPath(filePath);
  } catch {
    return undefined;
  }
};

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

export class PSMTableConfigPlugin extends BasePlugin<SourceFile, PSMTableConfigPluginFileConfig, PSMTableConfigPluginFile, PSMTablePluginConfig> {
  name = 'PSMTableConfigPlugin';

  private static getPostBuildHook(baseConfig: Omit<PSMTablePluginConfig, 'hooks'>) {
    const mergedPostBuildHook: PluginEventHandlers<PSMTableConfigPluginFile>['postBuildFile'] = async ({ file, builtFile }) => {
      const { content } = builtFile;

      const existingFileContent = (await file.pollForExistingFileContent())?.content;

      if (!existingFileContent) {
        return content;
      }

      // Check for existing content and merge it with the new content
      const newFileAsSourceFile = new Project({ useInMemoryFileSystem: true }).createSourceFile(builtFile.fileName, content);

      const newFileStatements = newFileAsSourceFile.getStatements();
      const existingFileStatements = existingFileContent.getStatements() || [];
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
    const filterConfig: PSMTablePluginConfig['filter'] = {
      ...config.filter,
      definitionVariableNameWriter: config.filter?.definitionVariableNameWriter || defaultFilterDefinitionVariableNameWriter,
      initialValuesVariableNameWriter: config.filter?.initialValuesVariableNameWriter || defaultFilterVariableNameWriter,
      typeDefinitionWriter: config.filter?.typeDefinitionWriter || defaultFilterTypeDefinitionWriter,
      typeDefinitionWriterConfig: {
        ...defaultDefinitionWriterConfig,
        ...config.filter?.typeDefinitionWriterConfig,
      },
      typeReferenceWriter: config.filter?.typeReferenceWriter || defaultFilterTypeReferenceWriter,
      labelWriter: config.filter?.labelWriter || defaultFilterLabelWriter,
    };

    const searchConfig: PSMTablePluginConfig['search'] = {
      ...config.search,
      definitionVariableNameWriter: config.search?.definitionVariableNameWriter || defaultSearchDefinitionVariableNameWriter,
      typeDefinitionWriter: config.search?.typeDefinitionWriter || defaultSearchTypeDefinitionWriter,
      typeDefinitionWriterConfig: {
        ...defaultDefinitionWriterConfig,
        ...config.search?.typeDefinitionWriterConfig,
      },
      typeReferenceWriter: config.search?.typeReferenceWriter || defaultSearchTypeReferenceWriter,
      labelWriter: config.search?.labelWriter || defaultSearchLabelWriter,
    };

    const sortConfig: PSMTablePluginConfig['sort'] = {
      ...config.sort,
      initialValuesVariableNameWriter: config.sort?.initialValuesVariableNameWriter || defaultSortVariableNameWriter,
    };

    const baseConfig: Omit<PSMTablePluginConfig, 'defaultFileHooks'> = {
      ...config,
      statementConflictHandler: config.statementConflictHandler || defaultStatementConflictHandler,
      defaultExistingFileReader: pluginFileReader,
      filter: filterConfig,
      search: searchConfig,
      sort: sortConfig,
    };

    return {
      ...baseConfig,
      hooks: {
        ...(baseConfig.hooks || {}),
        postBuildFile: PSMTableConfigPlugin.getPostBuildHook(baseConfig),
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

  private buildTableSearchFieldDefinitions(file: PSMTableConfigPluginFile, generatedFunction: GeneratedClientFunctionWithNodes) {
    const elements: ts.Expression[] = [];
    const searchDependencies = new Map<string, ts.TypeReferenceNode>();

    const addDependency: DependencyInjectorFunction = (argumentName: string, typeReference: ts.TypeReferenceNode | string) => {
      searchDependencies.set(argumentName, typeof typeReference === 'string' ? factory.createTypeReferenceNode(typeReference) : typeReference);
    };

    if (generatedFunction.method.rootEntitySchema && generatedFunction.method.list?.searchableFields) {
      for (const searchableField of generatedFunction.method.list.searchableFields.rawSchema.enum.options) {
        const fieldGeneratedSchema = this.getFieldGeneratedSchema(searchableField, generatedFunction.method.rootEntitySchema.rawSchema);
        let searchNode = this.pluginConfig.search.typeDefinitionWriter({
          file,
          generatedFunction,
          fieldEnum: generatedFunction.method.list.searchableFields,
          field: searchableField,
          generatedFieldSchema: fieldGeneratedSchema,
          injectDependency: addDependency,
          config: this.pluginConfig.search.typeDefinitionWriterConfig,
          labelWriter: this.pluginConfig.search.labelWriter,
        });

        if (searchNode) {
          if (this.pluginConfig.search.afterBuildDefinitionHook) {
            searchNode = this.pluginConfig.search.afterBuildDefinitionHook({
              generatedExpression: searchNode,
              file,
              generatedFunction,
              fieldEnum: generatedFunction.method.list.searchableFields,
              field: searchableField,
              generatedFieldSchema: fieldGeneratedSchema,
              injectDependency: addDependency,
              config: this.pluginConfig.search.typeDefinitionWriterConfig,
              labelWriter: this.pluginConfig.search.labelWriter,
            });
          }

          if (searchNode) {
            elements.push(searchNode);
          }
        }
      }

      let variableStatement: ts.VariableStatement | undefined;

      const isGetterFunction = searchDependencies.size > 0;
      const variableStatementName = this.pluginConfig.search.definitionVariableNameWriter(generatedFunction, isGetterFunction);

      if (elements.length) {
        const arrayLiteralExpression = factory.createArrayLiteralExpression(elements, true);

        file.addGeneratedTypeImport(generatedFunction.method.list.searchableFields.generatedName);
        const searchTypeReference = this.pluginConfig.search.typeReferenceWriter(
          file,
          generatedFunction,
          generatedFunction.method.list.searchableFields,
        );

        const searchDependencyParameters = Array.from(searchDependencies).map(([argName, typeRef]) =>
          factory.createParameterDeclaration(undefined, undefined, argName, undefined, typeRef),
        );

        variableStatement = factory.createVariableStatement(
          [factory.createModifier(SyntaxKind.ExportKeyword)],
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                variableStatementName,
                undefined,
                isGetterFunction ? factory.createFunctionTypeNode(undefined, searchDependencyParameters, searchTypeReference) : searchTypeReference,
                isGetterFunction
                  ? factory.createArrowFunction(
                      undefined,
                      undefined,
                      searchDependencyParameters,
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

  private buildTableFilterDefinitions(file: PSMTableConfigPluginFile, generatedFunction: GeneratedClientFunctionWithNodes) {
    const elements: ts.Expression[] = [];
    const filterDependencies = new Map<string, ts.TypeReferenceNode>();

    const addDependency: DependencyInjectorFunction = (argumentName: string, typeReference: ts.TypeReferenceNode | string) => {
      filterDependencies.set(argumentName, typeof typeReference === 'string' ? factory.createTypeReferenceNode(typeReference) : typeReference);
    };

    if (generatedFunction.method.rootEntitySchema && generatedFunction.method.list?.filterableFields) {
      for (const filterableField of generatedFunction.method.list.filterableFields.rawSchema.enum.options) {
        const fieldGeneratedSchema = this.getFieldGeneratedSchema(filterableField, generatedFunction.method.rootEntitySchema.rawSchema);
        let filterNode = this.pluginConfig.filter.typeDefinitionWriter({
          file,
          generatedFunction,
          fieldEnum: generatedFunction.method.list.filterableFields,
          field: filterableField,
          generatedFieldSchema: fieldGeneratedSchema,
          injectDependency: addDependency,
          config: this.pluginConfig.filter.typeDefinitionWriterConfig,
          labelWriter: this.pluginConfig.filter.labelWriter,
        });

        if (filterNode) {
          if (this.pluginConfig.filter.afterBuildDefinitionHook) {
            filterNode = this.pluginConfig.filter.afterBuildDefinitionHook({
              generatedExpression: filterNode,
              file,
              generatedFunction,
              fieldEnum: generatedFunction.method.list.filterableFields,
              field: filterableField,
              generatedFieldSchema: fieldGeneratedSchema,
              injectDependency: addDependency,
              config: this.pluginConfig.filter.typeDefinitionWriterConfig,
              labelWriter: this.pluginConfig.filter.labelWriter,
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
        const filterTypeReference = this.pluginConfig.filter.typeReferenceWriter(
          file,
          generatedFunction,
          generatedFunction.method.list.filterableFields,
        );

        const filterDependencyParameters = Array.from(filterDependencies).map(([argName, typeRef]) =>
          factory.createParameterDeclaration(undefined, undefined, argName, undefined, typeRef),
        );

        variableStatement = factory.createVariableStatement(
          [factory.createModifier(SyntaxKind.ExportKeyword)],
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                variableStatementName,
                undefined,
                isGetterFunction ? factory.createFunctionTypeNode(undefined, filterDependencyParameters, filterTypeReference) : filterTypeReference,
                isGetterFunction
                  ? factory.createArrowFunction(
                      undefined,
                      undefined,
                      filterDependencyParameters,
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

  private buildDefaultTableFilters(file: PSMTableConfigPluginFile, generatedFunction: GeneratedClientFunctionWithNodes) {
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
            .with({ rawSchema: { bool: P.not(P.nullish) } }, () =>
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

  private buildDefaultTableSorts(file: PSMTableConfigPluginFile, generatedFunction: GeneratedClientFunctionWithNodes) {
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

  async run(): Promise<IPluginRunOutput<PSMTableConfigPluginFile>> {
    for (const file of this.files) {
      for (const generatedFunction of this.generatedClientFunctions) {
        if (file.isFileForGeneratedClientFunction(generatedFunction)) {
          this.buildDefaultTableSorts(file, generatedFunction);
          this.buildTableSearchFieldDefinitions(file, generatedFunction);
          this.buildDefaultTableFilters(file, generatedFunction);
          this.buildTableFilterDefinitions(file, generatedFunction);
        }
      }

      if (file.getHasContent()) {
        file.generateHeading();
      }
    }

    const out = await this.buildFiles();

    return {
      files: out.reduce<IWritableFile<SourceFile>[]>((acc, curr) => (curr ? [...acc, curr] : acc), []),
    };
  }
}
