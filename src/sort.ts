import { GeneratedClientFunctionWithNodes } from '@pentops/jsonapi-jdef-ts-generator';
import { constantCase } from 'change-case';
import { VariableNameWriter } from './shared';

export const SORTING_STATE_TYPE_NAME = 'SortingState';
export const PSM_DESC_PARAMETER_NAME = 'desc';

export const defaultSortVariableNameWriter: VariableNameWriter = (generatedFunction: GeneratedClientFunctionWithNodes) =>
  constantCase(`${generatedFunction.generatedName}-Default-Sorts`);
