import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ModelField, ModelType } from '../../dto-parser';
import { OutputEnumDTO, OutputSchemaDTO } from '../../../generated/openapi';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, RequiredValidator, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

function relationNameValidator(control: AbstractControl) {
  const form = control.parent as FormGroup;

  if (form) {
    const fieldTypeValue = form.get('fieldType')?.value;
    if (fieldTypeValue === 'Relation' && !control.value) {
      return { requiredForRelation: true };
    }
  }

  return null;
}


@Component({
  selector: 'app-field',
  imports: [
    InputTextModule,
    CheckboxModule,
    SelectModule,
    DialogModule,
    ReactiveFormsModule,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  templateUrl: './field.component.html',
  styleUrl: './field.component.scss',
  standalone: true
})
export class FieldComponent {
  @Input() extraEnums: Array<OutputEnumDTO> = [];
  @Input() extraModels: Array<ModelType> = [];
  models: Array<string> = [];
  enums: Array<string> = [];
  extraModelsOptions: Array<string> = [];
  extraEnumsOptions: Array<string> = [];

  @Input() prismaData: OutputSchemaDTO | null = null;
  id: string = '';
  @Output() onChange: EventEmitter<ModelField> = new EventEmitter<ModelField>();


  get activeTypeModels() {
    if (this.isEnum) {
      return this.isExtra ? this.extraEnumsOptions : this.enums;
    } else if (this.isRelation) {
      return this.isExtra ? this.extraModelsOptions : this.models;
    }
    return this.models;
  }
  name: string = '';

  form: FormGroup = new FormGroup({
    name: new FormControl({
      disabled: true,
      value: '',
    }),
    type: new FormControl('', [relationNameValidator, (control: AbstractControl) => {
      const form = this.form;
      const options = this.activeTypeModels;
      if (form) {
        const fieldTypeValue = form.get('fieldType')?.value;
        if (fieldTypeValue === 'Relation' && !options.includes(control.value)) {
          return { requiredForRelation: true };
        }
      }
      return null;
    }]),
    fieldType: new FormControl('', Validators.required),
    kind: new FormControl(''),
    isRequired: new FormControl(false),
    relationName: new FormControl('', relationNameValidator),
    isExtra: new FormControl(false),
  });

  ngOnChanges(changes: SimpleChanges) {
    if ("prismaData" in changes) {
      this.models = this.prismaData?.models.map((model) => model.name) || [];
      this.enums = this.prismaData?.enums.map((enumItem) => enumItem.name) || [];
    }
    if ("extraModels" in changes) {
      this.extraModelsOptions = this.extraModels.map((model) => model.name);
    }
    if ("extraEnums" in changes) {
      this.extraEnumsOptions = this.extraEnums.map((enumItem) => enumItem.name);
    }
  }

  isRelation: boolean = false;
  isEnum: boolean = false;
  @Input() set field(value: ModelField) {
    let fieldType = value.type;
    if (value.type == "Json") {
      value.type = "String";
      fieldType = "String";
    }
    if (value.type == "UUID") {
      value.type = "String";
      fieldType = "String";
    }
    if (value.type == "BigInt") {
      value.type = "Int";
      fieldType = "Int";
    }
    if (value.type == "Decimal") {
      value.type = "Float";
      fieldType = "Float";
    }
    if (value.kind == "enum") {
      fieldType = "Enum";
    }
    if (value.relationName) {
      fieldType = "Relation";
    }
    this.name = value.name;

    value.isRequired = value.isRequired || false;
    value.isExtra = value.isExtra || false;
    this.isEnum = value.kind == "enum";
    this.isRelation = value.relationName ? true : false;

    this.form.patchValue({
      ...value,
      fieldType,
    }, { emitEvent: false });
  }

  get isExtra(): boolean {
    return this.form.get('isExtra')?.value;
  }

  sub1: Subscription | undefined;
  sub2: Subscription | undefined;
  sub3: Subscription | undefined;
  ngOnInit(): void {
    this.models = this.prismaData?.models.map((model) => model.name) || [];
    this.enums = this.prismaData?.enums.map((enumItem) => enumItem.name) || [];
    this.extraModelsOptions = this.extraModels.map((model) => model.name);
    this.extraEnumsOptions = this.extraEnums.map((enumItem) => enumItem.name);
    this.id = 'f_' + Math.random().toString(36).substring(7);

    this.sub1 = this.form.get('fieldType')?.valueChanges.subscribe((value) => {
      if (value == "Relation" || value == "Enum") {
        const type = this.form.get('type')?.value;
        if (!this.activeTypeModels.includes(type)) {
          this.form.get('type')?.reset('', { emitEvent: false });
          this.form.get('type')?.updateValueAndValidity({ emitEvent: false });
        } else {
          this.form.get('type')?.setValue(type, { emitEvent: false });
          this.form.get('type')?.updateValueAndValidity({ emitEvent: false });
        }
      } else {
        this.form.get('type')?.setValue(value, { emitEvent: false });
        this.form.get('type')?.updateValueAndValidity({ emitEvent: false });
      }
      if (value === 'Relation') {
        this.isRelation = true;
        this.isEnum = false;
      } else if (value === 'Enum') {
        this.isEnum = true;
        this.isRelation = false;
      } else {
        this.isRelation = false;
        this.isEnum = false;
      }
    });
    this.sub3 = this.form.get('isExtra')?.valueChanges.subscribe((value) => {
      const type = this.form.get('type')?.value;
      if (!this.activeTypeModels.includes(type)) {
        this.form.get('type')?.reset('', { emitEvent: false });
        this.form.get('type')?.updateValueAndValidity({ emitEvent: false });
      }
    });
    this.sub2 = this.form.valueChanges.subscribe((value) => {
      this.form.markAllAsTouched();
      this.form.markAsDirty();
      if (this.form.valid) {
        this.buildField();
      }
    });
  }

  buildField() {
    const value = this.form.value;
    const kind = value.fieldType === 'Enum' ? 'enum' : value.fieldType === 'Relation' ? 'object' : 'scalar';
    const field: Partial<ModelField> = {
      name: this.name,
      type: value.type,
      isRequired: value.isRequired
    };
    if (value.fieldType === 'Relation') {
      field.relationName = value.relationName;
    }
    if (kind === 'enum') {
      field.kind = kind;
    }
    if (value.isExtra) {
      field.isExtra = value.isExtra;
    }

    this.onChange.emit(field as ModelField);
  }

  ngOnDestroy() {
    if (this.sub1) {
      this.sub1?.unsubscribe();
    }
    if (this.sub2) {
      this.sub2?.unsubscribe();
    }
    if (this.sub3) {
      this.sub3?.unsubscribe();
    }
  }

  fieldTypes: Array<string> = [
    "String",
    "Int",
    "Float",
    "Boolean",
    "DateTime",
    "File",
    //"Json",
    //"UUID",    
    //"BigInt",
    //"Decimal",
    "Enum",
    "Relation"
  ];

  constructor() { }
}
