import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import "flex-layout-system";
import { EditorComponent } from './components/editor/editor.component';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { JsonEditorComponent } from './components/json-editor/json-editor.component';
import { OutputEnumDTO, OutputFieldDTO, OutputModelDTO, OutputSchemaDTO } from '../generated/openapi';
import { CardModule } from 'primeng/card';
import { ListItem, ModelField, ModelType, parseDtoSchema, PrismaClassDTOGeneratorConfig } from './dto-parser';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { FieldComponent } from './components/field/field.component';



@Component({
  selector: 'app-root',
  imports: [
    InputTextModule,
    CheckboxModule,
    SelectModule,
    DialogModule,
    FormsModule,
    AutoCompleteModule,
    FieldComponent,
    EditorComponent, ButtonModule, CardModule, MenubarModule, JsonEditorComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
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

  prismaData: OutputSchemaDTO | null = null;
  dtoData: PrismaClassDTOGeneratorConfig | null = null;
  inputModels: Array<ModelType> = [];
  outputModels: Array<ModelType> = [];
  lists: Array<ListItem> = [];

  showAddEnumDialog: boolean = false;

  newEnumName: string = "";
  newEnumValues: Array<string> = [];

  addEnum(e: Event) {
    e?.preventDefault();
    this.jsonEditor.setEnum(this.newEnumName, this.newEnumValues);
    this.newEnumName = "";
    this.newEnumValues = [];
    this.showAddEnumDialog = false;
  }
  removeExtraModel(model: ModelType) {
    this.jsonEditor.deleteExtraModel(model.name);
  }
  onSelectEnums(e: any) {
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
  parseDTOSchema() {
    if (this.dtoData && this.prismaData) {
      const data = parseDtoSchema(this.dtoData, this.prismaData!);

      this.extraEnums = data.extraEnums;
      this.extraModels = data.extraModels;
      this.inputModels = data.inputModels;
      this.outputModels = data.outputModels;
      this.lists = data.lists;
      console.log(data);
    }
  }
  onDtoChanged(schema: PrismaClassDTOGeneratorConfig) {
    this.dtoData = schema;
    this.parseDTOSchema();
  }

  updateExtraField(model: ModelType, field: ModelField) {
    console.log(model, field);
    this.jsonEditor.updateExtraModelField(model.name, field);
  }

  deleteExtraField(model: ModelType, field: ModelField) {
    this.jsonEditor.deleteExtraModelField(model.name, field.name);
  }

  submenuActiveItemId: string = '1';
  submenus: Array<MenuItem> = [
    {
      id: '1',
      label: 'DTO Builder',
      icon: 'pi pi-fw pi-file',
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
