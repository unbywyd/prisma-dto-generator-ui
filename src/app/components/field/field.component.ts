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
  @Input() extraModelNames: Array<string> = [];
  @Input() modelNames: Array<string> = [];
  @Input() simpleTypesMode: boolean = false;
  @Input() enums: Array<string> = [];
  @Input() isPrismaField: boolean = false;
  id: string = '';
  @Output() onChange: EventEmitter<ModelField> = new EventEmitter<ModelField>();


  get modelNameOptions() {
    return this.isExtra ? this.extraModelNames : this.modelNames;
  }
  name: string = '';

  form: FormGroup = new FormGroup({
    name: new FormControl({
      disabled: true,
      value: '',
    }),
    type: new FormControl('', [relationNameValidator, (control: AbstractControl) => {
      const form = this.form;
      const type = control.value;

      if (form) {
        const fieldTypeValue = form.get('fieldType')?.value;
        const isEnum = fieldTypeValue === 'Enum';
        const isRelation = fieldTypeValue === 'Relation';
        if (!isEnum && !isRelation) {
          return null;
        }
        if (fieldTypeValue === 'Relation') {
          const options = this.modelNameOptions;
          if (!options.includes(type)) {
            return { requiredForRelation: true };
          }
        } else if (fieldTypeValue === 'Enum') {
          const options = this.enums;
          if (!options.includes(type)) {
            return { requiredForEnum: true };
          }
        }
      }
      return null;
    }]),
    fieldType: new FormControl('', Validators.required),
    kind: new FormControl(''),
    isRequired: new FormControl(false),
    relationName: new FormControl('', relationNameValidator),
    isExtra: new FormControl(false),
    isList: new FormControl(false),
  });




  get isRelation(): boolean {
    return this.form.get('fieldType')?.value === 'Relation';
  }
  get isEnum(): boolean {
    return this.form.get('fieldType')?.value === 'Enum';
  }
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
    value.isList = value.isList || false;
    value.isExtra = value.isExtra || false;

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
  sub4: Subscription | undefined;
  ngOnInit(): void {
    this.buildTypes();
    this.id = 'f_' + Math.random().toString(36).substring(7);

    this.sub1 = this.form.get('fieldType')?.valueChanges.subscribe((value) => {
      const type = this.form.get('type')?.value;

      if (value == "Relation" && !this.modelNameOptions.includes(type)) {
        this.form.get('type')?.reset('', { emitEvent: false });
        this.form.get('type')?.updateValueAndValidity({ emitEvent: false });
      }
      if (value == "Enum" && !this.enums.includes(type)) {
        this.form.get('type')?.reset('', { emitEvent: false });
        this.form.get('type')?.updateValueAndValidity({ emitEvent: false });
      }
      if (type) {
        if (value !== 'Relation' && value !== 'Enum') {
          this.form.get('type')?.setValue(value);
          //this.form.get('relationName')?.updateValueAndValidity({ emitEvent: false });
        }
        this.form.get('type')?.updateValueAndValidity({ emitEvent: false });
      }
    });

    this.sub3 = this.form.get('isExtra')?.valueChanges.subscribe((value) => {
      //const type = this.form.get('type')?.value;
      this.form.get('type')?.reset('', { emitEvent: false });
      this.form.get('type')?.updateValueAndValidity({ emitEvent: false });
    });
    this.sub4 = this.form.get('type')?.valueChanges.subscribe((value) => {
      if (this.isRelation && value) {
        this.form.get('relationName')?.setValue(value);
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
      isRequired: value.isRequired,
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
    if (value.isList) {
      field.isList = value.isList;
    }


    this.onChange.emit(field as ModelField);
  }
  get isFileType() {
    return this.form.get('fieldType')?.value === 'File';
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
    if (this.sub4) {
      this.sub4?.unsubscribe();
    }
  }

  fieldTypes: Array<string> = [
    "String",
    "Int",
    "Float",
    "Boolean",
    "DateTime",
    "File",
    "Enum",
    "Relation"
  ];

  buildTypes() {
    if (this.simpleTypesMode) {
      this.fieldTypes = [
        "String",
        "Int",
        "Float",
        "Boolean",
        "DateTime",
        "Enum"
      ];
    } else {
      this.fieldTypes = [
        "String",
        "Int",
        "Float",
        "Boolean",
        "DateTime",
        "File",
        "Enum",
        "Relation"
      ];
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if ("simpleTypesMode" in changes) {
      this.buildTypes();
    }
  }

  constructor() { }
}
