import {SchemaPath, validate} from '@angular/forms/signals';

export function uniqueNameValidator(path: SchemaPath<string>, existingNames: string[]) {

  validate(path, ({value}) => {
    const unique = !existingNames.includes(value());
    return unique ? null : {kind: 'name', message: 'Name needs to be unique'};
  })


}
