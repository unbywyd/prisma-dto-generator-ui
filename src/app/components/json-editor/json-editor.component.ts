import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import JSONEditor, { JSONEditorOptions } from 'jsoneditor';
import { ModelField, ModelType, PrismaClassDTOGeneratorConfig } from '../../dto-parser';

@Component({
  selector: 'app-json-editor',
  imports: [],
  templateUrl: './json-editor.component.html',
  styleUrl: './json-editor.component.scss'
})
export class JsonEditorComponent {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;

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

  updateExtraModelField(modelName: string, field: ModelField): void {
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
  public setEnum(name: string, values: Array<string>): void {
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
