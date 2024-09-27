import { BasePluginFile, IPluginFileConfig } from '@pentops/jsonapi-jdef-ts-generator';
import { SourceFile } from 'ts-morph';
import { PSMTableConfigPlugin } from './plugin';

export type PSMTableConfigPluginFileConfig = IPluginFileConfig<SourceFile>;

export class PSMTableConfigPluginFile extends BasePluginFile<SourceFile, PSMTableConfigPluginFileConfig, PSMTableConfigPlugin> {}
