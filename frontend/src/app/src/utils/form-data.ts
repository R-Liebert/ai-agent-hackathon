
export function objectToFormData(
    obj: Record<string, any>,
    form: FormData = new FormData(),
    parentKey?: string
  ): FormData {
    if (obj === null || obj === undefined) return form;
  
    for (const [key, value] of Object.entries(obj)) {
      const formKey = parentKey ? `${parentKey}[${key}]` : key;
  
      if (value instanceof File) {
        form.append(formKey, value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const arrayKey = `${formKey}[${index}]`;
          if (item instanceof File) {
            form.append(arrayKey, item);
          } else if (typeof item === 'object' && item !== null) {
            objectToFormData(item, form, arrayKey);
          } else {
            form.append(arrayKey, item?.toString() ?? '');
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        objectToFormData(value, form, formKey);
      } else if (value !== undefined && value !== null) {
        form.append(formKey, value.toString());
      }
    }
  
    return form;
  }
