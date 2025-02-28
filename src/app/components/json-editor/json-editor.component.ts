import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import JSONEditor, { JSONEditorOptions } from 'jsoneditor';
import { ListItem, ModelField, ModelType, PrismaClassDTOGeneratorConfig } from '../../dto-parser';
import { OutputSchemaDTO } from '../../../generated/openapi';

function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}


@Component({
  selector: 'app-json-editor',
  imports: [],
  templateUrl: './json-editor.component.html',
  styleUrl: './json-editor.component.scss'
})
export class JsonEditorComponent {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;

  @Input() prismaData: OutputSchemaDTO | null = null;
  private editor!: JSONEditor;
  @Input() value: any;
  @Output() valueChange = new EventEmitter<any>();

  currentState: PrismaClassDTOGeneratorConfig = {} as PrismaClassDTOGeneratorConfig;
  ngOnInit(): void {
    const options: JSONEditorOptions = {
      mode: 'code', // Можно использовать 'view', 'tree', 'code', 'text'
      onChange: () => {
        try {
          const state = this.getJSON();
          this.setCurrentState(state);
        } catch (e) {
        }
      },
    };

    this.editor = new JSONEditor(this.editorContainer.nativeElement, options);
    if (this.value) {
      this.setStateToEditor(this.value);
    } else {
      this.restoreLocal();
      this.valueChange.emit(this.currentState);
    }
  }

  setCurrentState(state: PrismaClassDTOGeneratorConfig) {
    this.currentState = state as PrismaClassDTOGeneratorConfig;
    this.saveLocal(state);
    this.valueChange.emit(state);
  }

  setStateToEditor(state: any) {
    this.editor.set(state);
    this.setCurrentState(state);
  }

  addExtraModel(_modelName: string, type: 'input' | 'output'): void {
    const modelName = capitalizeFirstLetter(_modelName);
    const state = this.currentState;

    if (!state.extra) {
      state.extra = {};
    }
    if (!state.extra.models) {
      state.extra.models = {};
    }
    state.extra.models[modelName] = {
      type: type,
      fields: []
    };
    this.setJSON(state);
  }
  addInputModel(model: ModelType) {
    this.provideEmptyInputModel(model.name);

    if (model.fields?.length) {
      const prismaFields = this?.prismaData?.models?.find(m => m.name === model.name)?.fields;
      this.addFieldsToInputModel(model.name, prismaFields || model.fields);
    }
  }
  addOutputModel(model: ModelType) {
    this.provideEmptyOutputModel(model.name);
    if (model.fields?.length) {
      this.addFieldsToOutputModel(model.name, model.fields);
    }
  }
  provideEmptyOutputModel(_modelName: string): void {
    const modelName = capitalizeFirstLetter(_modelName);
    const state = this.currentState;
    if (!state.output) {
      state.output = {
        extendModels: {},
        includeModelFields: {}
      };
    }
    if (!state.output?.includeModelFields) {
      state.output.includeModelFields = {};
    }
    state.output.includeModelFields![modelName] = [];
    this.setJSON(state);
  }
  updateOutputModelField(modelName: string, field: ModelField): void {
    const state = this.currentState;
    const fields = state.output?.includeModelFields?.[modelName] || [];

    const index = fields.findIndex(f => typeof f === 'string' ? f === field.name : f.name === field.name);
    if (index !== -1) {
      fields[index] = this.prepareField(field);
      state.output!.includeModelFields![modelName] = fields;
      this.setJSON(state);
    }
  }
  addFilterFieldToList(listName: string, field: ModelField): void {
    const state = this.currentState;
    if (state.lists) {
      const list = state.lists[listName];
      if (list) {
        if (!list.filters) {
          list.filters = [];
        }
        list.filters.push(field);

        this.setJSON(state);
      }
    }
  }
  updateListFilter(listName: string, field: ModelField): void {

    const state = this.currentState;
    if (state.lists) {
      const list = state.lists[listName];
      if (list) {
        const filters = list.filters || [];
        const index = filters.findIndex(f => typeof f === 'string' ? f === field.name : f.name === field.name);
        if (index !== -1) {
          filters[index] = field;
          list.filters = filters;
          this.setJSON(state);
        }
      }
    }
  }
  deleteListFilter(listName: string, fieldName: string) {
    const state = this.currentState;
    if (state.lists) {
      const list = state.lists[listName];
      if (list) {
        const filters = list.filters || [];
        list.filters = filters.filter(f => typeof f === 'string' ? f !== fieldName : f.name !== fieldName);
        this.setJSON(state);
      }
    }
  }
  addFieldsToOutputModel(modelName: string, _fields: Array<ModelField>): void {
    let fields = this.filterFieldKeys(_fields);
    const state = this.currentState;
    const excludeFields = state.output?.excludeFields || [];
    fields = fields.filter(f => !excludeFields.includes(f.name));
    if (!fields.length) {
      return;
    }
    if (!state.output) {
      state.output = {
        extendModels: {},
        includeModelFields: {}
      };
    }
    if (!state.output?.includeModelFields) {
      state.output.includeModelFields = {};
    }
    const fieldsList = (state.output.includeModelFields![modelName] || []);
    const existFields = fieldsList.map(f => typeof f === 'string' ? f : f.name);

    const makeFieldsOptional = state.output.makeFieldsOptional || false;
    if (makeFieldsOptional) {
      fields.forEach(f => {
        delete (f as any).isRequired
      });
    }
    const includdeRelations = state.output.includeRelations || false;
    if (!includdeRelations) {
      fields = fields.filter(f => !f.relationName);
    }
    for (const field of fields) {
      if (!existFields.includes(field.name)) {
        fieldsList.push(field);
      }
    }
    state.output.includeModelFields![modelName] = fieldsList;
    this.setJSON(state);
  }
  addFieldsToInputModel(modelName: string, _fields: Array<ModelField>): void {
    const state = this.currentState;

    const excludeFields = state.input?.excludeFields || [];

    const excludeIdField = state.input?.excludeIdFields || false;
    const excludeIdRelationFields = state.input?.excludeIdRelationFields || false;
    const excludeDateAtFields = state.input?.excludeDateAtFields || false;

    let fields = _fields.filter(f => {

      if (excludeFields.includes(f.name)) {
        return false;
      }
      if (excludeIdField && f?.isId) {
        return false;
      }
      if (excludeDateAtFields && f.type == 'DateTime' && f.name.toLowerCase().endsWith('at')) {
        return false;
      }
      if (excludeIdRelationFields && f.type == "String" && f.name.endsWith("Id")) {
        return false;
      }

      return true;
    });
    if (!fields.length) {
      return
    }
    fields = this.filterFieldKeys(fields);
    if (!state.input) {
      state.input = {
        extendModels: {},
        includeModelFields: {}
      };
    }
    if (!state.input?.includeModelFields) {
      state.input.includeModelFields = {};
    }
    const fieldsList = (state.input.includeModelFields![modelName] || []);
    const existFields = fieldsList.map(f => typeof f === 'string' ? f : f.name);

    const makeFieldsOptional = state.input.makeFieldsOptional || false;
    if (makeFieldsOptional) {
      fields.forEach(f => {
        delete (f as any).isRequired
      });
    }
    const includdeRelations = state.input.includeRelations || false;
    if (!includdeRelations) {
      fields = fields.filter(f => !f.relationName);
    }
    for (const field of fields) {
      if (!existFields.includes(field.name)) {
        fieldsList.push(field);
      }
    }
    state.input.includeModelFields![modelName] = fieldsList;
    this.setJSON(state);
  }
  updateInputModelField(modelName: string, field: ModelField): void {
    const state = this.currentState;
    const fields = state.input?.includeModelFields?.[modelName] || [];

    const index = fields.findIndex(f => typeof f === 'string' ? f === field.name : f.name === field.name);
    if (index !== -1) {
      fields[index] = this.prepareField(field);
      state.input!.includeModelFields![modelName] = fields;
      this.setJSON(state);
    }
  }
  removeInputModelField(modelName: string, fieldName: string): void {
    const state = this.currentState;
    if (state?.input?.includeModelFields) {
      state.input.includeModelFields[modelName] = state.input.includeModelFields[modelName].filter(f => typeof f === 'string' ? f !== fieldName : f.name !== fieldName);
    }
    this.setJSON(state);
  }
  removeOutputModelField(modelName: string, fieldName: string): void {
    const state = this.currentState;
    if (state?.output?.includeModelFields) {
      state.output.includeModelFields[modelName] = state.output.includeModelFields[modelName].filter(f => typeof f === 'string' ? f !== fieldName : f.name !== fieldName);
    }
    this.setJSON(state);
  }
  addInputModelField(modelName: string, _field: ModelField): void {
    const field = this.prepareField(_field);
    const state = this.currentState;
    const excludeFields = state.input?.excludeFields || [];
    if (excludeFields.includes(field.name)) {
      return;
    }
    const makeFieldsOptional = state.input.makeFieldsOptional || false;
    if (makeFieldsOptional) {
      delete (field as any).isRequired
    }
    const fields = state.input?.includeModelFields?.[modelName] || [];
    if (!fields.find(f => typeof f === 'string' ? f === field.name : f.name === field.name)) {
      fields.push(field);
      state.input!.includeModelFields![modelName] = fields;
      this.setJSON(state);
    }
  }
  addOutputModelField(modelName: string, _field: ModelField): void {
    const field = this.prepareField(_field);
    const state = this.currentState;
    const excludeFields = state.output?.excludeFields || [];
    if (excludeFields.includes(field.name)) {
      return
    }
    const fields = state.output?.includeModelFields?.[modelName] || [];
    const makeFieldsOptional = state.output.makeFieldsOptional || false;
    if (makeFieldsOptional) {
      delete (field as any).isRequired
    }
    if (!fields.find(f => typeof f === 'string' ? f === field.name : f.name === field.name)) {
      fields.push(field);
      state.output!.includeModelFields![modelName] = fields;
      this.setJSON(state);
    }
  }
  provideEmptyInputModel(_modelName: string): void {
    const modelName = capitalizeFirstLetter(_modelName);
    const state = this.currentState;
    if (!state.input) {
      state.input = {
        extendModels: {},
        includeModelFields: {}
      };
    }
    if (!state.input?.includeModelFields) {
      state.input.includeModelFields = {};
    }
    state.input.includeModelFields![modelName] = [];
    this.setJSON(state);
  }
  removeOutputModel(modelName: string): void {
    const state = this.currentState;
    if (state.output?.extendModels) {
      delete state.output.extendModels[modelName];
    }
    if (state.output?.includeModelFields) {
      delete state.output.includeModelFields[modelName];
    }
    this.setJSON(state);
  }
  removeInputModel(modelName: string): void {
    const state = this.currentState;
    if (state.input?.extendModels) {
      delete state.input.extendModels[modelName];
    }
    if (state.input?.includeModelFields) {
      delete state.input.includeModelFields[modelName];
    }
    this.setJSON(state);
  }
  prepareField(field: ModelField): ModelField {
    const keys = ['name', 'type', 'kind', 'options', 'isList', 'isRequired', 'isExtra', 'relationName'];
    for (const key in field) {
      if (!keys.includes(key)) {
        delete (field as any)[key];
      }
    }
    if ("scalar" == field.kind) {
      delete (field as any).kind;
    }
    if (field.isExtra === false) {
      delete (field as any).isExtra
    }
    if (field.isList === false) {
      delete (field as any).isList
    }
    if (field.type == 'File' && !field.options) {
      field.options = {
        //name: field.name,
        maxSize: '10mb',
        minSize: '1kb',
        maxFiles: 5,
        minFiles: 1,
        mimeTypes: ["^image\\/.*$", "^video\\/.*$", "^application\\/pdf$"]
      }
    }
    return field;
  }
  deleteList(listName: string): void {
    const state = this.currentState;
    if (state.lists) {
      delete state.lists[listName];
    }
    this.setJSON(state);
  }
  createEmptyList(_listName: string): void {
    const listName = capitalizeFirstLetter(_listName);
    const state = this.currentState;
    if (!state.lists) {
      state.lists = {};
    }
    state.lists[listName] = {
      pagination: true,
      orderable: true,
      filters: [],
      outputModelName: `Output${listName}`
    }
    this.setJSON(state);
  }
  filterFieldKeys(fields: Array<ModelField>): Array<ModelField> {
    for (const field of fields) {
      this.prepareField(field);
    }
    return fields;
  }
  addFieldToExtraModel(modelName: string, field: ModelField): void {
    const state = this.currentState;
    const preparedField = this.prepareField(field);
    const models = state.extra?.models || {};

    const prev = modelName in models ? models[modelName] : null;
    if (prev) {
      const fields = prev.fields || [];
      if (!fields.find(f => f.name === preparedField.name)) {
        fields.push(preparedField);
      }
      (state.extra!.models as any)[modelName].fields = fields;
      this.setJSON(state);
    }
  }

  updateSourceSchema(cb: (schema: PrismaClassDTOGeneratorConfig) => PrismaClassDTOGeneratorConfig): void {
    const state = this.currentState;
    this.setJSON(cb(state));
  }
  updateExtraModelField(modelName: string, _field: ModelField): void {
    const field = this.prepareField(_field);
    const state = this.currentState;

    const models = state.extra?.models || {};

    const prev = modelName in models ? models[modelName] : null;
    if (prev) {
      const fields = prev.fields || [];
      const index = fields.findIndex(f => f.name === field.name);
      if (index !== -1) {
        fields[index] = field;
        (state.extra!.models as any)[modelName].fields = fields;
        this.setJSON(state);
      }
    }
  }
  deleteExtraModelField(modelName: string, fieldName: string): void {
    const state = this.currentState;
    if (state?.extra?.models) {
      const model = state.extra.models[modelName];
      if (model) {
        model.fields = model.fields.filter(f => f.name !== fieldName);
      }
    }
    this.setJSON(state);
  }
  deleteExtraModel(modelName: string): void {
    const state = this.currentState;
    if (state?.extra?.models) {
      delete state.extra.models[modelName];
    }
    this.setJSON(state);
  }
  saveLocal(value: any) {
    try {
      const data = JSON.stringify(value);
      localStorage.setItem('prisma_dto_json', data);
    } catch (e) { }
  }

  restoreLocal() {
    const local = localStorage.getItem('prisma_dto_json');
    try {
      if (local) {
        this.setJSON(JSON.parse(local));
        /*this.currentState = JSON.parse(local);
        this.valueChange.emit(this.currentState);*/
      }
    } catch (e) {
    }
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.destroy();
    }
  }

  public updateExtraOptions(options: Record<string, any>): void {
    const state = this.currentState;
    if (!state.extra) {
      state.extra = {};
    }
    if (!state.extra.options) {
      state.extra.options = {};
    }
    Object.assign(state.extra.options, options);
    this.setJSON(state);
  }

  updateList(listItem: ListItem): void {
    if (listItem.modelName) {
      const state = this.currentState;
      if (!state.lists) {
        state.lists = {};
      }
      state.lists[listItem.modelName!] = {
        pagination: listItem.pagination || false,
        orderable: listItem?.orderable && (Array.isArray(listItem.orderableList) && listItem?.orderableList.length) ? listItem.orderableList : listItem.orderable,
        outputModelName: listItem.outputModelName,
        filters: listItem.filters || []
      }
      this.setJSON(state);
    }
  }



  public deleteEnum(name: string): void {
    const state = this.currentState;
    if (state?.extra?.enums) {
      delete state.extra.enums[name];
    }
    this.setJSON(state);
    //this.valueChange.emit(state);
  }

  public updateExtraModel(modelName: string, handler: (data: ModelType) => ModelType): void {
    const state = this.currentState;

    const models = state.extra?.models || {};

    const prev = modelName in models ? models[modelName] : null;
    if (prev) {
      const model = handler(prev as ModelType);
      (state.extra!.models as any)[modelName] = model;
      this.setJSON(state);
      //this.valueChange.emit(state);
    }
  }
  public setEnum(_name: string, values: Array<string>): void {
    const name = capitalizeFirstLetter(_name);
    const state = this.currentState;
    if (!state.extra) {
      state.extra = {};
    }
    if (!state.extra.enums) {
      state.extra.enums = {};
    }
    state.extra.enums[name] = {
      values: values
    };
    this.setJSON(state);
    //this.valueChange.emit(state);
  }

  // Метод для получения JSON из редактора
  public getJSON(): any {
    return this.editor.get();
  }

  // Метод для обновления JSON в редакторе
  public setJSON(data: any): void {
    if ('string' === typeof data) {
      data = JSON.parse(data);
    }
    this.setStateToEditor(data);
  }
}
