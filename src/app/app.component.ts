import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import "flex-layout-system";
import { EditorComponent } from './components/editor/editor.component';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem, MessageService } from 'primeng/api';
import { JsonEditorComponent } from './components/json-editor/json-editor.component';
import { OutputEnumDTO, OutputFieldDTO, OutputModelDTO, OutputSchemaDTO } from '../generated/openapi';
import { CardModule } from 'primeng/card';
import { ListItem, ModelField, ModelType, parseDtoSchema, PrismaClassDTOGeneratorConfig } from './dto-parser';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectChangeEvent, SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { FieldComponent } from './components/field/field.component';
import { MultiSelectChangeEvent, MultiSelectModule } from 'primeng/multiselect';
import { AccordionModule } from 'primeng/accordion';
import { ToastModule } from 'primeng/toast';


@Component({
  selector: 'app-root',
  imports: [
    InputTextModule,
    CheckboxModule,
    SelectModule,
    DialogModule,
    MultiSelectModule,
    FormsModule,
    AccordionModule,
    AutoCompleteModule,
    FieldComponent,
    ToastModule,
    EditorComponent, ButtonModule, CardModule, MenubarModule, JsonEditorComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [MessageService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(private messageService: MessageService) {

  }
  @ViewChild(JsonEditorComponent) jsonEditor!: JsonEditorComponent;
  title = 'app';
  activeItemId: string = '1';

  prismaSchema: string = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}`;
  dtoSchema: string = "";

  modelTypes: Array<string> = ['input', 'output'];

  extraModelTypeChanged(model: ModelType) {
    this.jsonEditor.updateExtraModel(model.name, (m => {
      m.type = model.type;
      return m;
    }));
  }

  extraEnums: Array<OutputEnumDTO> = [];
  extraModels: Array<ModelType> = [];

  get allEnums() {
    const extraEnums = this.extraEnums.map((e) => e.name) || [];
    const prismaEnums = this.prismaData?.enums?.map((e) => e.name) || [];
    const enums = new Set([...extraEnums, ...prismaEnums]);
    return Array.from(enums);
  }

  inputModelsFilter: string = "";
  outputModelsFilter: string = "";

  excludeFieldsInput: Array<string> = [];
  excludeFieldsOutput: Array<string> = [];

  onExcludeOutputFieldsChanged(e: Array<string>) {
    this.excludeFieldsOutput = e;
    this.jsonEditor.updateSourceSchema(schema => {
      return {
        ...schema,
        output: {
          ...schema.output,
          excludeFields: e
        }
      };
    });
  }

  onExcludeInputFieldsChanged(e: Array<string>) {
    this.excludeFieldsInput = e;
    this.jsonEditor.updateSourceSchema(schema => {
      return {
        ...schema,
        input: {
          ...schema.input,
          excludeFields: e
        }
      };
    });
  }

  excludeModelsInput: Array<string> = [];
  excludeModelsOutput: Array<string> = [];

  removeInputField(model: ModelType, field: ModelField) {
    this.jsonEditor.removeInputModelField(model.name, field.name);
  }
  removeOutputField(model: ModelType, field: ModelField) {
    this.jsonEditor.removeOutputModelField(model.name, field.name);
  }

  useModel(model: ModelType, type: 'input' | 'output') {
    if (type === 'input') {
      this.jsonEditor.addInputModel(model);
    } else {
      this.jsonEditor.addOutputModel(model);
    }
  }
  updateInputField(model: ModelType, field: ModelField) {
    this.jsonEditor.updateInputModelField(model.name, field);
  }
  updateOutputField(model: ModelType, field: ModelField) {
    this.jsonEditor.updateOutputModelField(model.name, field);
  }
  removeInputModel(model: ModelType) {
    this.jsonEditor.removeInputModel(model.name);
  }
  removeOutputModel(model: ModelType) {
    this.jsonEditor.removeOutputModel(model.name);
  }
  get avialableModels() {
    const excludeModels = this.dtoData?.excludeModels || [];
    return this.prismaModels.filter((m) => !excludeModels.includes(m.name));
  }
  get modelsCanBeAddedToInput() {
    const allModels = this.avialableModels;
    const excludeModels = this.dtoData?.input?.excludeModels || [];
    const usageModels = this.inputModels.map((m) => m.name);
    return allModels.filter((m) => !excludeModels.includes(m.name) && !usageModels.includes(m.name));
  }
  get modelsCanBeAddedToOutput() {
    const allModels = this.avialableModels;
    const excludeModels = this.dtoData?.output?.excludeModels || [];
    const usageModels = this.outputModels.map((m) => m.name);
    return allModels.filter((m) => !excludeModels.includes(m.name) && !usageModels.includes(m.name));
  }

  showAddListDialog: boolean = false;
  newListName: string | null = null;

  addFilterFieldToList(list: ListItem) {
    this.currentListItem = list;
    this.showAddFieldDialog = true;
  }
  toAddList() {
    this.showAddListDialog = true;
  }
  addList(e: Event) {
    e?.preventDefault();
    if (this.newListName) {
      const prev = this.lists.find((l) => l.modelName?.toLowerCase() === this.newListName?.toLowerCase());
      if (prev) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'List with this name already exists' });
        return;
      }
      this.jsonEditor.createEmptyList(this.newListName);
      this.newListName = "";
      this.showAddListDialog = false;
    }
  }
  listFieldUpdated(item: ListItem) {
    this.jsonEditor.updateList(item);
  }
  removeListFilter(item: ListItem, field: ModelField) {
    this.jsonEditor.deleteListFilter(item.modelName!, field.name);
  }
  orderableListChanged(e: Array<string>, item: ListItem) {
    item.orderableList = e || [];
    this.listFieldUpdated(item);
  }
  removeList(item: ListItem) {
    this.jsonEditor.deleteList(item.modelName!);
  }

  get extraModelNames() {
    return this.extraModels.map((m) => m.name);
  }
  get avialableInputModelNames() {
    const allModels = this.avialableModels;
    const excludeModels = this.dtoData?.input?.excludeModels || [];
    return allModels.filter((m) => !excludeModels.includes(m.name))?.map(e => e.name);
  }
  get avialableOutputModelNames() {
    const allModels = this.avialableModels;
    const excludeModels = this.dtoData?.output?.excludeModels || [];
    return allModels.filter((m) => !excludeModels.includes(m.name))?.map(e => e.name);
  }

  get avialableListModels() {
    const allModels = this.avialableModels?.map((m) => m.name);
    const excludeModels = this.dtoData?.output?.excludeModels || [];
    const models = allModels.filter((m) => !excludeModels.includes(m))?.map(e => `Output${e}`);
    const extraModels = this.extraModels.map((m) => m.name);
    const merged = new Set([...models, ...extraModels]);
    return Array.from(merged);
  }

  get makeFieldsOptionalInput() {
    return this.dtoData?.input?.makeFieldsOptional ?? false;
  }
  set makeFieldsOptionalInput(value: boolean) {
    if (!this.dtoData!.input) {
      this.dtoData!.input = {};
    }
    this.dtoData!.input.makeFieldsOptional = value;
    this.jsonEditor.updateSourceSchema(schema => {
      return {
        ...schema,
        input: {
          ...schema.input,
          makeFieldsOptional: value
        }
      };
    });
  }
  get includeRelationsInput() {
    return this.dtoData?.input?.includeRelations ?? false;
  }
  set includeRelationsInput(value: boolean) {
    if (!this.dtoData!.input) {
      this.dtoData!.input = {};
    }
    this.dtoData!.input.includeRelations = value;
    this.jsonEditor.updateSourceSchema(schema => {
      return {
        ...schema,
        input: {
          ...schema.input,
          includeRelations: value
        }
      };
    });
  }

  get makeFieldsOptionalOutput() {
    return this.dtoData?.output?.makeFieldsOptional ?? false;
  }
  set makeFieldsOptionalOutput(value: boolean) {
    if (!this.dtoData!.output) {
      this.dtoData!.output = {};
    }
    this.dtoData!.output.makeFieldsOptional = value;
    this.jsonEditor.updateSourceSchema(schema => {
      return {
        ...schema,
        output: {
          ...schema.output,
          makeFieldsOptional: value
        }
      };
    });
  }
  get includeRelationsOutput() {
    return this.dtoData?.output?.includeRelations ?? false;
  }
  set includeRelationsOutput(value: boolean) {
    if (!this.dtoData!.output) {
      this.dtoData!.output = {};
    }
    this.dtoData!.output.includeRelations = value;
    this.jsonEditor.updateSourceSchema(schema => {
      return {
        ...schema,
        output: {
          ...schema.output,
          includeRelations: value
        }
      };
    });
  }

  get skipExtraPrefix() {
    return this.dtoData?.extra?.options?.skipExtraPrefix ?? false;
  }
  set skipExtraPrefix(value: boolean) {
    if (!this.dtoData!.extra) {
      this.dtoData!.extra = {};
    }
    if (!this.dtoData!.extra!.options) {
      this.dtoData!.extra!.options = {};
    }
    this.dtoData!.extra.options.skipExtraPrefix = value;
    this.jsonEditor.updateExtraOptions({ skipExtraPrefix: value });
  }
  get strictMode() {
    return this.dtoData?.strictMode ?? false;
  }
  set strictMode(value: boolean) {
    this.dtoData!.strictMode = value;
    this.jsonEditor.updateSourceSchema(schema => {
      return {
        ...schema,
        strictMode: value
      };
    });
  }
  prismaData: OutputSchemaDTO | null = null;
  dtoData: PrismaClassDTOGeneratorConfig | null = null;
  inputModels: Array<ModelType> = [];
  outputModels: Array<ModelType> = [];
  get filteredOutputModels() {
    return this.outputModels.filter((m) => m.name.toLowerCase().includes(this.outputModelsFilter.toLowerCase()));
  }
  get filteredInputModels() {
    return this.inputModels.filter((m) => m.name.toLowerCase().includes(this.inputModelsFilter.toLowerCase()));
  }
  lists: Array<ListItem> = [];
  newFieldToModel: ModelType | null = null;
  newFieldToModelType: 'extra' | 'input' | 'output' = 'extra';
  toAddField(model: ModelType, type: 'extra' | 'input' | 'output') {
    this.newFieldToModelType = type;
    this.newFieldToModel = model;
    this.showAddFieldDialog = true;
  }

  currentListItem: ListItem | null = null;
  newFieldName: string = "";
  dublicateField: ModelField | null = null;
  dublicateFieldFromModelType: string = "";
  dubplicateFieldFromOptions: Array<string> = ['extra', 'prisma'];
  showAddFieldDialog: boolean = false;
  dublicateFieldFromModel: ModelType | null = null;

  addListField(e: Event) {
    e?.preventDefault();
    const validName = /^[A-z0-9_]+$/;
    if (!validName.test(this.newFieldName)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid field name' });
      return;
    }
    if (this.currentListItem?.filters?.find((f) => f.name === this.newFieldName)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Field with this name already exists' });
      return;
    }
    const field: Partial<ModelField> = (this.dublicateField && this.dublicateFieldFromModel) ? this.dublicateField : {
      name: this.newFieldName,
      type: 'String',
      isRequired: false,
      isList: false,
      isExtra: false
    };
    field.name = this.newFieldName;

    const subbportTypes = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Enum'];
    if (!subbportTypes.includes(field.type!)) {
      field.type = 'String';
    }

    this.jsonEditor.addFilterFieldToList(this.currentListItem!.modelName!, field as ModelField);
    this.newFieldName = "";
    this.currentListItem = null;
    this.showAddFieldDialog = false
  }
  updateListFilter(field: ModelField, item: ListItem) {
    this.jsonEditor.updateListFilter(item.modelName!, field);
  }
  resetNewFieldDialogFields() {
    this.newFieldName = "";
    this.currentListItem = null;
    this.newFieldToModel = null;
    this.dublicateFieldFromModelType = "";
    this.dublicateFieldFromModel = null;
    this.dublicateField = null;
    this.showAddFieldDialog = false;
  }
  addModelField(e: Event) {
    e?.preventDefault();
    const validName = /^[A-z0-9_]+$/;
    if (!validName.test(this.newFieldName)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid field name' });
      return;
    }
    if (this.newFieldToModel?.fields?.find((f) => f.name === this.newFieldName)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Field with this name already exists' });
      return
    }
    if (this.newFieldToModelType === 'input') {
      const excludeFields = this.dtoData?.input?.excludeFields || [];
      if (excludeFields.includes(this.newFieldName)) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Field with this name is excluded' });
        return;
      }
    }
    if (this.newFieldToModelType === 'output') {
      const excludeFields = this.dtoData?.output?.excludeFields || [];
      if (excludeFields.includes(this.newFieldName)) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Field with this name is excluded' });
        return
      }
    }
    const field: Partial<ModelField> = (this.dublicateField && this.dublicateFieldFromModel) ? this.dublicateField : {
      name: this.newFieldName,
      type: 'String',
      isRequired: false,
      isList: false,
      isExtra: false
    };
    const subbportTypes = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Enum', 'File', 'Relation'];
    if (!subbportTypes.includes(field.type!)) {
      field.type = 'String';
    }
    field.name = this.newFieldName;
    if (this.newFieldToModelType === 'extra') {
      this.jsonEditor.addFieldToExtraModel(this.newFieldToModel!.name, field as ModelField);
    } else if (this.newFieldToModelType === 'input') {
      this.jsonEditor.addInputModelField(this.newFieldToModel!.name, field as ModelField);
    } else {
      this.jsonEditor.addOutputModelField(this.newFieldToModel!.name, field as ModelField);
    }
    this.newFieldName = "";
    this.dublicateField = null;
    this.dublicateFieldFromModel = null;
    this.showAddFieldDialog = false
    this.dublicateFieldFromModelType = "";

  }
  get dubplicateFieldFromModels() {
    if (!this.dublicateFieldFromModelType) {
      return [];
    }
    return this.dublicateFieldFromModelType == 'extra' ? this.extraModels : this.prismaModels;
  }
  get dubplicateFieldOptions() {
    if (this.dublicateFieldFromModel) {
      return this.dublicateFieldFromModel?.fields || [];
    }
    return [];
  }
  dublicateFieldChanged(e: SelectChangeEvent) {
    const field = e.value as ModelField;
    if (!this.newFieldName) {
      this.newFieldName = field.name;
    }
  }

  newModelName: string = "";
  showAddEnumDialog: boolean = false;

  showAddModelDialog: boolean = false;

  newModelType: 'input' | 'output' = 'input';
  toAddModel() {
    this.showAddModelDialog = true;
  }
  addModel(e: Event) {
    e?.preventDefault();
    const validName = /^[A-z0-9_]+$/;
    if (!validName.test(this.newModelName)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid model name' });
      return;
    }
    const prevModels = this.extraModels.map((m) => m.name)?.map((m) => m.trim().toLowerCase());
    if (prevModels.includes(this.newModelName?.toLowerCase())) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Model with this name already exists' });
      return;
    }
    this.jsonEditor.addExtraModel(this.newModelName, this.newModelType);
    this.newModelName = "";
    this.showAddModelDialog = false;
    this.newModelType = 'input';
  }


  newEnumName: string = "";
  newEnumValues: Array<string> = [];

  addEnum(e: Event) {
    e?.preventDefault();
    const prevEnums = this.extraEnums.map((e) => e.name)?.map((e) => e.trim().toLowerCase());
    const validName = /^[A-z0-9_]+$/;
    if (!validName.test(this.newEnumName)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid enum name' });
      return;
    }
    if (prevEnums.indexOf(this.newEnumName?.toLowerCase()) > -1) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Enum with this name already exists' });
      return;
    }
    this.jsonEditor.setEnum(this.newEnumName, this.newEnumValues);
    this.newEnumName = "";
    this.newEnumValues = [];
    this.showAddEnumDialog = false;
  }
  removeExtraModel(model: ModelType) {
    this.jsonEditor.deleteExtraModel(model.name);
  }
  onSelectEnums() {
    setTimeout(() => {
      this.newEnumValues = this.newEnumValues.map((v) => v.trim()?.toUpperCase()?.replace(/[^A-Z0-9_]/g, '_'))?.filter((v) => v?.length > 0);
    }, 50);
  }
  onEnumUpdate(enumEm: OutputEnumDTO) {
    setTimeout(() => {
      enumEm.values = enumEm.values.map((v) => v.trim()?.toUpperCase()?.replace(/[^A-Z0-9_]/g, '_'))?.filter((v) => v?.length > 0);
      this.jsonEditor.setEnum(enumEm.name, enumEm.values);
    }, 50);
  }
  removeExtraEnum(enumEm: OutputEnumDTO) {
    this.jsonEditor.deleteEnum(enumEm.name);
  }

  onSchemaChange(schema: OutputSchemaDTO) {
    this.prismaData = schema;
    this.parseDTOSchema();
  }
  prismaModels: Array<ModelType> = [];

  excludeModels: Array<string> = [];
  excludeModelsChanged(e: MultiSelectChangeEvent) {
    const models = e.value as Array<string>;
    this.dtoData!.excludeModels = models;
    this.jsonEditor.updateSourceSchema(schema => {
      return {
        ...schema,
        excludeModels: models
      };
    });
  }
  excludeOutputModelsChanged(e: MultiSelectChangeEvent) {
    const models = e.value as Array<string>;
    this.dtoData!.output!.excludeModels = models;
    this.jsonEditor.updateSourceSchema(schema => {
      return {
        ...schema,
        output: {
          ...schema.output,
          excludeModels: models
        }
      };
    });
  }
  excludeInputModelsChanged(e: MultiSelectChangeEvent) {
    const models = e.value as Array<string>;
    this.dtoData!.input!.excludeModels = models;
    this.jsonEditor.updateSourceSchema(schema => {
      return {
        ...schema,
        input: {
          ...schema.input,
          excludeModels: models
        }
      };
    });
  }
  parseDTOSchema() {
    if (this.dtoData && this.prismaData) {
      const data = parseDtoSchema(this.dtoData, this.prismaData!);
      const globalExtendModels = this.dtoData?.excludeModels || [];
      this.prismaModels = this.prismaData?.models || [];
      if (globalExtendModels.length > 0) {
        const extendModels = [];
        for (const exModel of globalExtendModels) {
          if (this.prismaModels.find((m) => m.name === exModel)) {
            extendModels.push(exModel);
          }
        }
        this.excludeModels = extendModels;
      }

      this.extraEnums = data.extraEnums;
      this.extraModels = data.extraModels;
      this.inputModels = data.inputModels;
      this.outputModels = data.outputModels;
      this.lists = data.lists;
      if (this.dtoData?.input?.excludeModels) {
        this.excludeModelsInput = this.dtoData?.input?.excludeModels;
      }
      if (this.dtoData?.output?.excludeModels) {
        this.excludeModelsOutput = this.dtoData?.output?.excludeModels;
      }
      if (this.dtoData?.input?.excludeFields) {
        this.excludeFieldsInput = this.dtoData?.input?.excludeFields;
      }
      if (this.dtoData?.output?.excludeFields) {
        this.excludeFieldsOutput = this.dtoData?.output?.excludeFields;
      }
    }
  }
  onDtoChanged(schema: PrismaClassDTOGeneratorConfig) {
    this.dtoData = schema;
    this.parseDTOSchema();
  }



  updateExtraField(model: ModelType, field: ModelField) {
    this.jsonEditor.updateExtraModelField(model.name, field);
  }

  deleteExtraField(model: ModelType, field: ModelField) {
    this.jsonEditor.deleteExtraModelField(model.name, field.name);
  }

  submenuActiveItemId: string = '1';
  submenus: Array<MenuItem> = [
    {
      id: '1',
      label: 'Base config',
      icon: 'pi pi-cog',
      command: (event) => {
        event?.originalEvent?.preventDefault();
        this.submenuActiveItemId = event.item?.id!;
      }
    },
    {
      id: '2',
      label: 'Extra',
      icon: 'pi pi-box',
      command: (event) => {
        event?.originalEvent?.preventDefault();
        this.submenuActiveItemId = event.item?.id!;
      }
    },
    {
      id: '3',
      label: 'Input Models',
      icon: 'pi pi-arrow-down',
      command: (event) => {
        event?.originalEvent?.preventDefault();
        this.submenuActiveItemId = event.item?.id!;
      }
    },
    {
      id: '4',
      label: 'Output Models',
      icon: 'pi pi-arrow-up',
      command: (event) => {
        event?.originalEvent?.preventDefault();
        this.submenuActiveItemId = event.item?.id!;
      }
    },
    {
      id: '5',
      label: 'Lists',
      icon: 'pi pi-list',
      command: (event) => {
        event?.originalEvent?.preventDefault();
        this.submenuActiveItemId = event.item?.id!;
      }
    }
  ];
  menus: Array<MenuItem> = [
    {
      id: '1',
      label: 'Prisma Schema',
      icon: 'pi pi-fw pi-file',
      command: (event) => {
        event?.originalEvent?.preventDefault();
        this.activeItemId = event.item?.id!;
      }
    },
    {
      id: '2',
      label: 'DTO Configuration',
      icon: 'pi pi-fw pi-cog',
      command: (event) => {
        event?.originalEvent?.preventDefault();
        this.activeItemId = event.item?.id!;
      }
    }
  ]
}
