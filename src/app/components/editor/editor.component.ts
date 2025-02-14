import { SchemaService } from './../../../generated/openapi/api/schema.service';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { FormsModule } from '@angular/forms';
import { OutputSchemaDTO } from '../../../generated/openapi';

@Component({
  selector: 'app-editor',
  imports: [
    MonacoEditorModule,
    FormsModule,
  ],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent {
  @Input() value: string = ``;
  @Output() valueChange = new EventEmitter<any>();
  @Output() schemaData = new EventEmitter<OutputSchemaDTO>();
  constructor(public schemaService: SchemaService) { }
  editorInstance: any;
  editorOptions = { theme: 'vs-dark', language: 'prisma' };
  onEditorInit(editorInstance: any) {
    this.editorInstance = editorInstance;
    this.editorInstance.onDidChangeModelContent(() => {
      const currentSchema = this.editorInstance.getValue();
      this.validateSchema(currentSchema);
    });
    this.validateSchema(this.value);
    this.restoreLocal();
  }

  modelChanged(value: string) {
    this.saveLocal(value);
    this.valueChange.emit(value);
  }

  saveLocal(value: string) {
    try {
      localStorage.setItem('prisma_schema', value);
    } catch (e) {
    }
  }
  restoreLocal() {
    try {
      const data = localStorage.getItem('prisma_schema');
      if (data) {
        this.value = data;
        this.validateSchema(data);
      }
    } catch (e) {
    }
  }

  private validateSchema(schema: string) {
    this.schemaService.schemaControllerValidateSchema({ schema: schema }).subscribe((payload) => {
      const { errors, isValid, schema } = payload;
      const model = this.editorInstance.getModel();
      if (isValid) {
        this.schemaData.emit(schema);
      }
      if (model) {
        const markers = errors.map(err => ({
          message: err.reason,
          startLineNumber: Number(err.row),
          endLineNumber: Number(err.row),
          startColumn: 1,
          endColumn: 1,
          severity: 8,
        }));
        const editor = (window as any).monaco.editor;
        editor.setModelMarkers(model, 'schema', markers);
      }
    });
  }
}
