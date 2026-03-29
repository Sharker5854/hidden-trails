export function buildFormData(data) {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        formData.append(key, item);
      });
      return;
    }

    formData.append(key, value);
  });

  return formData;
}